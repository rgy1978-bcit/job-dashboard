"""
Job Board Scraper — Multi-Profile
Sources: Adzuna API, LinkedIn Guest API, USAJobs API,
         keyword RSS feeds (SimplyHired/Indeed), static RSS feeds.
"""

import os, json, hashlib, logging, time, re
from datetime import datetime, timezone
from pathlib import Path

import requests, yaml, feedparser
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

CONFIG_PATH = Path("config.yaml")
OUTPUT_PATH = Path("public/jobs.json")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


def load_config():
    with open(CONFIG_PATH) as f:
        return yaml.safe_load(f)

def make_id(title, company, url):
    return hashlib.md5(f"{title}|{company}|{url}".lower().encode()).hexdigest()[:12]

def load_existing(path):
    if path.exists():
        with open(path) as f:
            data = json.load(f)
        return {j["id"]: j for j in data.get("jobs", [])}
    return {}


# ── Adzuna ────────────────────────────────────────────────────────────────────

def fetch_adzuna(profile_id, keywords, location, config):
    app_id  = os.environ.get("ADZUNA_APP_ID", "")
    api_key = os.environ.get("ADZUNA_API_KEY", "")
    if not app_id or not api_key:
        log.warning("Adzuna credentials missing — skipping.")
        return []

    country  = config.get("adzuna", {}).get("country", "us")
    max_days = config.get("max_age_days", 14)
    results  = []

    for kw in keywords:
        log.info(f"Adzuna [{profile_id}]: '{kw}'")
        params = {
            "app_id": app_id, "app_key": api_key,
            "what": kw,
            "results_per_page": config.get("adzuna", {}).get("results_per_keyword", 20),
            "max_days_old": max_days,
            "content-type": "application/json",
        }
        if location:
            params["where"] = location
        try:
            r = requests.get(
                f"https://api.adzuna.com/v1/api/jobs/{country}/search/1",
                params=params, timeout=15
            )
            r.raise_for_status()
            for job in r.json().get("results", []):
                results.append({
                    "id":          make_id(job.get("title",""), job.get("company",{}).get("display_name",""), job.get("redirect_url","")),
                    "profile":     profile_id,
                    "title":       job.get("title","").strip(),
                    "company":     job.get("company",{}).get("display_name","Unknown"),
                    "location":    job.get("location",{}).get("display_name",""),
                    "description": job.get("description","")[:500],
                    "url":         job.get("redirect_url",""),
                    "source":      "Adzuna",
                    "keyword":     kw,
                    "salary_min":  job.get("salary_min"),
                    "salary_max":  job.get("salary_max"),
                    "remote":      "remote" in job.get("title","").lower() or "remote" in job.get("location",{}).get("display_name","").lower(),
                    "posted_at":   job.get("created",""),
                    "fetched_at":  datetime.now(timezone.utc).isoformat(),
                })
        except Exception as e:
            log.error(f"Adzuna error '{kw}': {e}")
        time.sleep(0.5)

    return results


# ── LinkedIn Guest API ────────────────────────────────────────────────────────
# Uses LinkedIn's public guest-facing endpoint — no login or API key needed.
# Legal precedent: hiQ Labs v. LinkedIn confirmed scraping public data is lawful.

def fetch_linkedin(profile_id, keywords, location, config):
    results  = []
    max_days = config.get("max_age_days", 14)
    # f_TPR: r86400=24h, r604800=7d, r2592000=30d
    time_filter = "r604800" if max_days <= 14 else "r2592000"

    for kw in keywords:
        log.info(f"LinkedIn [{profile_id}]: '{kw}'")
        params = {
            "keywords": kw,
            "f_TPR":    time_filter,
            "start":    0,
        }
        if location:
            params["location"] = location
        # Ellen's roles: also search remote
        if profile_id == "ellen":
            params["f_WT"] = "2"   # remote filter

        url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
        try:
            r = requests.get(url, params=params, headers=HEADERS, timeout=15)
            if r.status_code != 200:
                log.warning(f"LinkedIn returned {r.status_code} for '{kw}'")
                time.sleep(3)
                continue

            soup = BeautifulSoup(r.text, "html.parser")
            cards = soup.find_all("div", class_="base-card")

            for card in cards:
                title_el   = card.find("h3", class_="base-search-card__title")
                company_el = card.find("h4", class_="base-search-card__subtitle")
                loc_el     = card.find("span", class_="job-search-card__location")
                link_el    = card.find("a", class_="base-card__full-link")
                date_el    = card.find("time")

                title   = title_el.get_text(strip=True)   if title_el   else ""
                company = company_el.get_text(strip=True) if company_el else "Unknown"
                loc     = loc_el.get_text(strip=True)     if loc_el     else ""
                link    = link_el["href"].split("?")[0]   if link_el    else ""
                posted  = date_el.get("datetime","")      if date_el    else ""

                if not title:
                    continue

                results.append({
                    "id":          make_id(title, company, link),
                    "profile":     profile_id,
                    "title":       title,
                    "company":     company,
                    "location":    loc,
                    "description": "",   # would need a second request per job
                    "url":         link,
                    "source":      "LinkedIn",
                    "keyword":     kw,
                    "salary_min":  None,
                    "salary_max":  None,
                    "remote":      "remote" in loc.lower() or params.get("f_WT") == "2",
                    "posted_at":   posted,
                    "fetched_at":  datetime.now(timezone.utc).isoformat(),
                })

        except Exception as e:
            log.error(f"LinkedIn error '{kw}': {e}")

        time.sleep(2)   # respectful delay — LinkedIn rate-limits aggressively

    return results


# ── USAJobs REST API ──────────────────────────────────────────────────────────
# Free — register at https://developer.usajobs.gov to get an API key.
# Add USAJOBS_API_KEY and USAJOBS_EMAIL as GitHub Secrets.

def fetch_usajobs(profile_id, keywords, location, config):
    api_key = os.environ.get("USAJOBS_API_KEY", "")
    email   = os.environ.get("USAJOBS_EMAIL", "")
    if not api_key or not email:
        log.warning("USAJobs credentials missing — skipping. Get a free key at developer.usajobs.gov")
        return []

    results = []
    headers = {
        "Authorization-Key": api_key,
        "User-Agent":        email,
        "Host":              "data.usajobs.gov",
    }

    for kw in keywords:
        log.info(f"USAJobs [{profile_id}]: '{kw}'")
        params = {
            "Keyword":        kw,
            "ResultsPerPage": 25,
            "SortField":      "OpenDate",
            "SortDirection":  "Descending",
        }
        if location:
            params["LocationName"] = location

        try:
            r = requests.get(
                "https://data.usajobs.gov/api/Search",
                params=params, headers=headers, timeout=15
            )
            r.raise_for_status()
            items = r.json().get("SearchResult", {}).get("SearchResultItems", [])
            for item in items:
                pos  = item.get("MatchedObjectDescriptor", {})
                pay  = pos.get("PositionRemuneration", [{}])[0]
                locs = pos.get("PositionLocationDisplay","")

                results.append({
                    "id":          make_id(pos.get("PositionTitle",""), pos.get("OrganizationName",""), pos.get("PositionURI","")),
                    "profile":     profile_id,
                    "title":       pos.get("PositionTitle","").strip(),
                    "company":     pos.get("OrganizationName","Federal Agency"),
                    "location":    locs,
                    "description": pos.get("UserArea",{}).get("Details",{}).get("JobSummary","")[:500],
                    "url":         pos.get("PositionURI",""),
                    "source":      "USAJobs",
                    "keyword":     kw,
                    "salary_min":  float(pay.get("MinimumRange",0)) if pay.get("MinimumRange") else None,
                    "salary_max":  float(pay.get("MaximumRange",0)) if pay.get("MaximumRange") else None,
                    "remote":      "remote" in locs.lower() or "anywhere" in locs.lower(),
                    "posted_at":   pos.get("PublicationStartDate",""),
                    "fetched_at":  datetime.now(timezone.utc).isoformat(),
                })
        except Exception as e:
            log.error(f"USAJobs error '{kw}': {e}")
        time.sleep(0.5)

    return results


# ── Keyword RSS (SimplyHired, Indeed) ─────────────────────────────────────────

def fetch_keyword_rss(profile_id, keywords, location, config):
    templates = config.get("rss_feeds", [])
    results   = []
    for template in templates:
        for kw in keywords:
            url = (template
                   .replace("{keyword}",  requests.utils.quote(kw))
                   .replace("{location}", requests.utils.quote(location)))
            log.info(f"RSS [{profile_id}]: {url[:80]}")
            try:
                parsed = feedparser.parse(url)
                for entry in parsed.entries:
                    loc = entry.get("location","")
                    results.append({
                        "id":          make_id(entry.get("title",""), entry.get("author",""), entry.get("link","")),
                        "profile":     profile_id,
                        "title":       entry.get("title","").strip(),
                        "company":     entry.get("author", parsed.feed.get("title","Unknown")),
                        "location":    loc,
                        "description": entry.get("summary","")[:500],
                        "url":         entry.get("link",""),
                        "source":      parsed.feed.get("title","RSS"),
                        "keyword":     kw,
                        "salary_min":  None,
                        "salary_max":  None,
                        "remote":      "remote" in entry.get("title","").lower() or "remote" in loc.lower(),
                        "posted_at":   entry.get("published",""),
                        "fetched_at":  datetime.now(timezone.utc).isoformat(),
                    })
            except Exception as e:
                log.error(f"RSS error: {e}")
            time.sleep(0.3)
    return results


# ── Static RSS (HigherEdJobs, PTJobSite) ──────────────────────────────────────

def fetch_static_rss(profile_id, static_feeds):
    results = []
    for feed in static_feeds:
        url   = feed.get("url","")
        label = feed.get("label", url)
        log.info(f"Static RSS [{profile_id}] {label}")
        try:
            parsed = feedparser.parse(url)
            for entry in parsed.entries:
                loc = entry.get("location","")
                results.append({
                    "id":          make_id(entry.get("title",""), entry.get("author",""), entry.get("link","")),
                    "profile":     profile_id,
                    "title":       entry.get("title","").strip(),
                    "company":     entry.get("author", parsed.feed.get("title","Unknown")),
                    "location":    loc,
                    "description": entry.get("summary","")[:500],
                    "url":         entry.get("link",""),
                    "source":      label,
                    "keyword":     "—",
                    "salary_min":  None,
                    "salary_max":  None,
                    "remote":      "remote" in entry.get("title","").lower() or "remote" in loc.lower(),
                    "posted_at":   entry.get("published",""),
                    "fetched_at":  datetime.now(timezone.utc).isoformat(),
                })
        except Exception as e:
            log.error(f"Static RSS error ({label}): {e}")
        time.sleep(0.3)
    return results


# ── Keyword RSS with custom templates (for remote pass) ───────────────────────

def fetch_keyword_rss_custom(profile_id, keywords, templates):
    """Same as fetch_keyword_rss but accepts explicit template list."""
    results = []
    for template in templates:
        for kw in keywords:
            url = template.replace("{keyword}", requests.utils.quote(kw))
            log.info(f"RSS-remote [{profile_id}]: {url[:80]}")
            try:
                parsed = feedparser.parse(url)
                for entry in parsed.entries:
                    loc = entry.get("location","")
                    results.append({
                        "id":          make_id(entry.get("title",""), entry.get("author",""), entry.get("link","")),
                        "profile":     profile_id,
                        "title":       entry.get("title","").strip(),
                        "company":     entry.get("author", parsed.feed.get("title","Unknown")),
                        "location":    loc or "Remote",
                        "description": entry.get("summary","")[:500],
                        "url":         entry.get("link",""),
                        "source":      parsed.feed.get("title","RSS"),
                        "keyword":     kw,
                        "salary_min":  None,
                        "salary_max":  None,
                        "remote":      True,
                        "posted_at":   entry.get("published",""),
                        "fetched_at":  datetime.now(timezone.utc).isoformat(),
                    })
            except Exception as e:
                log.error(f"RSS-remote error: {e}")
            time.sleep(0.3)
    return results


# ── Main ──────────────────────────────────────────────────────────────────────

def run():
    config   = load_config()
    profiles = config.get("profiles", {})
    existing = load_existing(OUTPUT_PATH)
    merged   = {**existing}
    added    = 0

    for pid, prof in profiles.items():
        keywords        = prof.get("keywords", [])
        remote_keywords = prof.get("remote_keywords", [])
        location        = prof.get("location", "")
        static_feeds    = prof.get("static_rss", [])

        log.info(f"=== Profile: {pid} — {len(keywords)} onsite keywords, {len(remote_keywords)} remote keywords ===")

        # Onsite searches — scoped to Pittsburgh region
        new_jobs = (
            fetch_adzuna(pid, keywords, location, config)      +
            fetch_linkedin(pid, keywords, location, config)    +
            fetch_usajobs(pid, keywords, location, config)     +
            fetch_keyword_rss(pid, keywords, location, config) +
            fetch_static_rss(pid, static_feeds)
        )

        # Remote searches — no location filter, nationwide
        if remote_keywords:
            log.info(f"  → Remote pass [{pid}]: no location filter")
            remote_rss_templates = config.get("rss_feeds_remote", config.get("rss_feeds", []))
            new_jobs += (
                fetch_adzuna(pid, remote_keywords, "", config)         +
                fetch_linkedin(pid, remote_keywords, "", config)       +
                fetch_usajobs(pid, remote_keywords, "", config)        +
                fetch_keyword_rss_custom(pid, remote_keywords, remote_rss_templates)
            )

        for job in new_jobs:
            if job["id"] not in merged:
                merged[job["id"]] = job
                added += 1

    # Prune old jobs
    max_age = config.get("max_age_days", 30)
    now     = datetime.now(timezone.utc)
    kept    = [
        j for j in merged.values()
        if (now - datetime.fromisoformat(j["fetched_at"])).days <= max_age
    ]
    kept.sort(key=lambda j: j.get("fetched_at",""), reverse=True)

    # Build profile metadata for dashboard
    profile_meta = {
        pid: {
            "label":        prof.get("label"),
            "color":        prof.get("color"),
            "manual_links": prof.get("manual_links", []),
        }
        for pid, prof in profiles.items()
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump({
            "updated_at":   now.isoformat(),
            "total":        len(kept),
            "profile_meta": profile_meta,
            "jobs":         kept,
        }, f, indent=2)

    log.info(f"Done. +{added} new. Total: {len(kept)}. Saved → {OUTPUT_PATH}")


if __name__ == "__main__":
    run()

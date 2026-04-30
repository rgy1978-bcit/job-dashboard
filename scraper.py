"""
Job Board Scraper — Multi-Profile
Pulls from Adzuna API, keyword RSS feeds, and static RSS feeds.
Results saved to public/jobs.json for the React dashboard.
"""

import os, json, hashlib, logging, time
from datetime import datetime, timezone
from pathlib import Path

import requests, yaml, feedparser

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

CONFIG_PATH = Path("config.yaml")
OUTPUT_PATH = Path("public/jobs.json")


def load_config():
    with open(CONFIG_PATH) as f:
        return yaml.safe_load(f)

def make_id(title, company, url):
    raw = f"{title}|{company}|{url}".lower()
    return hashlib.md5(raw.encode()).hexdigest()[:12]

def load_existing(path):
    if path.exists():
        with open(path) as f:
            data = json.load(f)
        return {j["id"]: j for j in data.get("jobs", [])}
    return {}


# ---------------------------------------------------------------------------
# Adzuna API
# ---------------------------------------------------------------------------

def fetch_adzuna(profile_id, keywords, location, config):
    app_id  = os.environ.get("ADZUNA_APP_ID", "")
    api_key = os.environ.get("ADZUNA_API_KEY", "")
    if not app_id or not api_key:
        log.warning("Adzuna credentials not set — skipping.")
        return []

    country  = config.get("adzuna", {}).get("country", "us")
    max_days = config.get("max_age_days", 14)
    results  = []

    for kw in keywords:
        log.info(f"Adzuna [{profile_id}]: '{kw}'")
        params = {
            "app_id":           app_id,
            "app_key":          api_key,
            "what":             kw,
            "results_per_page": config.get("adzuna", {}).get("results_per_keyword", 20),
            "max_days_old":     max_days,
            "content-type":     "application/json",
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
                    "description": job.get("description","")[:400],
                    "url":         job.get("redirect_url",""),
                    "source":      "Adzuna",
                    "keyword":     kw,
                    "salary_min":  job.get("salary_min"),
                    "salary_max":  job.get("salary_max"),
                    "posted_at":   job.get("created",""),
                    "fetched_at":  datetime.now(timezone.utc).isoformat(),
                })
        except Exception as e:
            log.error(f"Adzuna error '{kw}': {e}")
        time.sleep(0.5)

    return results


# ---------------------------------------------------------------------------
# Keyword RSS feeds  (SimplyHired, Indeed — {keyword} + {location})
# ---------------------------------------------------------------------------

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
                    results.append({
                        "id":          make_id(entry.get("title",""), entry.get("author",""), entry.get("link","")),
                        "profile":     profile_id,
                        "title":       entry.get("title","").strip(),
                        "company":     entry.get("author", parsed.feed.get("title","Unknown")),
                        "location":    "",
                        "description": entry.get("summary","")[:400],
                        "url":         entry.get("link",""),
                        "source":      parsed.feed.get("title","RSS"),
                        "keyword":     kw,
                        "salary_min":  None,
                        "salary_max":  None,
                        "posted_at":   entry.get("published",""),
                        "fetched_at":  datetime.now(timezone.utc).isoformat(),
                    })
            except Exception as e:
                log.error(f"RSS error: {e}")
            time.sleep(0.3)
    return results


# ---------------------------------------------------------------------------
# Static RSS feeds  (HigherEdJobs category, PTJobSite — no keyword loop)
# ---------------------------------------------------------------------------

def fetch_static_rss(profile_id, static_feeds):
    results = []
    for feed in static_feeds:
        url   = feed.get("url","")
        label = feed.get("label", url)
        log.info(f"Static RSS [{profile_id}] {label}: {url}")
        try:
            parsed = feedparser.parse(url)
            for entry in parsed.entries:
                results.append({
                    "id":          make_id(entry.get("title",""), entry.get("author",""), entry.get("link","")),
                    "profile":     profile_id,
                    "title":       entry.get("title","").strip(),
                    "company":     entry.get("author", parsed.feed.get("title","Unknown")),
                    "location":    "",
                    "description": entry.get("summary","")[:400],
                    "url":         entry.get("link",""),
                    "source":      label,
                    "keyword":     "—",
                    "salary_min":  None,
                    "salary_max":  None,
                    "posted_at":   entry.get("published",""),
                    "fetched_at":  datetime.now(timezone.utc).isoformat(),
                })
        except Exception as e:
            log.error(f"Static RSS error ({label}): {e}")
        time.sleep(0.3)
    return results


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run():
    config   = load_config()
    profiles = config.get("profiles", {})
    existing = load_existing(OUTPUT_PATH)
    merged   = {**existing}
    added    = 0

    for pid, prof in profiles.items():
        keywords     = prof.get("keywords", [])
        location     = prof.get("location", "")
        static_feeds = prof.get("static_rss", [])

        log.info(f"=== Profile: {pid} ({len(keywords)} keywords, {len(static_feeds)} static feeds) ===")

        new_jobs = (
            fetch_adzuna(pid, keywords, location, config) +
            fetch_keyword_rss(pid, keywords, location, config) +
            fetch_static_rss(pid, static_feeds)
        )

        for job in new_jobs:
            if job["id"] not in merged:
                merged[job["id"]] = job
                added += 1

    # Prune old jobs
    max_age = config.get("max_age_days", 30)
    now     = datetime.now(timezone.utc)
    kept    = []
    for job in merged.values():
        try:
            fetched = datetime.fromisoformat(job["fetched_at"])
            if (now - fetched).days <= max_age:
                kept.append(job)
        except Exception:
            kept.append(job)

    kept.sort(key=lambda j: j.get("fetched_at",""), reverse=True)

    # Build profile metadata (including manual links) for the dashboard
    profile_meta = {}
    for pid, prof in profiles.items():
        profile_meta[pid] = {
            "label":        prof.get("label"),
            "color":        prof.get("color"),
            "manual_links": prof.get("manual_links", []),
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

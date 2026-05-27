// Vercel Serverless Function — /api/search-jobs
// Uses TinyFish free Search API to find jobs by keyword in real time.

export default async function handler(req, res) {
  const { keyword, profile } = req.query;
  if (!keyword) return res.status(400).json({ error: "keyword required" });

  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "TinyFish API key not configured" });

  try {
    // Use TinyFish free Search API
    const query = keyword + " job " + (profile?.includes("Rick") ? "Pittsburgh PA education" : "Pittsburgh PA physical therapist OR remote");
    const searchRes = await fetch(
      "https://api.search.tinyfish.ai?query=" + encodeURIComponent(query) + "&limit=20",
      { headers: { "X-API-Key": apiKey } }
    );

    if (!searchRes.ok) {
      const err = await searchRes.text();
      return res.status(searchRes.status).json({ error: "TinyFish error: " + err });
    }

    const searchData = await searchRes.json();
    const results    = searchData.results || searchData.data || [];

    // Map TinyFish results to our job format
    const jobs = results
      .filter(r => r.url && r.title)
      .map((r, i) => ({
        id:          "tf_" + Date.now() + "_" + i,
        profile:     profile?.includes("Rick") ? "rick" : "ellen",
        title:       r.title || "Job Listing",
        company:     r.domain || extractDomain(r.url),
        location:    extractLocation(r.title + " " + (r.description || "")),
        description: r.description || r.snippet || "",
        url:         r.url,
        source:      "TinyFish Search",
        keyword:     keyword,
        salary_min:  null,
        salary_max:  null,
        remote:      (r.title + " " + (r.description || "")).toLowerCase().includes("remote"),
        posted_at:   new Date().toISOString(),
        fetched_at:  new Date().toISOString(),
      }));

    return res.status(200).json({ jobs, total: jobs.length });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function extractDomain(url) {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return "Unknown"; }
}

function extractLocation(text) {
  const t = text.toLowerCase();
  if (t.includes("remote")) return "Remote";
  const cities = ["pittsburgh","philadelphia","new york","chicago","boston","denver","austin","seattle","atlanta"];
  for (const c of cities) if (t.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1) + ", PA";
  return "";
}

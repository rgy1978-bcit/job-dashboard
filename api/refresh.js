// Vercel Serverless Function — /api/refresh
// Triggers the GitHub Actions scraper workflow on demand.
// Called by the dashboard's "Refresh Jobs" button.

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.GITHUB_PAT;
  const owner = process.env.GITHUB_OWNER;   // your GitHub username
  const repo  = process.env.GITHUB_REPO;    // job-dashboard

  if (!token || !owner || !repo) {
    return res.status(500).json({ error: "GitHub env vars not configured" });
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/scrape.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept:        "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref: "main" }),
      }
    );

    // GitHub returns 204 No Content on success
    if (response.status === 204) {
      return res.status(200).json({
        success: true,
        message: "Scraper triggered — results will update in ~2 minutes.",
      });
    }

    const data = await response.json();
    return res.status(response.status).json({ error: data.message || "GitHub API error" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

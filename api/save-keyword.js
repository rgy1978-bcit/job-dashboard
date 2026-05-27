// Vercel Serverless Function — /api/save-keyword
// Adds a new keyword to config.yaml via GitHub API and triggers a scrape.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { keyword, profile } = req.body;
  if (!keyword) return res.status(400).json({ error: "keyword required" });

  const token = process.env.GITHUB_PAT;
  const owner = process.env.GITHUB_OWNER;
  const repo  = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) return res.status(500).json({ error: "GitHub env vars not configured" });

  try {
    // 1. Get current config.yaml from GitHub
    const fileRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/config.yaml`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
    );
    if (!fileRes.ok) return res.status(500).json({ error: "Could not fetch config.yaml" });

    const fileData = await fileRes.json();
    const content  = Buffer.from(fileData.content, "base64").toString("utf8");

    // 2. Check if keyword already exists
    if (content.includes(keyword)) {
      return res.status(200).json({ message: "Keyword already exists", keyword });
    }

    // 3. Add keyword to the right profile section
    const profileKey  = profile?.includes("Rick") ? "rick" : "ellen";
    const isRemote    = keyword.toLowerCase().includes("remote");
    const insertSection = isRemote ? "remote_keywords:" : "keywords:";

    // Find the profile section and insert after the keywords: line
    const profileMarker = "  " + profileKey + ":";
    const lines = content.split("\n");
    let inProfile = false;
    let inSection = false;
    let insertIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith(profileKey + ":")) inProfile = true;
      if (inProfile && lines[i].includes(insertSection)) { inSection = true; continue; }
      if (inProfile && inSection && lines[i].trim().startsWith("- ")) { insertIdx = i; }
      if (inProfile && inSection && insertIdx > -1 && !lines[i].trim().startsWith("- ") && lines[i].trim() !== "") break;
    }

    if (insertIdx === -1) return res.status(500).json({ error: "Could not find insertion point in config.yaml" });

    lines.splice(insertIdx + 1, 0, "      - " + keyword);
    const newContent = lines.join("\n");

    // 4. Commit updated config.yaml
    const commitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/config.yaml`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `add keyword: ${keyword} (${profileKey})`,
          content: Buffer.from(newContent).toString("base64"),
          sha: fileData.sha,
        }),
      }
    );
    if (!commitRes.ok) return res.status(500).json({ error: "Could not save keyword to config" });

    // 5. Trigger scraper
    await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/scrape.yml/dispatches`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
        body: JSON.stringify({ ref: "main" }),
      }
    );

    return res.status(200).json({ success: true, message: `Keyword "${keyword}" saved and scraper triggered.` });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

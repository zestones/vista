// ─── /api/create-issue ───────────────────────────────────
// Serverless function (Vercel-style). Creates a GitHub issue on the
// client's behalf using a server-only, write-scoped token — so the token
// is NEVER shipped to the browser.
//
// Required env (set in your hosting provider, NOT prefixed with VITE_):
//   GITHUB_TOKEN   fine-grained PAT with "Issues: write" on the repo
//   GITHUB_OWNER   (falls back to VITE_GITHUB_OWNER)
//   GITHUB_REPO    (falls back to VITE_GITHUB_REPO)

const TYPE_META = {
  feature: { label: "enhancement", fr: "Fonctionnalité", en: "Feature" },
  bug: { label: "bug", fr: "Bug", en: "Bug" },
  question: { label: "question", fr: "Question", en: "Question" },
  other: { label: null, fr: "Autre", en: "Other" },
};

const clamp = (s, n) => String(s || "").slice(0, n).trim();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || process.env.VITE_GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO || process.env.VITE_GITHUB_REPO;

  if (!token || !owner || !repo) {
    return res.status(501).json({ error: "Issue submission is not configured on the server." });
  }

  // Body may arrive parsed (Vercel) or as a raw string.
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid request body." });
    }
  }
  body = body || {};

  const typeKey = TYPE_META[body.type] ? body.type : "other";
  const meta = TYPE_META[typeKey];
  const lang = body.lang === "en" ? "en" : "fr";

  const rawTitle = clamp(body.title, 200);
  if (!rawTitle) {
    return res.status(400).json({ error: "A title is required." });
  }

  const description = clamp(body.description, 8000);
  const name = clamp(body.name, 120);
  const email = clamp(body.email, 200);

  // Prefix the title with the type for quick scanning.
  const title = `[${meta[lang]}] ${rawTitle}`;

  // Compose a clean issue body.
  const lines = [];
  lines.push(description || "_No description provided._");
  lines.push("");
  lines.push("---");
  const submitter = name || email ? `${name}${name && email ? " · " : ""}${email}` : "Anonymous";
  lines.push(`> Submitted via **Vista** · Type: **${meta.en}** · By: ${submitter}`);
  const issueBody = lines.join("\n");

  const labels = ["via:vista"];
  if (meta.label) labels.push(meta.label);

  try {
    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "vista-roadmap",
      },
      body: JSON.stringify({ title, body: issueBody, labels }),
    });

    if (!ghRes.ok) {
      const text = await ghRes.text();
      // Don't leak internals; log server-side, return a clean message.
      console.error("GitHub create-issue failed:", ghRes.status, text);
      if (ghRes.status === 401 || ghRes.status === 403) {
        return res.status(502).json({ error: "The server token is missing permissions to create issues." });
      }
      return res.status(502).json({ error: "GitHub rejected the request. Please try again later." });
    }

    const issue = await ghRes.json();
    return res.status(201).json({ url: issue.html_url, number: issue.number });
  } catch (e) {
    console.error("create-issue error:", e);
    return res.status(500).json({ error: "Unexpected server error." });
  }
}

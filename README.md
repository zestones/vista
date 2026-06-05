# Vista — a shared product roadmap

A clean, client-facing roadmap built straight from your **GitHub milestones & issues**.
Share it with clients or stakeholders so they can follow progress — and let them
submit **feature requests, bugs, and questions** through a tidy in-app form (no
GitHub account needed).

- 📊 **Roadmap timeline** (Gantt) grouped by milestone, with progress, deadlines, and a "today" marker.
- 🗂️ **Milestone overview** cards with per-milestone progress.
- ✉️ **Issue intake form** → creates a GitHub issue via a serverless function that keeps your write token server-side.
- 🌍 **Bilingual** FR / EN toggle, with localized dates.
- 🎨 Editorial design system (see [`DESIGN.md`](./DESIGN.md)) — white canvas, dark ink, signature cards.

## Quick start (local)

```bash
npm install
cp .env.example .env      # set VITE_GITHUB_OWNER / VITE_GITHUB_REPO
npm run dev               # http://localhost:5173
```

The **roadmap reads** run client-side and work immediately for a **public repo**
(no token). For a private repo or to dodge the 60 req/hr unauthenticated limit
during dev, set `VITE_GITHUB_TOKEN` in `.env` (local only — see warning below).

> The issue **submission form** posts to `/api/create-issue`, which only runs on a
> serverless host (or via `vercel dev` locally). Under plain `npm run dev` the form
> shows a friendly "not enabled here" message — that's expected.

## Configuration

| Variable | Where | Purpose |
|---|---|---|
| `VITE_GITHUB_OWNER` | client | Repo owner (public — used for reads + links) |
| `VITE_GITHUB_REPO` | client | Repo name (public) |
| `VITE_GITHUB_TOKEN` | client | **Optional, local dev only.** Read token. ⚠ Bundled into the browser — never put a real token here on a public deploy. |
| `GITHUB_TOKEN` | **server only** | Fine-grained PAT with **Issues: write**. Never shipped to the browser. |
| `GITHUB_OWNER` / `GITHUB_REPO` | server | Target repo for created issues (falls back to the `VITE_` values). |

## Deploy (Vercel)

1. Push this repo to GitHub and import it in Vercel (framework preset: **Vite**).
2. In **Project → Settings → Environment Variables**, add:
   - `GITHUB_TOKEN` = fine-grained PAT with **Issues: write** on your repo
   - `VITE_GITHUB_OWNER`, `VITE_GITHUB_REPO` (and optionally `GITHUB_OWNER` / `GITHUB_REPO`)
   - Leave `VITE_GITHUB_TOKEN` **empty** in production.
3. Deploy. The static site is served from `dist/`; `api/create-issue.js` runs as a serverless function automatically.

To test the function locally: `npm i -g vercel && vercel dev`.

> **Netlify?** The same `api/create-issue.js` logic works as a Netlify Function —
> move it to `netlify/functions/create-issue.js` and read `event.body` instead of
> `req.body`. Set the same env vars in the Netlify dashboard.

## How issues are created

The form sends `{ type, title, description, name, email, lang }` to the function,
which composes a clean issue:

- Title is prefixed with the type, e.g. `[Bug] Login button does nothing`.
- Body keeps the description, plus a small footer noting it came via Vista and who submitted it.
- Labels: `via:vista` + the type label (`enhancement` / `bug` / `question`).

## Stack

- Vite + React 18 (no UI dependencies — vanilla CSS tokens from `DESIGN.md`)
- GitHub REST API v3
- Inter / Inter Tight (Haas Grotesk substitute)
# vista

// ─── Config (public, client-side) ────────────────────────
export const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || "zestones";
export const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || "Aria";
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || ""; // local-dev only

export const REPO_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`;

// The Vista product's own source repo (the landing "View on GitHub" link).
export const VISTA_GITHUB =
  import.meta.env.VITE_VISTA_GITHUB || "https://github.com/zestones/vista";

// ─── Milestone palette (DESIGN.md signature + semantic colors) ──
// Curated for legibility as solid bars on white canvas.
export const MILESTONE_COLORS = [
  "#aa2d00", // signature coral
  "#1b61c9", // link blue
  "#0a2e0e", // signature forest
  "#d9a441", // signature mustard
  "#254fad", // info
  "#006400", // success green
];

// ─── Date utils ──────────────────────────────────────────
export const addDays = (d, n) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};
export const daysBetween = (a, b) => Math.round((b - a) / 86400000);

export const fmtShort = (d, locale) =>
  d.toLocaleDateString(locale, { day: "numeric", month: "short" });
export const fmtFull = (d, locale) =>
  d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
export const fmtMonth = (d, locale) =>
  d.toLocaleDateString(locale, { month: "short", year: "numeric" });

// ─── Fetch ───────────────────────────────────────────────
// Reads are of a public roadmap, so they run client-side. The optional
// VITE_GITHUB_TOKEN only helps local dev (rate limits / private repos).
export async function fetchRoadmap(owner = GITHUB_OWNER, repo = GITHUB_REPO, token = GITHUB_TOKEN) {
  const headers = { Accept: "application/vnd.github.v3+json" };
  if (token) headers.Authorization = `token ${token}`;

  const mRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/milestones?state=all&per_page=100&sort=due_on&direction=asc`,
    { headers }
  );
  if (!mRes.ok) throw new Error(`GitHub ${mRes.status}: ${mRes.statusText}`);
  const milestones = await mRes.json();

  const allIssues = [];
  let page = 1;
  while (true) {
    const r = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100&page=${page}`,
      { headers }
    );
    if (!r.ok) throw new Error(`Issues ${r.status}: ${r.statusText}`);
    const batch = await r.json();
    if (!batch.length) break;
    allIssues.push(...batch.filter((i) => !i.pull_request && i.milestone));
    if (batch.length < 100) break;
    page++;
  }

  return { milestones, issues: allIssues };
}

// ─── Data shaping ────────────────────────────────────────
export function buildGanttData(milestones, issues) {
  return milestones
    .map((m, idx) => {
      const mIssues = issues.filter((i) => i.milestone?.number === m.number);
      const mDue = m.due_on ? new Date(m.due_on) : addDays(new Date(), 90);
      const mCreated = new Date(m.created_at);
      const span = Math.max(daysBetween(mCreated, mDue), 7);

      mIssues.sort((a, b) => {
        if (a.state !== b.state) return a.state === "closed" ? -1 : 1;
        return new Date(a.created_at) - new Date(b.created_at);
      });

      const bars = mIssues.map((issue) => {
        const created = new Date(issue.created_at);
        const start = created > mCreated ? created : mCreated;
        let end;
        if (issue.closed_at) {
          end = new Date(issue.closed_at);
        } else {
          const slot = Math.max(Math.floor(span / Math.max(mIssues.length, 1)), 3);
          end = addDays(start, slot);
          if (end > mDue) end = mDue;
        }
        if (daysBetween(start, end) < 2) end = addDays(start, 2);

        return {
          id: issue.id,
          number: issue.number,
          title: issue.title,
          state: issue.state,
          labels: issue.labels || [],
          start,
          end,
          url: issue.html_url,
          author: issue.user?.name || issue.user?.login || null,
          avatarUrl: issue.user?.avatar_url || null,
        };
      });

      const closed = bars.filter((b) => b.state === "closed").length;

      return {
        id: m.number,
        title: m.title,
        description: m.description,
        due: m.due_on ? new Date(m.due_on) : null,
        color: MILESTONE_COLORS[idx % MILESTONE_COLORS.length],
        url: `${REPO_URL}/milestone/${m.number}`,
        total: bars.length,
        closed,
        pct: bars.length ? Math.round((closed / bars.length) * 100) : 0,
        bars,
      };
    })
    .filter((g) => g.bars.length > 0);
}

// Sort milestones and their issues for the roadmap views.
export function sortRoadmap(groups, msSort = "default", issueSort = "chrono") {
  const issueCmp =
    {
      chrono: (a, b) => a.start - b.start || a.end - b.end,
      status: (a, b) => (a.state === b.state ? a.start - b.start : a.state === "open" ? -1 : 1),
      number: (a, b) => a.number - b.number,
    }[issueSort] || (() => 0);

  let gs = (groups || []).map((g) => ({ ...g, bars: [...g.bars].sort(issueCmp) }));

  if (msSort === "due") {
    gs = [...gs].sort((a, b) => (a.due ? a.due.getTime() : Infinity) - (b.due ? b.due.getTime() : Infinity));
  } else if (msSort === "name") {
    gs = [...gs].sort((a, b) => a.title.localeCompare(b.title));
  } else if (msSort === "progress") {
    gs = [...gs].sort((a, b) => b.pct - a.pct);
  }
  return gs;
}

export function overallStats(groups) {
  const all = (groups || []).flatMap((g) => g.bars);
  const closed = all.filter((b) => b.state === "closed").length;
  return {
    total: all.length,
    open: all.length - closed,
    closed,
    milestones: (groups || []).length,
    pct: all.length ? Math.round((closed / all.length) * 100) : 0,
  };
}

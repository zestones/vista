// Deterministic mock data so the whole app is testable without a backend.

import { buildGanttData } from "./github";

// ─── Tiny seeded RNG (mulberry32) ────────────────────────
function rng(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LABELS = [
  { id: 1, name: "enhancement", color: "1b61c9" },
  { id: 2, name: "bug", color: "aa2d00" },
  { id: 3, name: "question", color: "d9a441" },
  { id: 4, name: "documentation", color: "0a2e0e" },
];

const AUTHORS = [
  { login: "marie", name: "Marie Lefèvre" },
  { login: "tom", name: "Tom Bauer" },
  { login: "sofia", name: "Sofia Marin" },
  { login: "ken", name: "Ken Aoki" },
  { login: "nora", name: "Nora Petit" },
  { login: "liam", name: "Liam Ortega" },
];

const MS_TITLES = {
  fr: ["Cadrage & specs", "Conception UI", "Développement", "Bêta privée", "Lancement", "Optimisation"],
  en: ["Scoping & specs", "UI design", "Development", "Private beta", "Launch", "Optimization"],
};
const ISSUE_TITLES = {
  fr: [
    "Mettre en place l’authentification",
    "Tableau de bord — première version",
    "Corriger l’affichage mobile",
    "Export PDF de la roadmap",
    "Intégration des notifications",
    "Refonte de la page d’accueil",
    "Optimiser le temps de chargement",
    "Filtres avancés sur les issues",
    "Gestion des rôles utilisateurs",
    "Webhook GitHub temps réel",
    "Page de paramètres du projet",
    "Bug : tri des jalons incorrect",
  ],
  en: [
    "Set up authentication",
    "Dashboard — first version",
    "Fix mobile layout",
    "PDF export of the roadmap",
    "Notifications integration",
    "Homepage redesign",
    "Optimize load time",
    "Advanced issue filters",
    "User role management",
    "Real-time GitHub webhook",
    "Project settings page",
    "Bug: milestone sorting wrong",
  ],
};

const day = 86400000;

// Generate GitHub-shaped milestones + issues, deterministic per seed.
export function genGithubData(seed, lang = "fr") {
  const r = rng("vista:" + seed);
  const nMs = 3 + Math.floor(r() * 2); // 3-4 milestones
  const now = Date.now();
  const start = now - (90 + Math.floor(r() * 60)) * day; // project began ~3-5 months ago

  const milestones = [];
  const issues = [];
  let issueNo = 1;
  let cursor = start;

  for (let m = 0; m < nMs; m++) {
    const msStart = cursor;
    const len = (25 + Math.floor(r() * 30)) * day;
    const due = msStart + len;
    cursor = due - Math.floor(r() * 10) * day; // milestones slightly overlap

    const nIssues = 3 + Math.floor(r() * 4); // 3-6
    // Earlier milestones are more "done".
    const doneBias = 1 - m / nMs;
    let closedCount = 0;

    for (let i = 0; i < nIssues; i++) {
      const createdAt = msStart + Math.floor(r() * (len * 0.4));
      const closed = r() < doneBias * 0.85 && createdAt < now;
      let closedAt = null;
      if (closed) {
        closedAt = createdAt + (3 + Math.floor(r() * 18)) * day;
        if (closedAt > now) closedAt = now - day;
        closedCount++;
      }
      const myNumber = issueNo++;
      const author = AUTHORS[Math.floor(r() * AUTHORS.length)];
      issues.push({
        id: myNumber, // unique within the project (one project rendered at a time)
        number: myNumber,
        title: ISSUE_TITLES[lang][(m * 3 + i) % ISSUE_TITLES[lang].length],
        state: closed ? "closed" : "open",
        labels: r() < 0.7 ? [LABELS[Math.floor(r() * LABELS.length)]] : [],
        created_at: new Date(createdAt).toISOString(),
        closed_at: closedAt ? new Date(closedAt).toISOString() : null,
        html_url: null, // demo data → no real GitHub link (bars aren't clickable)
        milestone: { number: m + 1 },
        user: { login: author.login, name: author.name, avatar_url: null },
        pull_request: undefined,
      });
    }

    milestones.push({
      number: m + 1,
      title: MS_TITLES[lang][m % MS_TITLES[lang].length],
      description:
        lang === "fr"
          ? "Étape clé du projet, suivie en temps réel."
          : "A key project stage, tracked in real time.",
      due_on: new Date(due).toISOString(),
      created_at: new Date(msStart).toISOString(),
      open_issues: nIssues - closedCount,
      closed_issues: closedCount,
    });
  }

  return { milestones, issues };
}

export function mockGroups(seed, lang = "fr") {
  const { milestones, issues } = genGithubData(seed, lang);
  return buildGanttData(milestones, issues);
}

// Quick stats for project cards (cheap, no chart build needed downstream).
export function mockStats(seed, lang = "fr") {
  const groups = mockGroups(seed, lang);
  const all = groups.flatMap((g) => g.bars);
  const closed = all.filter((b) => b.state === "closed").length;
  return {
    milestones: groups.length,
    total: all.length,
    closed,
    open: all.length - closed,
    pct: all.length ? Math.round((closed / all.length) * 100) : 0,
  };
}

// ─── Seed: demo projects for a freshly-signed-in user ────
let _id = 0;
const uid = (p) => `${p}_${Date.now().toString(36)}_${(_id++).toString(36)}`;

export function buildSeed(user) {
  const me = { id: "me", name: user.name, email: user.email, role: "owner", status: "active" };

  const mk = (over) => {
    const id = uid("prj");
    return {
      id,
      seed: over.seed || id,
      name: over.name,
      description: over.description,
      source: over.source || { type: "mock" },
      visibility: over.visibility || "private", // private | shared
      availableOnVista: over.availableOnVista ?? true,
      ownerEmail: over.ownerEmail || user.email,
      ownerName: over.ownerName || user.name,
      members: over.members || [me],
      inviteToken: "inv-" + Math.random().toString(36).slice(2, 10),
      createdAt: Date.now(),
      color: over.color,
    };
  };

  const stranger = (name, email, status, role = "viewer") => ({
    id: uid("mem"),
    name,
    email,
    role,
    status,
    requestedAt: Date.now() - Math.floor(Math.random() * 6) * day,
  });

  return [
    mk({
      seed: "apollo",
      name: "Refonte plateforme web",
      description: "Nouvelle identité, dashboard client et performances.",
      visibility: "shared",
      availableOnVista: true,
      color: "#aa2d00",
      members: [
        me,
        stranger("Marie Lefèvre", "marie@client.com", "active", "viewer"),
        stranger("Tom Bauer", "tom@acme.io", "active", "editor"),
        stranger("Sofia Marin", "sofia@startup.co", "pending"),
        stranger("Liam Ortega", "liam@studio.fr", "pending"),
      ],
    }),
    mk({
      seed: "mobile",
      name: "Application mobile",
      description: "iOS & Android, MVP puis itérations.",
      visibility: "shared",
      availableOnVista: true,
      color: "#1b61c9",
      members: [me, stranger("Nora Petit", "nora@brand.com", "active", "viewer"), stranger("Ken Aoki", "ken@labs.jp", "pending")],
    }),
    mk({
      seed: "internal",
      name: "Outils internes",
      description: "Automatisations & back-office. Non partagé.",
      visibility: "private",
      availableOnVista: false,
      color: "#0a2e0e",
      members: [me],
    }),
    // A project owned by someone else, where the current user is a viewer (client perspective).
    mk({
      seed: "clientco",
      name: "Site vitrine — ClientCo",
      description: "Projet partagé par une agence partenaire.",
      visibility: "shared",
      availableOnVista: true,
      color: "#d9a441",
      ownerEmail: "agence@partner.com",
      ownerName: "Agence Partner",
      members: [
        { id: uid("mem"), name: "Agence Partner", email: "agence@partner.com", role: "owner", status: "active" },
        { id: "me", name: user.name, email: user.email, role: "viewer", status: "active" },
      ],
    }),
  ];
}

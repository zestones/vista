// ⚠ MOCK BACKEND — simulates an async API so the whole app is testable.
// Data lives in localStorage; every call returns a Promise with latency.
// Designed to be swapped for a real multi-tenant backend later: keep these
// method signatures and replace the bodies with fetch() calls.

import { buildSeed, mockGroups } from "./mockData";
import { fetchRoadmap, buildGanttData } from "./github";

const DB_KEY = "vista-db";
const PALETTE = ["#aa2d00", "#1b61c9", "#0a2e0e", "#d9a441", "#254fad", "#006400"];

let CURRENT = null;
let counter = 0;
const uid = (p) => `${p}_${Date.now().toString(36)}_${(counter++).toString(36)}`;
const delay = (ms = 360) => new Promise((r) => setTimeout(r, ms + Math.random() * 220));
const clone = (x) => JSON.parse(JSON.stringify(x));

export function setCurrentUser(u) {
  CURRENT = u;
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY));
  } catch {
    return null;
  }
}
function save(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// Seed once per user. Switching accounts reseeds (demo convenience).
function ensure() {
  const email = CURRENT?.email || "";
  let db = load();
  if (!db || db.seededFor !== email) {
    db = {
      seededFor: email,
      projects: buildSeed(CURRENT || { name: "Vous", email: "you@vista.app" }),
    };
    save(db);
  }
  return db;
}

const isMe = (m) => CURRENT && m.email?.toLowerCase() === CURRENT.email?.toLowerCase();

// ─── Projects ────────────────────────────────────────────
export async function getProjectsForUser() {
  await delay();
  const db = ensure();
  const owned = db.projects.filter((p) => p.ownerEmail === CURRENT.email);
  const joined = db.projects.filter(
    (p) => p.ownerEmail !== CURRENT.email && p.members.some((m) => isMe(m) && m.status === "active")
  );
  return clone({ owned, joined });
}

// Admin scope: every project in the current user's tenant (here: owned).
export async function getOwnedProjects() {
  await delay();
  const db = ensure();
  return clone(db.projects.filter((p) => p.ownerEmail === CURRENT.email));
}

export async function getProject(id) {
  await delay(260);
  const db = ensure();
  return clone(db.projects.find((p) => p.id === id) || null);
}

export async function getRoadmap(id, lang = "fr") {
  const db = ensure();
  const p = db.projects.find((x) => x.id === id);
  if (!p) throw new Error("Project not found");
  if (p.source?.type === "github" && p.source.owner && p.source.repo) {
    const { milestones, issues } = await fetchRoadmap(p.source.owner, p.source.repo);
    return buildGanttData(milestones, issues);
  }
  await delay(520); // simulate network for the mock source too
  return mockGroups(p.seed || p.id, lang);
}

export async function createProject(data) {
  await delay(640);
  const db = ensure();
  const me = { id: "me", name: CURRENT.name, email: CURRENT.email, role: "owner", status: "active" };
  const id = uid("prj");
  const project = {
    id,
    seed: id,
    name: data.name.trim(),
    description: (data.description || "").trim(),
    source: data.source || { type: "mock" },
    visibility: data.visibility || "private",
    availableOnVista: data.availableOnVista ?? true,
    ownerEmail: CURRENT.email,
    ownerName: CURRENT.name,
    members: [me],
    inviteToken: "inv-" + Math.random().toString(36).slice(2, 10),
    createdAt: Date.now(),
    color: PALETTE[db.projects.length % PALETTE.length],
  };
  db.projects.push(project);
  save(db);
  return clone(project);
}

export async function updateProject(id, patch) {
  await delay(420);
  const db = ensure();
  const p = db.projects.find((x) => x.id === id);
  if (!p) throw new Error("Not found");
  Object.assign(p, patch);
  save(db);
  return clone(p);
}

export async function deleteProject(id) {
  await delay(420);
  const db = ensure();
  db.projects = db.projects.filter((p) => p.id !== id);
  save(db);
  return { ok: true };
}

// ─── Members & access ────────────────────────────────────
export async function approveRequest(projectId, memberId, role = "viewer") {
  await delay(360);
  const db = ensure();
  const p = db.projects.find((x) => x.id === projectId);
  const m = p?.members.find((x) => x.id === memberId);
  if (m) {
    m.status = "active";
    m.role = role;
  }
  save(db);
  return clone(p);
}

export async function denyRequest(projectId, memberId) {
  return removeMember(projectId, memberId);
}

export async function removeMember(projectId, memberId) {
  await delay(320);
  const db = ensure();
  const p = db.projects.find((x) => x.id === projectId);
  if (p) p.members = p.members.filter((m) => m.id !== memberId);
  save(db);
  return clone(p);
}

export async function setMemberRole(projectId, memberId, role) {
  await delay(280);
  const db = ensure();
  const p = db.projects.find((x) => x.id === projectId);
  const m = p?.members.find((x) => x.id === memberId);
  if (m) m.role = role;
  save(db);
  return clone(p);
}

export async function rotateInvite(projectId) {
  await delay(300);
  const db = ensure();
  const p = db.projects.find((x) => x.id === projectId);
  if (p) p.inviteToken = "inv-" + Math.random().toString(36).slice(2, 10);
  save(db);
  return p ? p.inviteToken : null;
}

// ─── Join via link ───────────────────────────────────────
export async function getProjectByToken(token) {
  await delay(300);
  const db = ensure();
  const p = db.projects.find(
    (x) => x.inviteToken === token && x.visibility === "shared" && x.availableOnVista
  );
  return p ? clone(p) : null;
}

export async function requestAccess(token) {
  await delay(520);
  const db = ensure();
  const p = db.projects.find((x) => x.inviteToken === token);
  if (!p) return { status: "invalid" };
  const existing = p.members.find((m) => isMe(m));
  if (existing) {
    save(db);
    return { status: existing.status === "active" ? "member" : "pending", project: clone(p) };
  }
  p.members.push({
    id: uid("mem"),
    name: CURRENT.name,
    email: CURRENT.email,
    role: "viewer",
    status: "pending",
    requestedAt: Date.now(),
  });
  save(db);
  return { status: "requested", project: clone(p) };
}

// ─── Feature/bug/question requests (the "Nouvelle demande" form) ──
// Project-aware and fully mocked, so the flow is testable end-to-end.
export async function createRequest(payload) {
  await delay(700);
  const db = ensure();
  const p = db.projects.find((x) => x.id === payload.projectId);
  if (!p) throw new Error("Project not found");
  if (!payload.title?.trim()) throw new Error("A title is required.");
  p.requests = p.requests || [];
  const number = p.requests.length + 1;
  p.requests.push({
    id: uid("req"),
    number,
    type: payload.type || "feature",
    title: payload.title.trim(),
    description: (payload.description || "").trim(),
    name: (payload.name || "").trim(),
    email: (payload.email || "").trim(),
    createdAt: Date.now(),
  });
  save(db);
  // A real backend would create a GitHub issue and return its URL.
  return { ok: true, number, url: null };
}

// ─── Helpers (sync) ──────────────────────────────────────
export function inviteUrl(token) {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/join/${token}`;
}

export const ROLES = ["owner", "editor", "viewer"];

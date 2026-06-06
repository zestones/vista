import type { Database } from '@/types/database.types'

// ─── Row aliases (single source of truth = database.types) ───────
type Tables = Database['public']['Tables']
export type ProjectRow = Tables['projects']['Row']
export type ProjectRepoRow = Tables['project_repos']['Row']
export type MilestoneRow = Tables['milestones']['Row']
export type IssueRow = Tables['issues']['Row']
export type MemberRow = Tables['project_members']['Row']
export type SubmissionRow = Tables['submissions']['Row']

/** Normalized in-memory shape that mirrors the Postgres tables (rows, not a nested tree). */
export interface MockDb {
  projects: ProjectRow[]
  projectRepos: ProjectRepoRow[]
  milestones: MilestoneRow[]
  issues: IssueRow[]
  members: MemberRow[]
  submissions: SubmissionRow[]
}

// ─── Seeded RNG (mulberry32) — deterministic per key ─────────────
function rng(seedStr: string): () => number {
  let h = 1779033703 ^ seedStr.length
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DAY = 86_400_000
export const PROJECT_PALETTE = ['#aa2d00', '#1b61c9', '#0a2e0e', '#d9a441']
const AUTHORS = ['marie', 'tom', 'sofia', 'ken', 'nora', 'liam']
const MS_TITLES = ['Scoping & specs', 'UI design', 'Development', 'Private beta', 'Launch', 'Optimization']
const ISSUE_TITLES = [
  'Set up authentication',
  'Dashboard v1',
  'Fix mobile layout',
  'PDF export of the roadmap',
  'Notifications integration',
  'Homepage redesign',
  'Optimize load time',
  'Advanced issue filters',
  'User role management',
  'Real-time GitHub webhook',
  'Project settings page',
  'Sorting bug on milestones',
]

// Generate GitHub-shaped milestones + issues for one repo, as normalized rows.
// Allowlist invariant: shared defaults to false on every item.
export function genRepo(projectRepoId: string, seedKey: string): { milestones: MilestoneRow[]; issues: IssueRow[] } {
  const r = rng('vista:' + seedKey)
  const now = Date.now()
  const start = now - (90 + Math.floor(r() * 60)) * DAY
  const nMs = 3 + Math.floor(r() * 2)
  const milestones: MilestoneRow[] = []
  const issues: IssueRow[] = []
  let cursor = start
  let issueNo = 1

  for (let m = 0; m < nMs; m++) {
    const msStart = cursor
    const len = (25 + Math.floor(r() * 30)) * DAY
    const due = msStart + len
    cursor = due - Math.floor(r() * 10) * DAY
    const nIssues = 3 + Math.floor(r() * 4)
    const doneBias = 1 - m / nMs
    const msId = `${projectRepoId}-ms-${String(m + 1)}`
    let closedCount = 0

    for (let i = 0; i < nIssues; i++) {
      const createdAt = msStart + Math.floor(r() * (len * 0.4))
      const isClosed = r() < doneBias * 0.85 && createdAt < now
      let closedAt: number | null = null
      if (isClosed) {
        closedAt = createdAt + (3 + Math.floor(r() * 18)) * DAY
        if (closedAt > now) closedAt = now - DAY
        closedCount++
      }
      const num = issueNo++
      issues.push({
        id: `${projectRepoId}-iss-${String(num)}`,
        project_repo_id: projectRepoId,
        milestone_id: msId,
        number: num,
        title: ISSUE_TITLES[(m * 3 + i) % ISSUE_TITLES.length],
        state: isClosed ? 'closed' : 'open',
        labels: [],
        author_login: AUTHORS[Math.floor(r() * AUTHORS.length)],
        author_avatar_url: null,
        html_url: null,
        created_at: new Date(createdAt).toISOString(),
        closed_at: closedAt === null ? null : new Date(closedAt).toISOString(),
        shared: false,
        updated_at: new Date(now).toISOString(),
      })
    }

    milestones.push({
      id: msId,
      project_repo_id: projectRepoId,
      number: m + 1,
      title: MS_TITLES[m % MS_TITLES.length],
      description: 'Key project stage, tracked in real time.',
      due_on: new Date(due).toISOString(),
      state: 'open',
      open_issues: nIssues - closedCount,
      closed_issues: closedCount,
      shared: false,
      updated_at: new Date(now).toISOString(),
    })
  }

  return { milestones, issues }
}

interface ProjectDef {
  id: string
  name: string
  visibility: 'private' | 'shared'
  repos: [owner: string, repo: string][]
}

const PROJECT_DEFS: ProjectDef[] = [
  { id: 'prj-apollo', name: 'Platform redesign', visibility: 'shared', repos: [['acme', 'webapp'], ['acme', 'design-system']] },
  { id: 'prj-mobile', name: 'Mobile app', visibility: 'shared', repos: [['acme', 'mobile']] },
  { id: 'prj-internal', name: 'Internal tools', visibility: 'private', repos: [['acme', 'ops']] },
]

/** Build a fresh, deterministic, normalized mock database. */
export function buildSeed(): MockDb {
  const now = new Date().toISOString()
  // Mock identity = email (see services/auth). The demo owner is you@vista.app.
  const ownerId = 'you@vista.app'
  const db: MockDb = { projects: [], projectRepos: [], milestones: [], issues: [], members: [], submissions: [] }

  PROJECT_DEFS.forEach((d, di) => {
    db.projects.push({
      id: d.id,
      owner_id: ownerId,
      name: d.name,
      description: null,
      color: PROJECT_PALETTE[di % PROJECT_PALETTE.length],
      visibility: d.visibility,
      available_on_vista: d.visibility === 'shared',
      created_at: now,
    })
    db.members.push({
      id: `${d.id}-mem-owner`,
      project_id: d.id,
      user_id: ownerId,
      email: 'you@vista.app',
      name: 'You',
      role: 'owner',
      status: 'active',
      invited_at: now,
    })
    d.repos.forEach(([owner, repo], ri) => {
      const prId = `${d.id}-repo-${String(ri + 1)}`
      db.projectRepos.push({ id: prId, project_id: d.id, installation_id: null, owner, repo, github_repo_id: null, created_at: now })
      const { milestones, issues } = genRepo(prId, `${d.id}:${owner}/${repo}`)
      db.milestones.push(...milestones)
      db.issues.push(...issues)
    })
  })

  // One pending submission so the moderation flow is testable from the seed.
  db.submissions.push({
    id: 'sub-1',
    project_id: 'prj-apollo',
    type: 'feature',
    title: 'Dark mode for the client portal',
    body: 'Several clients asked for a dark theme.',
    submitted_by: null,
    submitter_name: 'Marie',
    submitter_email: 'marie@client.com',
    status: 'pending',
    github_issue_number: null,
    created_at: now,
  })

  return db
}

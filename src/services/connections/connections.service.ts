import { env } from '@/config/env'
import { genRepo, mockDb } from '@/lib/mock'
import { supabase } from '@/lib/supabase/client'
import type { AttachRepoInput, AvailableRepo, InstallationLink, ProjectRepoRow } from './connections.dto'

// Dev GitHub App install URL. Prod uses its own slug -- revisit when the prod App is registered (Phase 6).
export const GITHUB_INSTALL_URL = 'https://github.com/apps/vista-local-dev/installations/new'

export interface ConnectionsApi {
  /** Repos available to attach across the owner's installation(s). */
  listInstallationRepos(): Promise<AvailableRepo[]>
  getAttachedRepos(projectId: string): Promise<ProjectRepoRow[]>
  attachRepo(input: AttachRepoInput): Promise<ProjectRepoRow>
  detachRepo(projectRepoId: string): Promise<void>
  /**
   * Link a GitHub App installation to the current owner (post-install callback, #77). `code` is the
   * GitHub App OAuth code from the post-install redirect; the backend exchanges it to verify the caller
   * actually owns the installation (#184).
   */
  connectInstallation(installationId: number, code: string): Promise<InstallationLink>
}

const MOCK_INSTALLATION_ID = 1
const MOCK_AVAILABLE: AvailableRepo[] = [
  { installation_id: MOCK_INSTALLATION_ID, owner: 'acme', repo: 'web', github_repo_id: 9001, private: false },
  { installation_id: MOCK_INSTALLATION_ID, owner: 'acme', repo: 'api', github_repo_id: 9002, private: true },
  { installation_id: MOCK_INSTALLATION_ID, owner: 'acme', repo: 'docs', github_repo_id: 9003, private: false },
]

const mock: ConnectionsApi = {
  listInstallationRepos: () => Promise.resolve(MOCK_AVAILABLE),
  getAttachedRepos(projectId) {
    return Promise.resolve(mockDb().projectRepos.filter((r) => r.project_id === projectId))
  },
  attachRepo({ projectId, installationId, owner, repo }) {
    const db = mockDb()
    const id = crypto.randomUUID()
    const row: ProjectRepoRow = {
      id,
      project_id: projectId,
      installation_id: installationId,
      owner,
      repo,
      github_repo_id: MOCK_AVAILABLE.find((r) => r.owner === owner && r.repo === repo)?.github_repo_id ?? null,
      created_at: new Date().toISOString(),
    }
    db.projectRepos.push(row)
    // Mock nicety: seed the roadmap so the attached repo shows items (shared=false by default).
    const generated = genRepo(id, `${owner}/${repo}`)
    db.milestones.push(...generated.milestones)
    db.issues.push(...generated.issues)
    return Promise.resolve(row)
  },
  detachRepo(projectRepoId) {
    const db = mockDb()
    db.projectRepos = db.projectRepos.filter((r) => r.id !== projectRepoId)
    db.milestones = db.milestones.filter((m) => m.project_repo_id !== projectRepoId)
    db.issues = db.issues.filter((i) => i.project_repo_id !== projectRepoId)
    return Promise.resolve()
  },
  connectInstallation(installationId) {
    // Mock has no real installations (and no code to verify); return a stub so the callback flow works.
    return Promise.resolve({ id: crypto.randomUUID(), installation_id: installationId, account_login: 'mock-org' })
  },
}

// Supabase: writes go through the connect-repos Edge function (service role, validated);
// reads of attached repos use owner-read RLS (#20). Installation tokens never reach the client.
async function invoke<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  // supabase-js types the failure `error` as `any`; re-type it to keep the destructure safe.
  const { data, error } = (await supabase.functions.invoke<T>(fn, { body })) as {
    data: T | null
    error: Error | null
  }
  if (error) throw error
  if (data == null) throw new Error(`${fn}: empty response`)
  return data
}

const supabaseApi: ConnectionsApi = {
  async listInstallationRepos() {
    return (await invoke<{ repos: AvailableRepo[] }>('connect-repos', { action: 'list' })).repos
  },
  async getAttachedRepos(projectId) {
    const { data, error } = await supabase.from('project_repos').select('*').eq('project_id', projectId)
    if (error) throw error
    return data
  },
  async attachRepo({ projectId, installationId, owner, repo }) {
    return (
      await invoke<{ projectRepo: ProjectRepoRow }>('connect-repos', {
        action: 'attach',
        project_id: projectId,
        installation_id: installationId,
        owner,
        repo,
      })
    ).projectRepo
  },
  async detachRepo(projectRepoId) {
    await invoke<{ ok: true }>('connect-repos', { action: 'detach', project_repo_id: projectRepoId })
  },
  async connectInstallation(installationId, code) {
    return (await invoke<{ installation: InstallationLink }>('connect-installation', { installation_id: installationId, code }))
      .installation
  },
}

export const connections: ConnectionsApi = env.backend === 'supabase' ? supabaseApi : mock

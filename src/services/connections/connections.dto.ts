import type { Database } from '@/types/database.types'

export type ProjectRepoRow = Database['public']['Tables']['project_repos']['Row']

/** A repo the owner can attach, surfaced by the `connect-repos` Edge function (#20). */
export interface AvailableRepo {
  installation_id: number
  owner: string
  repo: string
  github_repo_id: number
  private: boolean
}

export interface AttachRepoInput {
  projectId: string
  installationId: number
  owner: string
  repo: string
}

/** A linked GitHub App installation, returned by connect-installation (#19/#77). */
export interface InstallationLink {
  id: string
  installation_id: number
  account_login: string
}

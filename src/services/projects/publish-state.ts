import type { ProjectRow } from './projects.dto'

export type PublishState = { published: boolean; needsShared: boolean; needsAvailable: boolean }

/**
 * Whether clients can actually see a project (#107). The gate is BOTH `visibility === 'shared'` AND
 * `available_on_vista` (mirrors the RLS `is_project_published`). Returns which conditions are still
 * missing so the UI can tell the owner exactly what to fix, instead of failing silently ("invited but
 * sees nothing").
 */
export function publishState(p: Pick<ProjectRow, 'visibility' | 'available_on_vista'>): PublishState {
  const needsShared = p.visibility !== 'shared'
  const needsAvailable = !p.available_on_vista
  return { published: !needsShared && !needsAvailable, needsShared, needsAvailable }
}

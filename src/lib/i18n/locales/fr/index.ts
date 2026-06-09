import type { TranslationKey } from '../en'
import { admin } from './admin'
import { auth } from './auth'
import { comments } from './comments'
import { common } from './common'
import { landing } from './landing'
import { moderation } from './moderation'
import { notifications } from './notifications'
import { project } from './project'
import { roadmap } from './roadmap'
import { submissions } from './submissions'
import { workspace } from './workspace'

// Typed against the canonical EN key set: a missing key across the domains is a compile error.
export const fr: Record<TranslationKey, string> = {
  ...admin,
  ...auth,
  ...comments,
  ...common,
  ...landing,
  ...moderation,
  ...notifications,
  ...project,
  ...roadmap,
  ...submissions,
  ...workspace,
}

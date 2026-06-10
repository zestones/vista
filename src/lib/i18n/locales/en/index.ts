// Canonical EN catalog (#39): composed from one file per domain. TranslationKey is derived here,
// so every other locale (typed Record<TranslationKey, string>) must cover the same keys or tsc fails.
import { admin } from './admin'
import { auth } from './auth'
import { comments } from './comments'
import { common } from './common'
import { landing } from './landing'
import { mobile } from './mobile'
import { moderation } from './moderation'
import { notifications } from './notifications'
import { project } from './project'
import { roadmap } from './roadmap'
import { submissions } from './submissions'
import { workspace } from './workspace'

export const en = {
  ...admin,
  ...auth,
  ...comments,
  ...common,
  ...landing,
  ...mobile,
  ...moderation,
  ...notifications,
  ...project,
  ...roadmap,
  ...submissions,
  ...workspace,
}

export type TranslationKey = keyof typeof en

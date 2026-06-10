/**
 * Route hierarchy level for the mobile screen stack: deeper = forward (slide in from the right),
 * shallower = back (slide in from the left), same level = crossfade. Also gates the edge swipe-back
 * (only on sub-screens, level > 0).
 */
export function levelOf(pathname: string): number {
  if (/\/projects\/[^/]+\/m\//.test(pathname)) return 2 // milestone detail
  if (/\/projects\/[^/]+/.test(pathname)) return 1 // project hub
  return 0 // top-level destinations (home, account, submissions, admin)
}

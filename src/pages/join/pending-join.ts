/**
 * localStorage key holding an invite token to resume after a sign-in round-trip (#105).
 * localStorage (not sessionStorage) so it survives the magic link opening a new tab.
 */
export const PENDING_JOIN_KEY = 'vista:pendingJoin'

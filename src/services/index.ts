// Data-access layer. Each domain selects its backend (mock | supabase) via VITE_BACKEND.
// Remaining domains (members, invites, auth, github) follow the same pattern, added with their ports.
export * from './projects'
export * from './roadmap'
export * from './submissions'

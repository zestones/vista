export const roadmapKeys = {
  all: ['roadmap'] as const,
  // Scoped by viewer: the allowlist filter (#3) makes the result identity-dependent.
  byProject: (projectId: string, viewerId: string) => [...roadmapKeys.all, projectId, viewerId] as const,
}

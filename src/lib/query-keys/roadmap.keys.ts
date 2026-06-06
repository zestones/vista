export const roadmapKeys = {
  all: ['roadmap'] as const,
  byProject: (projectId: string) => [...roadmapKeys.all, projectId] as const,
}

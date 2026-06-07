export const connectionKeys = {
  all: ['connections'] as const,
  available: () => [...connectionKeys.all, 'available'] as const,
  attached: (projectId: string) => [...connectionKeys.all, 'attached', projectId] as const,
}

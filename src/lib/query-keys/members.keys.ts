export const memberKeys = {
  all: ['members'] as const,
  byProject: (projectId: string) => [...memberKeys.all, projectId] as const,
  invite: (projectId: string) => [...memberKeys.all, 'invite', projectId] as const,
}

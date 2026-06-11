export const shareLinkKeys = {
  byProject: (projectId: string) => ['shareLink', projectId] as const,
  publicRoadmap: (token: string) => ['publicRoadmap', token] as const,
}

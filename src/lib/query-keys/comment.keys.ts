export const commentKeys = {
  all: ['comments'] as const,
  byIssue: (issueId: string) => [...commentKeys.all, 'issue', issueId] as const,
  openingPost: (issueId: string) => [...commentKeys.all, 'opening', issueId] as const,
  viewerCount: (projectId: string) => [...commentKeys.all, 'viewerCount', projectId] as const,
}

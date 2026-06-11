export const submissionKeys = {
  all: ['submissions'] as const,
  byProject: (projectId: string) => [...submissionKeys.all, projectId] as const,
  inbox: (userId: string) => [...submissionKeys.all, 'inbox', userId] as const,
  thread: (submissionId: string) => [...submissionKeys.all, 'thread', submissionId] as const,
}

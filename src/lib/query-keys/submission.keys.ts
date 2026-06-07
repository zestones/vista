export const submissionKeys = {
  all: ['submissions'] as const,
  byProject: (projectId: string) => [...submissionKeys.all, projectId] as const,
}

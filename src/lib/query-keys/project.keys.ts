export const projectKeys = {
  all: ['projects'] as const,
  list: (userId: string) => [...projectKeys.all, 'list', userId] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
}

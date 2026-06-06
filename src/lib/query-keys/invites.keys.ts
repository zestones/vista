export const inviteKeys = {
  all: ['invites'] as const,
  byToken: (token: string, email: string) => [...inviteKeys.all, token, email] as const,
}

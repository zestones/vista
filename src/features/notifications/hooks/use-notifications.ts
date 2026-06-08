import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notifications, type NotificationRow } from '@/services/notifications'

const notifKeys = { all: ['notifications'] as const }

/** The current user's notifications (RLS-scoped), newest first. */
export function useNotifications() {
  return useQuery({
    queryKey: notifKeys.all,
    queryFn: (): Promise<NotificationRow[]> => notifications.list(),
    refetchOnWindowFocus: true,
  })
}

export function useMarkNotifications() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: notifKeys.all })
  return {
    markRead: useMutation({ mutationFn: (id: string) => notifications.markRead(id), onSuccess: invalidate }),
    markAllRead: useMutation({ mutationFn: () => notifications.markAllRead(), onSuccess: invalidate }),
  }
}

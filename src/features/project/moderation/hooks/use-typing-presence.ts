import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { env } from '@/config/env'

/**
 * Typing indicator for a request thread (#250) over Supabase Realtime broadcast — ephemeral, no DB.
 * `notifyTyping()` (throttled) tells the other party you're typing; `typingName` is the other party's
 * name while they type (auto-clears). Supabase-only; a no-op on the mock backend.
 */
export function useTypingPresence(submissionId: string, selfName: string) {
  const [typingName, setTypingName] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const lastSentRef = useRef(0)
  const clearRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (env.backend !== 'supabase' || submissionId === '') return
    const channel = supabase.channel(`typing:${submissionId}`, { config: { broadcast: { self: false } } })
    channel
      .on('broadcast', { event: 'typing' }, (msg) => {
        const name = (msg.payload as { name?: string }).name ?? ''
        setTypingName(name)
        clearTimeout(clearRef.current)
        clearRef.current = setTimeout(() => setTypingName(null), 3500)
      })
      .subscribe()
    channelRef.current = channel
    return () => {
      clearTimeout(clearRef.current)
      void supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [submissionId])

  const notifyTyping = useCallback(() => {
    const now = Date.now()
    if (now - lastSentRef.current < 1200) return // throttle: at most ~1 ping/sec
    lastSentRef.current = now
    void channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { name: selfName } })
  }, [selfName])

  return { typingName, notifyTyping }
}

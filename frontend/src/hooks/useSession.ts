import { useCallback } from 'react'
import useSessionStore from '@/store/session'

export default function useSession() {
  const sessionId = useSessionStore((s) => s.session?.id || '')
  const removeSession = useSessionStore((s) => s.removeSession)
  const getSessions = useSessionStore((s) => s.getSessions)

  const deleteSession = useCallback(
    async (id: string) => {
      await removeSession(id)
      await getSessions()
    },
    [removeSession, getSessions],
  )

  return { sessionId, deleteSession }
}

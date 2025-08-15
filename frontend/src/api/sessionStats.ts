import axiosInstance from '@/http/axios'
import { useQuery } from '@tanstack/react-query'

export interface SessionStats {
  campaigns: { total_campaigns: number }
  leads: { total_leads: number }
  smtp: { total_accounts: number }
  imap: { total_accounts: number }
}

export const SESSION_STATS_KEY = ['session-stats'] as const

export async function getSessionStats(sessionId: string | number): Promise<SessionStats> {
  const { data } = await axiosInstance.get('/dashboard/analytics', {
    params: { period: '7d', session_id: sessionId },
  })
  return data as SessionStats
}

export function useSessionStats(sessionId?: string | number) {
  return useQuery({
    queryKey: [...SESSION_STATS_KEY, sessionId],
    queryFn: () => getSessionStats(sessionId as string | number),
    enabled: !!sessionId,
  })
}

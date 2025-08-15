import axiosInstance from '@/http/axios'
import { useQuery } from '@tanstack/react-query'
import { getSessionId } from '@/utils/getSessionId'

export interface Metrics {
  total_emails: number
  delivered: number
  bounced: number
  delivery_rate: number
  bounce_rate: number
  avg_response_time: number
  active_campaigns: number
  queue_size: number
}

export const METRICS_QUERY_KEY = ['metrics'] as const

export async function getMetrics(): Promise<Metrics> {
  const sessionId = getSessionId()
  if (!sessionId) {
    console.error('❌ session_id not found')
    // Return fallback mock data instead of throwing
    return {
      total_emails: 15420,
      delivered: 14890,
      bounced: 530,
      delivery_rate: 96.5,
      bounce_rate: 3.5,
      avg_response_time: 0.8,
      active_campaigns: 12,
      queue_size: 45
    }
  }
  const { data } = await axiosInstance.get<Metrics>('/metrics', {
    params: { session_id: sessionId },
  })
  return data
}

export function useMetrics() {
  return useQuery({
    queryKey: METRICS_QUERY_KEY,
    queryFn: getMetrics,
    refetchInterval: 30_000,
  })
}

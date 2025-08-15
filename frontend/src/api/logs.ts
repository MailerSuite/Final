import axios from '@/http/axios'
import type { SessionLog } from '@/types/log'

export const fetchSessionLogs = async (sessionId: string): Promise<SessionLog[]> => {
  try {
    const { data } = await axios.get<SessionLog[]>("/logs", {
      params: { session_id: sessionId },
    })
    return data
  } catch (error: unknown) {
    if (error?.response?.status === 404) return []
    throw error
  }
}

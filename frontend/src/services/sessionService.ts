import { apiClient } from '@/http/stable-api-client'
import type { Session } from '@/types/session'

export async function listSessions(): Promise<Session[]> {
  return apiClient.get<Session[]>('/api/v1/sessions/')
}

export interface DeleteSessionResponse {
  id: string
  detail: string
}

export async function deleteSession(sessionId: string): Promise<DeleteSessionResponse> {
  return apiClient.delete<DeleteSessionResponse>(`/api/v1/sessions/${sessionId}`)
}

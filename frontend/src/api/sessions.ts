import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Session } from '@/types'
import { toast } from '@/hooks/useToast'
import { apiClient } from '@/http/stable-api-client'

// Safe request wrapper that handles 404/500 errors gracefully
const safeRequest = function<T>(p: Promise<any>) {
  return p.then(r => r.data)
   .catch((err: any) => {
     if ([404, 500].includes(err?.response?.status ?? 0)) return null;
     throw err;
   });
};

export const SESSIONS_KEY = ['sessions'] as const

export const listSessions = async (): Promise<Session[] | null> => {
  return safeRequest(apiClient.get<Session[]>('/api/v1/sessions/'))
}

export const createSession = async (name: string): Promise<Session> => {
  const response = await apiClient.post<Session>('/api/v1/sessions/', { name })
  return response.data as Session
}

export interface DeleteSessionResponse {
  id: string
  detail: string
}

export const deleteSession = async (
  sessionId: string,
): Promise<DeleteSessionResponse> => {
  const response = await apiClient.delete<DeleteSessionResponse>(
    `/api/v1/sessions/${sessionId}`,
  )
  return response.data as DeleteSessionResponse
}

export function useSessions() {
  return useQuery({
    queryKey: SESSIONS_KEY,
    queryFn: listSessions,
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY })
      toast({
        severity: 'success',
        title: 'Session deleted',
        description: data.detail,
      })
    },
    onError: (error: any) => {
      toast({
        severity: 'critical',
        title: 'Error deleting session',
        description: error?.message ?? 'An unexpected error occurred.',
      })
    },
  })
}

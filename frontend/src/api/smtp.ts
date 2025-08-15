import axios from '@/http/axios'
import { apiClient } from '@/http/stable-api-client'
import type { SMTPAccount } from '@/types/smtp'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/** List SMTP accounts for a session */
export const listSmtp = async (sessionId: string) => {
  const { data } = await axios.get<SMTPAccount[]>(`/api/v1/smtp/${sessionId}/accounts`)
  return data
}

/** Create SMTP account */
export const createSmtp = async (
  sessionId: string,
  payload: Partial<SMTPAccount>
) => {
  const { data } = await axios.post<SMTPAccount>(
    `/api/v1/smtp/${sessionId}/accounts`,
    payload
  )
  return data
}

/** Update SMTP account */
export const updateSmtp = async (
  sessionId: string,
  id: string,
  payload: Partial<SMTPAccount>
) => {
  const { data } = await axios.put<SMTPAccount>(
    `/api/v1/smtp/${sessionId}/accounts/${id}`,
    payload
  )
  return data
}

/** Delete SMTP account */
export const deleteSmtp = async (sessionId: string, id: string) => {
  await axios.delete(`/api/v1/smtp/${sessionId}/accounts/${id}`)
}

/** Bulk upload SMTP accounts */
export const bulkUploadSmtp = async (sessionId: string, data: string) => {
  await axios.post(`/api/v1/smtp/${sessionId}/bulk-upload`, { data })
}

export interface SMTPBatchAccountInput {
  server: string
  port: number
  email: string
  password: string
  timeout?: number
}

export async function smtpTestBatch(
  accounts: SMTPBatchAccountInput[],
  opts?: { timeout?: number; max_concurrent?: number }
) {
  const payload: unknown = { accounts }
  if (opts?.timeout != null) payload.timeout = opts.timeout
  if (opts?.max_concurrent != null) payload.max_concurrent = opts.max_concurrent
  return await apiClient.post('/api/v1/smtp/test-batch', payload)
}

export const SMTP_LIST_KEY = ['smtp-list'] as const

export function useSmtpList(sessionId: string) {
  return useQuery({
    queryKey: [...SMTP_LIST_KEY, sessionId],
    queryFn: () => listSmtp(sessionId),
  })
}

export function useCreateSmtp(sessionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<SMTPAccount>) => createSmtp(sessionId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...SMTP_LIST_KEY, sessionId] })
    },
  })
}

export function useUpdateSmtp(sessionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SMTPAccount> }) => updateSmtp(sessionId, id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...SMTP_LIST_KEY, sessionId] })
    },
  })
}

export function useDeleteSmtp(sessionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSmtp(sessionId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...SMTP_LIST_KEY, sessionId] })
    },
  })
}

import { apiClient } from '@/http/stable-api-client'
import type { InternalAxiosRequestConfig } from 'axios'
import { API_BASE } from '@/lib/api'

export class BadRequestError extends Error {}
export class ValidationError extends Error {}
export class TimeoutError extends Error {}

function handleError(err: unknown): never {
  if (err && typeof err === 'object' && 'isAxiosError' in err && err.isAxiosError) {
    const axiosError = err as any;
    if (axiosError.response) {
      const message = axiosError.response.data?.detail || axiosError.message
      switch (axiosError.response.status) {
        case 400:
          throw new BadRequestError(message)
        case 422:
          throw new ValidationError(message)
        case 504:
          throw new TimeoutError(message)
        default:
          throw new Error(message)
      }
    }
  }
  throw err
}

async function request<T>(config: InternalAxiosRequestConfig, opts?: { retries?: number; signal?: AbortSignal }) {
  const { retries = 3, signal } = opts || {}
  let attempt = 0
  const cfg = { ...config, signal }
  while (true) {
    try {
      const res = await apiClient.get<T>(cfg.url as string as any, cfg as any)
      return res as T
    } catch (err) {
      if (attempt >= retries || (err && typeof err === 'object' && 'isCancel' in err && err.isCancel)) throw err
      attempt += 1
    }
  }
}

export async function getImapFolders(sessionId: number): Promise<string[]> {
  try {
    const data = await apiClient.get<{ folders: string[] }>(`${API_BASE}/imap/${sessionId}/folders`)
    return data.folders
  } catch (err) {
    handleError(err)
  }
}

export async function sendTestEmail(smtpId: number) {
  try {
    const data = await apiClient.post('/email-check/send-test-email', {
      smtp_id: smtpId,
    })
    return data
  } catch (err) {
    handleError(err)
  }
}

export interface ComposeEmailPayload {
  email_data: string
  file?: File | null
  smtpMode?: string
  smtpIds?: string[]
  count?: number
  templates?: string[]
}

export async function sendEmail(payload: ComposeEmailPayload, signal?: AbortSignal) {
  const form = new FormData()
  form.append('email_data', payload.email_data)
  if (payload.file) form.append('file', payload.file)
  if (payload.smtpMode) form.append('smtp_mode', payload.smtpMode)
  payload.smtpIds?.forEach(id => form.append('smtp_ids', id))
  if (payload.count !== undefined) form.append('count', String(payload.count))
  payload.templates?.forEach(t => form.append('templates', t))
  try {
    return await apiClient.post<unknown>('/compose/compose/send', form, { signal } as any)
  } catch (err) {
    handleError(err)
  }
}

export interface BulkJobStatus {
  sent: number
  failed: number
  total: number
  status: string
  [key: string]: unknown
}

export async function getJobStatus(id: string, signal?: AbortSignal) {
  try {
    return await request<BulkJobStatus>(
      { method: 'GET', url: `/bulk_mail/${id}` },
      { signal },
    )
  } catch (err) {
    handleError(err)
  }
}

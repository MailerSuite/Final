import { apiClient } from '@/http/stable-api-client'
import { API_BASE } from '@/lib/api'
import type { IMAPFolder } from '@/lib/api/imap'

export type IMAPTestResult =
  | { status: 'success'; folders: string[]; message?: string }
  | { status: 'error'; folders: string[]; message: string }

function parseError(error: unknown): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.message ||
    'Unknown error'
  )
}

export async function test(accountId: string): Promise<IMAPTestResult> {
  try {
    await apiClient.post(`${API_BASE}/imap/accounts/${accountId}/test`)
  } catch (err) {
    return { status: 'error', folders: [], message: parseError(err) }
  }

  try {
    await apiClient.post(`${API_BASE}/imap/accounts/${accountId}/retrieve`)
  } catch (err) {
    return { status: 'error', folders: [], message: parseError(err) }
  }

  try {
    const data = await apiClient.get<IMAPFolder[]>(
      `${API_BASE}/imap/accounts/${accountId}/folders`,
    )
    const folders = data.map((f) => (f as any).name)
    return {
      status: 'success',
      folders,
      ...(folders.length === 0
        ? { message: 'No folders found – using INBOX.' }
        : {}),
    }
  } catch (err) {
    return { status: 'error', folders: [], message: parseError(err) }
  }
}

export default { test }

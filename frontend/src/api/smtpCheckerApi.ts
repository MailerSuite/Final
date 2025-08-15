import axios from '@/http/axios'
import type { SMTPAccount } from '@/types/smtp'

export async function listSmtpAccounts(
  sessionId: string,
  params?: { sort_by?: 'status' | 'response_time' | 'country'; sort_order?: 'asc' | 'desc' },
) {
  const { data } = await axios.get<SMTPAccount[]>(`/smtp/${sessionId}/accounts`, {
    params,
  })
  return data
}

export async function createSmtpAccount(
  sessionId: string,
  payload: Partial<SMTPAccount>,
) {
  const { data } = await axios.post<SMTPAccount>(
    `/smtp/${sessionId}/accounts`,
    payload,
  )
  return data
}

export async function updateSmtpAccount(
  sessionId: string,
  accountId: string,
  payload: Partial<SMTPAccount>,
) {
  const { data } = await axios.put<SMTPAccount>(
    `/smtp/${sessionId}/accounts/${accountId}`,
    payload,
  )
  return data
}

export async function testSmtpAccount(
  sessionId: string,
  accountId: string,
): Promise<{ message?: string }> {
  try {
    const { data } = await axios.post<{ message?: string } | string>(
      `/smtp/${sessionId}/check`,
      { account_ids: [accountId] },
    )
    if (typeof data === 'string') return { message: data }
    return data
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const detail =
        (error.response?.data as any)?.detail ||
        (error.response?.data as any)?.message ||
        error.message
      const status = error.response?.status
      const msg = detail
        ? `${detail} (status ${status})`
        : `Request failed with status code ${status}`
      throw new Error(msg)
    }
    throw error
  }
}

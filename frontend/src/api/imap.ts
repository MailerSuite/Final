import axios from '@/http/axios'
import { apiClient } from '@/http/stable-api-client'
import type { IMAPAccount, IMAPMessage, IMAPRetrieveResponse } from '@/types/imap'

/** List IMAP accounts for a session */
export const listImap = async (sessionId: string) => {
  const { data } = await axios.get<IMAPAccount[]>(`/api/v1/imap/${sessionId}/accounts`)
  return data
}

/** Create IMAP account */
export const createImap = async (
  sessionId: string,
  payload: Partial<IMAPAccount>
) => {
  const body: unknown = {
    email: payload.email,
    password: payload.password,
    imap_server: (payload as any).imap_server || (payload as any).server || '',
    imap_port: (payload as any).imap_port || (payload as any).port || 993,
    use_oauth: payload.use_oauth ?? false,
  }
  const { data } = await axios.post<IMAPAccount>(
    `/api/v1/imap/${sessionId}/accounts`,
    body
  )
  return data
}

/** Delete IMAP account */
export const deleteImap = async (sessionId: string, id: string) => {
  await axios.delete(`/api/v1/imap/${sessionId}/accounts/${id}`)
}

/** Update IMAP account */
export const updateImap = async (
  sessionId: string,
  id: string,
  payload: Partial<IMAPAccount>
) => {
  const body: unknown = {
    email: payload.email,
    password: payload.password,
    imap_server: (payload as any).imap_server || (payload as any).server,
    imap_port: (payload as any).imap_port || (payload as any).port,
    use_oauth: payload.use_oauth,
  }
  const { data } = await axios.put<IMAPAccount>(
    `/api/v1/imap/${sessionId}/accounts/${id}`,
    body
  )
  return data
}

/** Bulk upload accounts from email */
export const bulkUploadImap = async (sessionId: string, data: string) => {
  await axios.post(`/api/v1/imap/${sessionId}/bulk-upload-from-email`, null, {
    params: { email_data: data },
  })
}

export interface IMAPBatchAccountInput {
  server: string
  port: number
  email: string
  password: string
  timeout?: number
}

export async function imapTestBatch(
  accounts: IMAPBatchAccountInput[],
  opts?: { timeout?: number; max_concurrent?: number }
) {
  const payload: unknown = { accounts }
  if (opts?.timeout != null) payload.timeout = opts.timeout
  if (opts?.max_concurrent != null) payload.max_concurrent = opts.max_concurrent
  return await apiClient.post('/api/v1/imap/test-batch', payload)
}

/** Test specific IMAP account connection */
export const testImapAccount = async (
  accountId: string,
): Promise<{ status: string; message?: string }> => {
  const { data } = await axios.post<{ status: string; message?: string }>(
    `/api/v1/imap/accounts/${accountId}/test`,
  )
  return data
}

/** Retrieve messages from a folder */
export const getFolderMessages = async (
  accountId: string,
  folder = 'INBOX',
): Promise<IMAPMessage[]> => {
  const { data } = await axios.get<IMAPMessage[]>(
    `/api/v1/imap/accounts/${accountId}/folders/${encodeURIComponent(folder)}/messages`,
  )
  return data
}

/** Retrieve emails for an IMAP account */
export const retrieveEmails = async (
  accountId: string,
): Promise<IMAPRetrieveResponse> => {
  const { data } = await axios.get<IMAPRetrieveResponse>(
    `/api/v1/imap/accounts/${accountId}/retrieve-messages`,
  )
  return data
}

export interface SendTestEmailPayload {
  template_id: string
  imap_account_id: string
  recipient_override?: string
  emails_per_item: number
}

export const sendTestEmail = async (payload: SendTestEmailPayload) => {
  const { data } = await axios.post('/api/v1/email-check/send-test-email', payload)
  return data
}

import axios from '@/http/axios'
import type { IMAPAccount, IMAPMessage } from '@/types/imap'

export async function listImapAccounts(sessionId: string) {
  const { data } = await axios.get<IMAPAccount[]>(`/imap/${sessionId}/accounts`)
  return data
}

export async function testImapAccount(accountId: string) {
  const { data } = await axios.post<{ status?: string; message?: string }>(
    `/imap/accounts/${accountId}/test`,
  )
  return data
}

export async function getMessages(accountId: string, folder = 'INBOX') {
  const { data } = await axios.get<IMAPMessage[]>(
    `/imap/accounts/${accountId}/folders/${encodeURIComponent(folder)}/messages`,
  )
  return data
}

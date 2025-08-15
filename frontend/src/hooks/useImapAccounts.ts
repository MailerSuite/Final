import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  testConnection,
  syncAccount,
  retrieveAccount,
  startAuto,
  stopAuto,
} from '@/lib/api/imap'
import type { IMAPAccount } from '@/types/imap'

export function useImapAccounts(sessionId: string) {
  const queryClient = useQueryClient()

  const listQuery = useQuery({
    queryKey: ['imapAccounts', sessionId],
    queryFn: () => listAccounts(sessionId),
  })

  const create = useMutation({
    mutationFn: (payload: Partial<IMAPAccount>) =>
      createAccount(sessionId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['imapAccounts', sessionId] }),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IMAPAccount> }) =>
      updateAccount(sessionId, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['imapAccounts', sessionId] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteAccount(sessionId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['imapAccounts', sessionId] }),
  })

  const test = useMutation({
    mutationFn: (id: string) => testConnection(id),
  })

  const sync = useMutation({ mutationFn: (id: string) => syncAccount(id) })
  const retrieve = useMutation({ mutationFn: (id: string) => retrieveAccount(id) })
  const start = useMutation({ mutationFn: (id: string) => startAuto(id) })
  const stop = useMutation({ mutationFn: (id: string) => stopAuto(id) })

  return { listQuery, create, update, remove, test, sync, retrieve, start, stop }
}

import { useQuery } from '@tanstack/react-query'
import { getFolders, getFolderMessages } from '@/lib/api/imap'

export function useImapFolders(accountId?: string) {
  const foldersQuery = useQuery({
    queryKey: ['imapFolders', accountId],
    queryFn: () => (accountId ? getFolders(accountId) : Promise.resolve([])),
    enabled: !!accountId,
  })

  const useMessagesQuery = (folder?: string, search = '') =>
    useQuery({
      queryKey: ['imapMessages', accountId, folder, search],
      queryFn: async () => {
        if (!accountId || !folder) return []
        try {
          const messages = await getFolderMessages(accountId, folder, { search })
          return messages
        } catch (error) {
          console.error(`Failed to fetch messages for ${folder}:`, error)
          throw error
        }
      },
      enabled: !!accountId && !!folder,
    })

  return { foldersQuery, useMessagesQuery }
}

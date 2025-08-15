import { useQuery } from '@tanstack/react-query'
import { getFolders } from '@/lib/api/imap'
import type { Folder } from '@/types/mail'

export default function useFolders(accountId?: string) {
  return useQuery<Folder[]>({
    queryKey: ['folders', accountId],
    queryFn: () => (accountId ? getFolders(accountId) : Promise.resolve([])),
    enabled: !!accountId,
  })
}

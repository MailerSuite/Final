import { useQuery } from '@tanstack/react-query'
import { getMessage } from '@/lib/api/imap'

export function useImapMessage(messageId?: string) {
  return useQuery({
    queryKey: ['imapMessage', messageId],
    queryFn: () => (messageId ? getMessage(messageId) : Promise.resolve(null)),
    enabled: !!messageId,
  })
}

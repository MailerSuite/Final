import { Dialog, DialogContent } from '@/components/ui/dialog'
import Loader from '@/components/common/Loader'
import ErrorAlert from '@/components/common/ErrorAlert'
import { QueryObserverResult } from '@tanstack/react-query'
import type { IMAPMessage } from '@/types/imap'

interface Props {
  openId?: string
  onOpenChange: (id?: string) => void
  query: QueryObserverResult<IMAPMessage | null>
}

export default function MessageDrawer({ openId, onOpenChange, query }: Props) {
  return (
    <Dialog open={!!openId} onOpenChange={(open: boolean) => !open && onOpenChange(undefined)}>
      <DialogContent className="p-4 space-y-2">
        {query.isLoading && <Loader />}
        {query.error && <ErrorAlert message="Failed to load message" />}
        {query.data && (
          <div>
            <h3 className="font-semibold mb-2">{query.data.subject}</h3>
            <div className="prose" dangerouslySetInnerHTML={{ __html: (query.data as any)?.body_html || '' }} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

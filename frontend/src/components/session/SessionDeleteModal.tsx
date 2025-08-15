import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import ConfirmDialog from '@/components/common/ConfirmDialog'

import { toast } from '@/hooks/smtp-checker/use-toast'
import * as sessionService from '@/services/sessionService'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  sessionName?: string
  /**
   * Called after the delete request succeeds or fails.
   * Success is indicated by a boolean argument.
   */
  onConfirm?: (success: boolean) => void
}

export default function SessionDeleteModal({
  open,
  onOpenChange,
  sessionId,
  sessionName,
  onConfirm,
}: Props) {
  const handleConfirm = async () => {
    try {
      await sessionService.deleteSession(sessionId)
      onConfirm?.(true)
    } catch (err: any) {
      toast({
        severity: 'critical',
        description: err?.response?.data?.detail || 'Failed to delete session',
      })
      onConfirm?.(false)
      throw err
    }
  }
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete session?"
      description={`This will permanently delete "${sessionName ?? ''}". This action cannot be undone.`}
      confirmLabel="Delete Session"
      cancelLabel="Cancel"
      onConfirm={handleConfirm}
      icon={<ExclamationTriangleIcon className="size-6 text-warning" aria-hidden="true" />}
      variant="warning"
    />
  )
}

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import ConfirmDialog from '@/components/common/ConfirmDialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
}

export default function DeleteSessionConfirm({ open, onOpenChange, onConfirm }: Props) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete session?"
      description="This will permanently remove the session and its logs. This action cannot be undone."
      confirmLabel="Delete Session"
      cancelLabel="Cancel"
      onConfirm={onConfirm}
      icon={<ExclamationTriangleIcon className="size-6 text-warning" aria-hidden="true" />}
      variant="warning"
    />
  )
}

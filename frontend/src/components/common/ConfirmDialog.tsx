import { ReactNode } from 'react'
import UniversalModal from '../modals/UniversalModal'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  icon?: ReactNode
  variant?: 'default' | 'warning'
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  icon,
  variant = 'warning',
}: Props) {
  const confirmVariant = variant === 'warning' ? 'destructive' : 'primary'
  return (
    <UniversalModal
      title={title}
      description={description}
      icon={icon}
      isOpen={open}
      onClose={() => onOpenChange(false)}
      footerActions={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={async () => {
              await onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description}
    </UniversalModal>
  )
}

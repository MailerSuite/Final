import { ReactNode, useEffect } from 'react'
import BaseModal from '@/components/ui/BaseModal'
import ModalBody from '@/components/ui/ModalBody'
import { Button } from '@/components/ui/button'

export interface ModalProps {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  isOpen: boolean
  onClose: () => void
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  variant?: 'default' | 'warning'
  children?: ReactNode
}

export default function Modal({
  title: titleProp,
  description,
  icon,
  isOpen,
  onClose,
  primaryLabel,
  onPrimary,
  secondaryLabel = 'Cancel',
  onSecondary,
  variant = 'default',
  children,
}: ModalProps) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') onPrimary()
    }
    if (isOpen) {
      window.addEventListener('keydown', handle)
    }
    return () => window.removeEventListener('keydown', handle)
  }, [isOpen, onClose, onPrimary])

  const footer = (
    <>
      {secondaryLabel && (
        <Button
          variant="outline"
          className="bg-muted hover:bg-muted text-white"
          onClick={() => {
            onSecondary?.()
            onClose()
          }}
        >
          {secondaryLabel}
        </Button>
      )}
      <Button
        variant={variant === 'warning' ? 'destructive' : 'primary'}
        className="text-white"
        onClick={onPrimary}
      >
        {primaryLabel}
      </Button>
    </>
  )

  const title = (
    <span className="flex items-center gap-2">
      {icon && <span aria-hidden="true" className="size-6">{icon}</span>}
      {titleProp}
    </span>
  )

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <ModalBody>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {children}
      </ModalBody>
    </BaseModal>
  )
}

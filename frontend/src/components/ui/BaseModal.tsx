import { ReactNode } from 'react'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogClose,
} from '@/components/ui/dialog'

export interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  footer?: ReactNode
  children: ReactNode
}

export default function BaseModal({
  isOpen,
  onClose,
  title,
  footer,
  children,
}: BaseModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay className="bg-black bg-opacity-50 backdrop-blur-sm" />
      <DialogContent
        className="w-full max-w-modalWidth p-0 overflow-hidden rounded-xl border border-border dark:border-border bg-background shadow-lg"
        showCloseButton={false}
      >
        <DialogClose
          className="absolute right-5 top-5 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Close modal"
        >
          <X className="size-4" />
        </DialogClose>
        <DialogHeader className="px-6 pt-6">
          <DialogTitle asChild>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
          </DialogTitle>
        </DialogHeader>
        {children}
        {footer && <div className="px-6 pb-6 pt-4">{footer}</div>}
      </DialogContent>
    </Dialog>
  )
}

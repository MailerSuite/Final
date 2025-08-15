import { ReactNode } from 'react'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

interface InfoModalProps {
  title: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export default function InfoModal({ title, isOpen, onClose, children }: InfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay className="bg-black/60 backdrop-blur-sm fixed inset-0" />
      <DialogContent className="bg-surface-2 text-foreground border border-border dark:border-border rounded-xl shadow-lg p-0 w-11/12 sm:max-w-lg md:max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-border">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogClose className="text-muted-foreground hover:text-white">
            <X className="w-4 h-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
        <ScrollArea className="max-h-[60vh] px-6 py-4 pr-8">{children}</ScrollArea>
        <div className="flex justify-end border-t border-border dark:border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

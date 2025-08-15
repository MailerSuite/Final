import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogClose,
} from '@/components/ui/alert-dialog'

interface Props { message: string }

export default function ErrorAlert({ message }: Props) {
  const [open, setOpen] = useState(true)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement
    } else {
      triggerRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    setOpen(true)
  }, [message])

  if (!open) return null

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="bg-background rounded-lg shadow-lg border-l-4 border-destructive p-6">
        <AlertDialogClose className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </AlertDialogClose>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">Error</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  )
}

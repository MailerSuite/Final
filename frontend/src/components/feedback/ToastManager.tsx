import { Toaster } from '@/components/ui/toaster'
import { toast } from '@/hooks/useToast'
import type { ToastProps } from '@/components/ui/toast'

const shown = new Set<string>()

export function showInfo(message: string, opts?: Omit<ToastProps, 'title'>) {
  if (shown.has(message)) return
  shown.add(message)
  toast({
    title: message,
    severity: 'info',
    onOpenChange(open) {
      if (!open) shown.delete(message)
    },
    ...opts,
  })
}

export function showError(message: string, opts?: Omit<ToastProps, 'title'>) {
  if (shown.has(message)) return
  shown.add(message)
  toast({
    title: message,
    severity: 'critical',
    onOpenChange(open) {
      if (!open) shown.delete(message)
    },
    ...opts,
  })
}

export function ToastManager() {
  return <Toaster />
}

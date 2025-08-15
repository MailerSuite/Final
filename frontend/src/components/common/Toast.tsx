import { toast } from '@/hooks/useToast'

export function showError(message: string) {
  toast({
    severity: 'critical',
    title: 'Connection Error',
    description: message,
  })
}

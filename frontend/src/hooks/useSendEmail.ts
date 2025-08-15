import { useMutation } from '@tanstack/react-query'
import { toast } from '@/hooks/useToast'
import type { ComposeEmailPayload } from '@/services/emailService'
import { sendEmail } from '@/services/emailService'
import { useRef } from 'react'

export function useSendEmail() {
  const controllerRef = useRef<AbortController>()

  const mutation = useMutation({
    mutationFn: async (payload: ComposeEmailPayload) => {
      const controller = new AbortController()
      controllerRef.current = controller
      return sendEmail(payload, controller.signal)
    },
    onSuccess: () => {
      toast({ severity: 'success', description: 'Email sent' })
    },
    onError: (err: unknown) => {
      toast({ severity: 'critical', description: err?.message ?? 'Failed to send' })
    },
  })

  const cancel = () => controllerRef.current?.abort()

  return { ...mutation, cancel }
}

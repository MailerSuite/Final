import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '@/http/axios'
import { API } from '@/api/endpoints'
import type { CheckResult, CheckStatus } from '@/types/checks'

export const SMTP_HISTORY_KEY = ['smtp-history'] as const

export function useSmtpHistory() {
  return useQuery({
    queryKey: SMTP_HISTORY_KEY,
    queryFn: async () => {
      const { data } = await axios.get<CheckResult[]>(API.templateHistory)
      return data
    },
  })
}

export function useUpdateSmtpStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CheckStatus }) => {
      await axios.patch(API.smtpStatus(id), { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SMTP_HISTORY_KEY })
    },
  })
}

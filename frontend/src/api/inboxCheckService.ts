import axiosInstance from '@/http/axios'
import { useMutation, useQuery } from '@tanstack/react-query'

export interface InboxCheckOptions {
  domains: Array<{ id: string; name: string }>
  templates: Array<{ id: string; name: string }>
  proxies: Array<{ id: string; name: string }>
  smtps: Array<{ id: string; name: string }>
  imapInboxes: Array<{ id: string; name: string }>
}

export interface StepResult {
  step: string
  status: 'pass' | 'fail'
  timestamp: string
  error?: string
}

export const getOptions = async () => {
  const { data } = await axiosInstance.get<InboxCheckOptions>('/api/inbox-check/options')
  return data
}

export const runCheck = async (payload: {
  domain: string
  template: string
  proxy: string
  smtp: string
  imap: string
}) => {
  const { data } = await axiosInstance.post<StepResult[]>('/api/inbox-check', payload)
  return data
}

export const INBOX_OPTIONS_KEY = ['inbox-options'] as const

export function useInboxOptions() {
  return useQuery({ queryKey: INBOX_OPTIONS_KEY, queryFn: getOptions })
}

export function useRunInboxCheck() {
  return useMutation({ mutationFn: (payload: { domain: string; template: string; proxy: string; smtp: string; imap: string }) => runCheck(payload) })
}

export default { getOptions, runCheck }

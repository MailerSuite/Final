import { create } from 'zustand'
import {
  smtpApi,
  imapApi,
  proxyApi,
  templateApi,
  leadBaseApi,
} from '@/http/api'

interface ResourceCountsState {
  smtp: number | null
  imap: number | null
  templates: number | null
  proxies: number | null
  leads: number | null
  loading: boolean
  fetchCounts: (sessionId: string) => Promise<void>
}

const useResourceCountsStore = create<ResourceCountsState>((set) => ({
  smtp: null,
  imap: null,
  templates: null,
  proxies: null,
  leads: null,
  loading: false,
  fetchCounts: async (sessionId: string) => {
    set({ loading: true })
    try {
      const [smtpRes, imapRes, proxyRes, templateRes, leadBases] =
        await Promise.all([
          smtpApi.list(Number(sessionId)).then((r) => r.data),
          imapApi.list(sessionId).then((r) => r.data),
          proxyApi.list(sessionId).then((r) => r.data),
          templateApi.list({ session_id: sessionId }).then((r) => r.data),
          leadBaseApi.list('').then((r) => r.data),
        ])
      const activeCount = smtpRes.filter(
        (acc: any) => acc.status === 'checked'
      ).length
      set({
        smtp: activeCount,
        imap: imapRes.length,
        proxies: proxyRes.length,
        templates: templateRes.length,
        leads: leadBases.reduce(
          (acc: number, base: any) => acc + (base.leads_count ?? 0),
          0
        ),
      })
    } catch {
      // ignore errors
    } finally {
      set({ loading: false })
    }
  },
}))

export default useResourceCountsStore

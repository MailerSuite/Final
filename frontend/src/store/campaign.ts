import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { campaignsApi } from '@/http/api'
import type { EmailCampaign } from '@/types'

export interface CampaignDraft {
  name: string
  templateIds: string[]
  senders: string[]
  sender?: string
  cc?: string[]
  bcc?: string[]
  messageType?: 'html'
  xHeaders: { key: string; value: string }[]
  smtpAccounts: string[]
  proxies: string[]
  retries: number
  timeout: number
  batchSize: number
  delaySeconds: number
  leadDatabases: string[]
}

interface CampaignState {
  campaigns: EmailCampaign[]
  isLoading: boolean
  draft: CampaignDraft
  setCampaigns: (campaigns: EmailCampaign[]) => void
  getCampaigns: (sessionId: string) => Promise<void>
  updateDraft: (values: Partial<CampaignDraft>) => void
  clearDraft: () => void
}

const defaultDraft: CampaignDraft = {
  name: '',
  templateIds: [],
  senders: [],
  sender: '',
  cc: [],
  bcc: [],
  messageType: 'html',
  xHeaders: [],
  smtpAccounts: [],
  proxies: [],
  retries: 3,
  timeout: 10000,
  batchSize: 100,
  delaySeconds: 0,
  leadDatabases: [],
}

const useCampaignStore = create<CampaignState>()(
  persist(
    (set, get) => ({
      campaigns: [],
      isLoading: false,
      draft: { ...defaultDraft },
      setCampaigns: (campaigns) => set({ campaigns }),
      getCampaigns: async (sessionId) => {
        set({ isLoading: true })
        try {
          const { data } = await campaignsApi.list(sessionId)
          set({ campaigns: Array.isArray(data) ? data : [] })
        } catch (err) {
          console.error(err)
          set({ campaigns: [] })
        } finally {
          set({ isLoading: false })
        }
      },
      updateDraft: (values) =>
        set((state) => ({ draft: { ...state.draft, ...values } })),
      clearDraft: () => set({ draft: { ...defaultDraft } }),
    }),
    {
      name: 'campaign-store',
      partialize: (state) => ({ draft: state.draft }),
    }
  )
)

export default useCampaignStore

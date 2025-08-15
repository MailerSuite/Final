import { useQuery } from '@tanstack/react-query'
import axios from '@/http/axios'

export interface Option {
  id: string
  name: string
}

export interface CampaignFormOptions {
  templates: Option[]
  leadBases: Option[]
  smtps: Option[]
  proxies: Option[]
}

export const CAMPAIGN_OPTIONS_KEY = ['campaignOptions'] as const

export function useCampaignForm(sessionId?: string) {
  return useQuery({
    queryKey: [...CAMPAIGN_OPTIONS_KEY, sessionId],
    queryFn: async (): Promise<CampaignFormOptions> => {
      if (!sessionId) {
        return { templates: [], leadBases: [], smtps: [], proxies: [] }
      }
      try {
        const { data } = await axios.get<CampaignFormOptions>('/campaigns/options', {
          params: { session_id: sessionId },
        })
        return data
      } catch (err) {
        console.error('Failed to fetch campaign form options', err)
        return { templates: [], leadBases: [], smtps: [], proxies: [] }
      }
    },
    enabled: !!sessionId,
    retry: false,
    onError: () => {
      /* handled locally */
    },
  })
}

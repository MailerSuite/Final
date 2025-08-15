import { apiClient } from '@/http/stable-api-client'
import type { EmailCampaign, JobLog } from '@/types'
import type { CampaignCreate } from '@/types/campaign'
import { stringify } from '@/utils/debug'

/** List campaigns for a session */
export const listCampaigns = async (sessionId: string) => {
  // Prefer unified list which returns { items, total, ... }
  try {
    const unified: any = await apiClient.get(`/api/v1/campaigns`)
    if (Array.isArray(unified)) return unified as EmailCampaign[]
    const items = (unified && (unified.items || unified.data)) || []
    return items as EmailCampaign[]
  } catch {
    // Fallback: session-scoped legacy returns array
    return await apiClient.get<EmailCampaign[]>(`/api/v1/sessions/${sessionId}/campaigns`)
  }
}

/** Get single campaign */
export const getCampaign = async (sessionId: string, id: string) => {
  try {
    return await apiClient.get<EmailCampaign>(`/api/v1/campaigns/${id}`)
  } catch {
    return await apiClient.get<EmailCampaign>(`/api/v1/sessions/${sessionId}/campaigns/${id}`)
  }
}

/** Create campaign in a session */
export const createCampaign = async (
  sessionId: string,
  payload: CampaignCreate
) => {
  try {
    return await apiClient.post<EmailCampaign>(`/api/v1/campaigns`, payload as any)
  } catch {
    return await apiClient.post<EmailCampaign>(`/api/v1/sessions/${sessionId}/campaigns`, payload)
  }
}

/** Delete campaign */
export const deleteCampaign = async (sessionId: string, id: string) => {
  try {
    await apiClient.delete(`/api/v1/campaigns/${id}`)
  } catch {
    await apiClient.delete(`/api/v1/sessions/${sessionId}/campaigns/${id}`)
  }
}

/** Start campaign */
export const startCampaign = async (sessionId: string, id: string) => {
  // Prefer unified route if available; backend shims legacy
  await apiClient.post(`/api/v1/campaigns/${id}/send`).catch(async () => {
    await apiClient.post(`/api/v1/sessions/${sessionId}/campaigns/${id}/start`)
  })
}

/** Pause campaign */
export const pauseCampaign = async (sessionId: string, id: string) => {
  await apiClient.post(`/api/v1/campaigns/${id}/pause`).catch(async () => {
    await apiClient.post(`/api/v1/sessions/${sessionId}/campaigns/${id}/pause`)
  })
}

/** Stop campaign */
export const stopCampaign = async (sessionId: string, id: string) => {
  await apiClient.post(`/api/v1/campaigns/${id}/stop`).catch(async () => {
    await apiClient.post(`/api/v1/sessions/${sessionId}/campaigns/${id}/stop`)
  })
}

/** Campaign progress logs */
export const campaignProgress = async (sessionId: string, id: string) => {
  try {
    return await apiClient.get<JobLog[]>(`/api/v1/campaigns/${id}/analytics`)
  } catch {
    return await apiClient.get<JobLog[]>(`/api/v1/sessions/${sessionId}/campaigns/${id}/analytics`)
  }
}

/** Throttle settings */
export const getCampaignThrottle = async (campaignId: string) => {
  return await apiClient.get<{ batch_size: number; delay_between_batches: number; threads_count: number }>(
    `/api/v1/campaigns/${campaignId}/throttle`
  )
}

export const setCampaignThrottle = async (
  campaignId: string,
  payload: Partial<{ batch_size: number; delay_between_batches: number; threads_count: number }>
) => {
  return await apiClient.post(`/api/v1/campaigns/${campaignId}/throttle`, payload)
}

/** Assign thread pool */
export const assignCampaignThreadPool = async (campaignId: string, threadPoolId: string) => {
  return await apiClient.post(`/api/v1/campaigns/${campaignId}/thread-pool`, { thread_pool_id: threadPoolId })
}

/** Recipients */
export const addCampaignRecipients = async (
  campaignId: string,
  payload: { lead_base_ids?: string[]; recipients?: string[] }
) => {
  return await apiClient.post(`/api/v1/campaigns/${campaignId}/recipients`, payload)
}

export const removeCampaignRecipients = async (
  campaignId: string,
  payload: { email_ids?: string[]; emails?: string[] }
) => {
  return await apiClient.delete(`/api/v1/campaigns/${campaignId}/recipients`, { data: payload })
}

export const exportCampaignEmails = async (campaignId: string, format: 'json' | 'csv' = 'json') => {
  return await apiClient.get(`/api/v1/campaigns/${campaignId}/emails/export`, { params: { format } })
}

/** WS: progress */
export const getCampaignProgressWsUrl = (campaignId: string) => `/api/v1/ws/campaigns/${campaignId}/progress`

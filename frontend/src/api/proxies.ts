import axios from '@/http/axios'
import type { ProxyServer } from '@/types/proxy'
import { getSessionId } from '@/utils/getSessionId'

const normalize = (p: unknown): ProxyServer => ({
  id: p.id,
  ip_address: p.ip_address || p.host,
  port: p.port,
  is_firewall_enabled: p.firewall_on ?? p.is_firewall_enabled,
  is_active: p.is_active,
  firewall_on: p.firewall_on,
  is_custom_proxy: p.is_custom_proxy,
})

/** List proxies for a session */
export const listProxies = async (_sessionId: string) => {
  const { data } = await axios.get<unknown[]>(`/api/v1/proxies`)
  return data.map(normalize)
}

/** List all proxies */
export const listAllProxies = async () => {
  const sessionId = getSessionId()
  if (!sessionId) {
    console.error('❌ session_id not found')
    return []
  }
  // Prefer canonical default-session listing
  const { data } = await axios.get<unknown[]>(`/api/v1/proxies`)
  return data.map(normalize)
}

/** Create proxy */
export const createProxy = async (
  _sessionId: string,
  payload: Partial<ProxyServer>
) => {
  const { data } = await axios.post<unknown>(`/api/v1/proxies`, payload)
  return normalize(data)
}

/** Delete proxy */
export const deleteProxy = async (_sessionId: string, id: string) => {
  await axios.delete(`/api/v1/proxies/${id}`)
}

/** Bulk upload proxies */
export const bulkUploadProxies = async (sessionId: string, data: string) => {
  await axios.post(`/api/v1/proxies/${sessionId}/bulk-upload`, null, {
    params: { proxy_data: data },
  })
}

/** Check proxies */
export const checkProxies = async (sessionId: string) => {
  const { data } = await axios.post(`/api/v1/proxies/${sessionId}/check`)
  return data
}

/** Get active proxy for a session */
export const getActiveProxy = async (
  sessionId: string,
) => {
  const { data } = await axios.get<any | null>(`/api/v1/proxies/${sessionId}/active`)
  return data ? normalize(data) : null
}

/** Set active proxy for a session */
export const setActiveProxy = async (
  sessionId: string,
  proxyId: string,
) => {
  const { data } = await axios.patch<any | null>(
    `/api/v1/proxies/${sessionId}/active`,
    { proxy_id: proxyId },
  )
  return data ? normalize(data) : null
}

import axios from '@/http/axios'
import { API } from './endpoints'

export interface HostDiscoveryRequest {
  email: string
}

export interface HostEntry {
  hostname: string
  port: number
  protocol?: string | null
  dns_record?: string | null
  priority?: number | null
  latency_ms?: number | null
  status: string
}

export interface HostDiscoveryResponse {
  email: string
  completed: boolean
  discovery_method: string
  results: HostEntry[]
}

/** Discover SMTP hosts for an email address */
export const discoverSmtpHosts = async (
  payload: HostDiscoveryRequest,
) => {
  const { data } = await axios.post<HostDiscoveryResponse>(
    API.smtpDiscovery,
    payload,
  )
  return data
}

/** Discover IMAP hosts for an email address */
export const discoverImapHosts = async (
  payload: HostDiscoveryRequest,
) => {
  const { data } = await axios.post<HostDiscoveryResponse>(
    '/discovery/imap-hosts',
    payload,
  )
  return data
}

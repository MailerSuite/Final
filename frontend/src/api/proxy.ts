import axios from '@/http/axios'

export interface ProviderCheck {
  provider: string
  status: 'listed' | 'clean' | 'error'
  message: string
  response_time_ms: number
  checked_at: string
  delist_url?: string
}

export interface BlacklistResult {
  address: string
  detected: number
  total: number
  results: ProviderCheck[]
}

export function checkBlacklist(
  addresses: string[],
  providers?: string[]
): Promise<BlacklistResult[]> {
  return axios
    .post<BlacklistResult[]>('/blacklist/check', {
      addresses,
      providers,
    })
    .then((res) => res.data)
}

export interface ProxyTestServer {
  host: string
  port: number
  username?: string | null
  password?: string | null
  proxy_type: string
}

export interface ProxyTestRequest {
  proxy_servers: ProxyTestServer[]
  timeout?: number | null
  test_url?: string | null
}

export interface ProxyTestResult {
  host: string
  port: number
  status: 'valid' | 'invalid' | 'error'
  response_time?: number | null
  error_message?: string | null
}

export interface ProxyBulkTestResponse {
  results: ProxyTestResult[]
}

export async function testProxies(
  payload: ProxyTestRequest
): Promise<ProxyBulkTestResponse> {
  const normalized = payload.proxy_servers.map((p) => ({
    ...p,
    username: p.username || null,
    password: p.password || null,
  }))
  const { data } = await axios.post<ProxyBulkTestResponse>('/api/v1/proxies/test', {
    ...payload,
    proxy_servers: normalized,
  })
  return data
}

export interface ProxySingleTestResponse {
  proxy_id: string
  proxy_host: string
  proxy_port: number
  status: 'valid' | 'invalid' | 'error'
  response_time?: number | null
  error_message?: string | null
}

export async function testProxy(
  proxyId: string,
  timeout?: number
): Promise<ProxySingleTestResponse> {
  const { data } = await axios.post<ProxySingleTestResponse>(
    `/api/v1/proxies/${encodeURIComponent(proxyId)}/test`,
    timeout ? { timeout } : {}
  )
  return data
}

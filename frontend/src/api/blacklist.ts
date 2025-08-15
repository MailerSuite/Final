import axiosInstance from '@/http/axios'

export interface ProviderCheck {
  provider: string
  status: 'listed' | 'clean' | 'error'
  message: string
  trace?: string
  response_time_ms: number
  checked_at: string
  delist_url?: string
}

export interface BlacklistResponse {
  detected: number
  total: number
  results: ProviderCheck[]
}

type ProviderParam = string | { id: string; name?: string }

const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/
const domainRegex = /^(?!:\/\/)([a-zA-Z0-9](?:[a-zA-Z0-9-_]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9-_]+)+)$/

function serializeProviders(providers?: ProviderParam | ProviderParam[]) {
  if (!providers) return undefined
  const list = Array.isArray(providers) ? providers : [providers]
  const names = list
    .map((p) => (typeof p === 'string' ? p : p.id || p.name))
    .filter(Boolean) as string[]
  return names.length ? names.join(',') : undefined
}

export const blacklistApi = {
  checkIp: async (ip: string, providers?: ProviderParam | ProviderParam[]) => {
    // Endpoint documented under `routers/blacklist.py` as `GET /ip`
    // Backend expects the IP string, not an object
    const providerParam = serializeProviders(providers)
    const { data } = await axiosInstance.get<BlacklistResponse>(
      `/blacklist/ip/${ip}`,
      {
        params: {
          ...(providerParam ? { providers: providerParam } : {}),
        },
      }
    )
    return data
  },
  checkDomain: async (
    domain: string,
    providers?: ProviderParam | ProviderParam[]
  ) => {
    // Endpoint documented under `routers/blacklist.py` as `GET /domain`
    // Backend expects the domain string in query parameters
    const providerParam = serializeProviders(providers)
    const { data } = await axiosInstance.get<BlacklistResponse>(
      `/blacklist/domain/${domain}`,
      {
        params: {
          ...(providerParam ? { providers: providerParam } : {}),
        },
      }
    )
    return data
  },
  checkBulk: async (
    values: string[],
    providers?: ProviderParam | ProviderParam[]
  ) => {
    const results: {
      value: string
      data?: BlacklistResponse
      error?: string
    }[] = []
    for (const value of values) {
      const trimmed = value.trim()
      if (!trimmed) continue
      try {
        const data = ipRegex.test(trimmed)
          ? await blacklistApi.checkIp(trimmed, providers)
          : await blacklistApi.checkDomain(trimmed, providers)
        results.push({ value: trimmed, data })
      } catch (err: unknown) {
        const message = err?.response?.data?.detail || 'check failed'
        results.push({ value: trimmed, error: message })
      }
    }
    return results
  },
}

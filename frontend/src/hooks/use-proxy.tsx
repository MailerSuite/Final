import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import axios from '@/http/axios'
import type { ProxyServer } from '@/types/proxy'

export interface ProxyCheckResult {
  status: boolean
  latency_ms?: number
}

interface ProxyContextState {
  proxies: ProxyServer[]
  activeProxy: ProxyServer | null
  refresh: () => Promise<void>
  selectProxy: (proxy: ProxyServer | null) => Promise<void>
  checkProxy: (id: string) => Promise<ProxyCheckResult>
}

const ProxyContext = createContext<ProxyContextState | undefined>(undefined)

export function ProxyProvider({ children }: { children: ReactNode }) {
  const [proxies, setProxies] = useState<ProxyServer[]>([])
  const [activeProxy, setActiveProxy] = useState<ProxyServer | null>(null)

  const refresh = async () => {
    const { data } = await axios.get<ProxyServer[]>('/proxies')
    setProxies(data)
    const active = data.find((p) => p.is_active)
    setActiveProxy(active || null)
  }

  useEffect(() => {
    refresh().catch(() => setProxies([]))
  }, [])

  const selectProxy = async (proxy: ProxyServer | null) => {
    if (!proxy) {
      await axios.post('/proxies/disable')
      setActiveProxy(null)
      return
    }
    await axios.post(`/proxies/${proxy.id}/activate`)
    setActiveProxy(proxy)
  }

  const checkProxy = async (id: string) => {
    const { data } = await axios.post<ProxyCheckResult>(`/proxies/${id}/check`)
    setProxies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: data.status } : p))
    )
    if (activeProxy?.id === id) {
      setActiveProxy({ ...activeProxy, is_active: data.status })
    }
    return data
  }

  const proxyContextValue = {
    proxies,
    activeProxy,
    refresh,
    selectProxy,
    checkProxy,
  }

  return (
    <ProxyContext.Provider value={proxyContextValue}>
      {children}
    </ProxyContext.Provider>
  )
}

export function useProxy() {
  const ctx = useContext(ProxyContext)
  if (!ctx) throw new Error('useProxy must be used within ProxyProvider')
  return ctx
}

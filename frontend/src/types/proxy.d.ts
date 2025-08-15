import type { ProxyServer } from './proxy'

export interface SocksProxy extends ProxyServer {
  name: string
  host: string
}

export interface ProxyCheckResponse {
  status: boolean
  latency_ms?: number
}

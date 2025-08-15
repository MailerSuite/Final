export interface SmtpConfig {
  id: string
  name: string
  host: string
  port: number
  email: string
  username: string
  password: string
  security: 'none' | 'ssl' | 'tls' | 'starttls'
  retries: number
  retryDelay: number
  connectionTimeout: number
  operationTimeout: number
  proxyEnabled: boolean
  proxyHost?: string
  proxyPort?: number
  proxyUsername?: string
  proxyPassword?: string
  status: 'pending' | 'valid' | 'invalid' | 'error' | 'none' | 'dead' | 'checked'
  lastTested?: string
  lastTestMessage?: string
  autoDiscovered?: boolean
  source: 'manual' | 'bulk' | 'file' | 'auto-discovery'
  last_checked?: string
  error_message?: string
}

export interface ProxyConfig {
  id: string
  ip_address: string
  port: number
  username?: string
  password?: string
  proxy_type: 'socks5' | 'http' | 'https'
  location: string
  is_active: boolean
  last_checked_at?: string
  is_valid: boolean
  responseTime?: number
  country?: string
  session_id?: string
  created_at?: string
  updated_at?: string
}

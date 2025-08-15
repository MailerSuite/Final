export interface ProxyServer {
  id: string
  ip_address: string
  port: number
  is_firewall_enabled: boolean
  /** Indicates if the proxy server responded successfully */
  is_active?: boolean
  /** Flag if the backend firewall is currently enabled */
  firewall_on?: boolean
  is_custom_proxy: boolean
  last_checked_at?: string
  response_time?: number
  country?: string
  is_valid?: boolean
}

export interface ProxyAccount {
  id: string
  ip_address: string
  port: number
  username: string
  password: string
  proxy_type: "socks5" | "http" | "https"
  session_id: string
  country: string
  is_active: boolean
  is_valid: boolean
  last_checked_at: string
  status: "valid" | "invalid" | "pending"
  mailStatus: "INBOX" | "JUNK" | "UNKNOWN" | "VALID"
  response_time?: number
  last_checked?: string
  created_at: string
  updated_at: string
}

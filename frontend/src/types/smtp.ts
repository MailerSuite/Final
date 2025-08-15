export interface SMTPAccount {
  id: string
  session_id: string
  server: string
  port: number
  email: string
  sender_name?: string
  password: string
  status: 'pending' | 'valid' | 'invalid' | 'error' | "checked"
  mailStatus: 'INBOX' | 'JUNK' | 'UNKNOWN' | 'VALID'
  response_time?: number | null
  last_checked?: string | null
  /** camelCase aliases */
  country: string
  discovery_status: string
  responseTime?: number | null
  lastCheck?: string | null
  error_message?: string | null
  last_response?: string | null
  lastResponse?: string | null
  last_error?: string | null
  lastError?: string | null
  retries?: number
  retryDelay?: number
  connectionTimeout?: number
  operationTimeout?: number
  created_at: string
  created?: string
}

export interface SmtpMetrics {
  connections: number
  successful: number
  failed: number
  retries?: number
  failovers?: number
  avgResponseMs: number
}

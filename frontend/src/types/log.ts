export interface SessionLog {
  id: string
  session_id: string
  type: string
  input: string
  status: 'info' | 'warning' | 'error' | 'success'
  message: string
  timestamp: string
  duration_ms?: number
  user?: string
}

export interface WebSocketFormatMessage {
  /** ISO timestamp of when the event occurred */
  timestamp: string
  /** Optional thread identifier */
  thread?: number
  /** Optional progress string like "5/10" or "50%" */
  progress?: string
  /** SOCKS proxy identifier if used */
  socks?: string
  /** Response payload or message */
  response?: string
  /** Status of the task or event */
  status: string
}

/**
 * Convert a WebSocketFormatMessage to a standardized log line.
 * Example output:
 * `2024-01-01T00:00:00Z - T1 - PROGRESS: 5/10 - socks5://127.0.0.1 - OK - running`
 */
export function formatWebSocketMessage(msg: WebSocketFormatMessage): string {
  const thread = msg.thread !== undefined ? `T${msg.thread}` : "-"
  const progress = msg.progress ? `PROGRESS: ${msg.progress}` : "PROGRESS: -"
  const socks = msg.socks ?? "no-socks"
  const response = msg.response ?? ""
  const parts = [msg.timestamp, thread, progress, socks, response, msg.status]
  return parts.join(" - ")
}

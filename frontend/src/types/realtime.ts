export type WsErrorEvent = {
  type: 'error'
  error: string
  message: string
  errorId?: string
  timestamp?: number
}

export function isWsErrorEvent(data: unknown): data is WsErrorEvent {
  if (!data || typeof data !== 'object') return false
  const anyData = data as Record<string, unknown>
  return anyData.type === 'error' && typeof anyData.message === 'string'
}

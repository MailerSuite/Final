import { createContext, useContext, useEffect, useRef } from 'react'
import { createWebSocket } from '@/utils/websocket'

const WebSocketCtx = createContext<WebSocket | null>(null)

interface Props {
  url: string
  children: React.ReactNode
}

export function WebSocketProvider({ url, children }: Props) {
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    wsRef.current = createWebSocket(url)
    return () => {
      wsRef.current?.close()
    }
  }, [url])

  return <WebSocketCtx.Provider value={wsRef.current}>{children}</WebSocketCtx.Provider>
}

export const useWebSocket = () => useContext(WebSocketCtx)

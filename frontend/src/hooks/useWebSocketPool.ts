import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultWebSocketPool } from '@/utils/ws/connection-pool'

export type WSEvent = 'message' | 'open' | 'close' | 'error'

export function useWebSocketPool() {
    const connIdRef = useRef<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    const connect = useCallback(async (type: string, url: string) => {
        if (connIdRef.current) return connIdRef.current
        const id = await defaultWebSocketPool.connect(type, url)
        connIdRef.current = id

        // mirror open/close state
        defaultWebSocketPool.on(id, 'open', () => setIsConnected(true))
        defaultWebSocketPool.on(id, 'close', () => setIsConnected(false))

        return id
    }, [])

    const send = useCallback((data: unknown) => {
        if (!connIdRef.current) return false
        return defaultWebSocketPool.send(connIdRef.current, data)
    }, [])

    const close = useCallback((code?: number, reason?: string) => {
        if (!connIdRef.current) return
        try {
            defaultWebSocketPool.close(connIdRef.current, code, reason)
        } finally {
            connIdRef.current = null
            setIsConnected(false)
        }
    }, [])

    const on = useCallback((event: WSEvent, handler: (ev: unknown) => void) => {
        if (!connIdRef.current) return
        defaultWebSocketPool.on(connIdRef.current, event, handler)
    }, [])

    const off = useCallback((event: WSEvent, handler: (ev: unknown) => void) => {
        if (!connIdRef.current) return
        defaultWebSocketPool.off(connIdRef.current, event, handler)
    }, [])

    useEffect(() => {
        return () => {
            // cleanup if still connected
            if (connIdRef.current) {
                try { defaultWebSocketPool.dispose() } catch (_) { }
                connIdRef.current = null
            }
        }
    }, [])

    return {
        connect,
        send,
        close,
        on,
        off,
        isConnected
    }
}

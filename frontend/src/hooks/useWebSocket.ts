import { useCallback, useEffect, useRef } from 'react'
import { API } from '@/api/endpoints'
import { defaultWebSocketPool } from '@/utils/ws/connection-pool'
import { isWsErrorEvent } from '@/types/realtime'

export interface WebSocketOptions {
  onOpen?: (ev: Event) => void
  onMessage?: (ev: MessageEvent) => void
  onError?: (ev: Event) => void
  onClose?: (ev: CloseEvent) => void
}

/**
 * Establishes a WebSocket connection that automatically reconnects on abnormal
 * closures using an exponential backoff strategy. Normal (1000) closures do not
 * trigger a reconnect.
 */
export function useWebSocket(path: string, opts: WebSocketOptions = {}) {
  const socketRef = useRef<WebSocket | null>(null)
  const retryCountRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const connIdRef = useRef<string | null>(null)

  // Minimal wrapper implementing the subset of WebSocket used by callers
  class PooledWebSocket implements WebSocket {
    // constants
    readonly CONNECTING = 0
    readonly OPEN = 1
    readonly CLOSING = 2
    readonly CLOSED = 3

    // fields
    readyState: number = 0
    url: string = ''
    protocol: string = ''
    extensions: string = ''
    bufferedAmount: number = 0
    binaryType: BinaryType = 'blob'

    onopen: ((this: WebSocket, ev: Event) => any) | null = null
    onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null
    onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null
    onerror: ((this: WebSocket, ev: Event) => any) | null = null

    private listeners = new Map<string, Set<unknown>>()
    private id: string

    constructor(id: string, url: string) {
      this.id = id
      this.url = url
      this.readyState = this.OPEN
    }

    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
      try { defaultWebSocketPool.send(this.id, data as any) } catch (_) { }
    }
    close(code?: number, reason?: string): void {
      try { defaultWebSocketPool.close(this.id, code, reason) } catch (_) { }
      this.readyState = this.CLOSED
    }

    addEventListener<K extends keyof WebSocketEventMap>(
      type: K,
      listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ): void {
      const set = this.listeners.get(type as string) || new Set()
      set.add(listener)
      this.listeners.set(type as string, set)
    }
    removeEventListener<K extends keyof WebSocketEventMap>(
      type: K,
      listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
      options?: boolean | EventListenerOptions
    ): void {
      const set = this.listeners.get(type as string)
      set?.delete(listener)
    }
    dispatchEvent(event: Event): boolean { return false }
  }

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    let base = import.meta.env.VITE_API_BASE as string | undefined
    if (base) {
      base = base.replace(/\/$/, '')
      if (!/^https?:\/\//.test(base)) {
        base = `${window.location.protocol}//${window.location.host}${base}`
      }
    } else {
      base = `${window.location.protocol}//${window.location.host}/api/v1`
    }
    const trimmedPath = path.startsWith('/') ? path : `/${path}`
    const urlObj = new URL(`${base}${trimmedPath}`)
    urlObj.protocol = protocol
    const url = urlObj.toString()
    // Use the pooled WebSocket under the hood and provide a lightweight
    // wrapper so callers can still interact with a WebSocket-like object.
    let mounted = true

    const doConnect = async () => {
      try {
        const id = await defaultWebSocketPool.connect('generic', url)
        if (!mounted) return
        connIdRef.current = id

        const wrapper = new PooledWebSocket(id, url)
        socketRef.current = wrapper

        // reset retry counter on open
        defaultWebSocketPool.on(id, 'open', (ev: Event) => {
          retryCountRef.current = 0
          opts.onOpen?.(ev)
        })

        defaultWebSocketPool.on(id, 'message', (ev: MessageEvent) => {
          try {
            const parsed = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data
            if (isWsErrorEvent(parsed)) {
              opts.onError?.(new Event(`ws-error:${parsed.error}`))
              defaultWebSocketPool.close(id, 1011, parsed.message)
              return
            }
          } catch { }
          opts.onMessage?.(ev)
        })

        defaultWebSocketPool.on(id, 'error', (ev: Event) => {
          opts.onError?.(ev)
        })

        defaultWebSocketPool.on(id, 'close', (ev: CloseEvent) => {
          opts.onClose?.(ev)
          // if abnormal close, schedule reconnect using existing backoff policy
          if (ev.code === 1000) return
          retryCountRef.current += 1
          const delay = Math.min(30000, 3000 * 2 ** (retryCountRef.current - 1))
          timerRef.current = window.setTimeout(() => connect(), delay)
        })
      } catch (err) {
        // failed to connect via pool -> schedule reconnect
        retryCountRef.current += 1
        const delay = Math.min(30000, 3000 * 2 ** (retryCountRef.current - 1))
        timerRef.current = window.setTimeout(() => connect(), delay)
      }
    }

    doConnect()

    return () => { mounted = false }
  }, [path, opts.onOpen, opts.onMessage, opts.onError, opts.onClose])

  useEffect(() => {
    connect()
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      // Close pooled connection if any
      if (connIdRef.current) {
        try { defaultWebSocketPool.close(connIdRef.current, 1000, 'Component unmount') } catch (_) { }
        connIdRef.current = null
      }
    }
  }, [connect])

  return socketRef.current
}

export const useImapMetricsWebSocket = (opts?: WebSocketOptions) =>
  useWebSocket(API.imapMetricsWS, opts);

export const useSmtpMetricsWebSocket = (opts?: WebSocketOptions) =>
  useWebSocket(API.smtpMetricsWS, opts);

export const useCampaignProgressWebSocket = (
  campaignId: string,
  opts?: WebSocketOptions
) => useWebSocket(`/ws/campaigns/${encodeURIComponent(campaignId)}/progress`, opts)

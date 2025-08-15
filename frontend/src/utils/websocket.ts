import { toast } from '@/hooks/useToast'
import useSessionStore from '@/store/session'
import { defaultWebSocketPool } from '@/utils/ws/connection-pool'

class PooledWebSocket implements WebSocket {
  readonly CONNECTING = 0
  readonly OPEN = 1
  readonly CLOSING = 2
  readonly CLOSED = 3

  readyState: number = this.CONNECTING
  url: string = ''
  protocol: string = ''
  extensions: string = ''
  bufferedAmount: number = 0
  binaryType: BinaryType = 'blob'

  onopen: ((this: WebSocket, ev: Event) => any) | null = null
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null
  onerror: ((this: WebSocket, ev: Event) => any) | null = null

  private _id: string | null = null
  private _connectPromise: Promise<void> | null = null
  private _listeners: Map<string, Set<EventListenerOrEventListenerObject>> = new Map()

  constructor(url: string) {
    this.url = url

    // Kick off async connection but don't block construction
    this._connectPromise = this._connect(url)
  }

  private async _connect(url: string) {
    try {
      const id = await defaultWebSocketPool.connect('generic', url)
      // ensure id is stored as string to match pool API
      this._id = String(id)
      this.readyState = this.OPEN

      // Wire up pool events to local handlers
      defaultWebSocketPool.on(this._id, 'open', () => {
        try {
          this.onopen && this.onopen(new Event('open'))
          this._dispatchEvent('open', new Event('open'))
        } catch (err) {
          console.error('Error in onopen handler:', err)
        }
      })

      defaultWebSocketPool.on(this._id, 'message', (msg: unknown) => {
        try {
          const ev = new MessageEvent('message', { data: msg })
          this.onmessage && this.onmessage(ev)
          this._dispatchEvent('message', ev)
        } catch (err) {
          console.error('Error in onmessage handler:', err)
        }
      })

      defaultWebSocketPool.on(this._id, 'close', (closeInfo: unknown) => {
        try {
          this.readyState = this.CLOSED
          const ev = new CloseEvent('close', closeInfo || {})
          this.onclose && this.onclose(ev)
          this._dispatchEvent('close', ev)
        } catch (err) {
          console.error('Error in onclose handler:', err)
        }
      })

      defaultWebSocketPool.on(this._id, 'error', (err: unknown) => {
        try {
          const ev = new Event('error')
          this.onerror && this.onerror(ev)
          this._dispatchEvent('error', ev)
        } catch (e) {
          console.error('Error in onerror handler:', e)
        }
      })

    } catch (err: unknown) {
      this.readyState = this.CLOSED
      console.error('PooledWebSocket: failed to connect', err)

      // Surface user-facing toast for connection errors similar to prior behavior
      if (err && err.message) {
        toast({
          severity: 'critical',
          title: 'Connection Error',
          description: err.message
        })
      }
    }
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (!this._connectPromise || !this._id) {
      // Ensure we wait for connect to complete
      this._connectPromise?.then(() => {
        if (this._id) {
          defaultWebSocketPool.send(this._id, data)
        }
      }).catch((err) => {
        console.error('Send failed, socket not connected:', err)
      })
      return
    }

    try {
      if (this._id) defaultWebSocketPool.send(this._id, data)
    } catch (err) {
      console.error('PooledWebSocket.send error:', err)
    }
  }

  close(code?: number, reason?: string): void {
    if (this._id) {
      try {
        defaultWebSocketPool.close(this._id, code, reason)
      } catch (err) {
        console.error('Error closing pooled socket:', err)
      }
    }
    this.readyState = this.CLOSED
  }

  addEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void {
    const set = this._listeners.get(type) || new Set()
    set.add(listener as EventListener)
    this._listeners.set(type, set)
  }

  removeEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void {
    const set = this._listeners.get(type)
    if (set) {
      set.delete(listener as EventListener)
      if (set.size === 0) this._listeners.delete(type)
    }
  }

  dispatchEvent(event: Event): boolean {
    this._dispatchEvent(event.type, event)
    return true
  }

  private _dispatchEvent(type: string, event: Event) {
    const set = this._listeners.get(type)
    if (set) {
      for (const fn of Array.from(set)) {
        try {
          (fn as EventListener)(event)
        } catch (err) {
          console.error('Error in event listener:', err)
        }
      }
    }
  }
}

export function createWebSocket(url: string): WebSocket {
  const { activeProxy } = useSessionStore.getState()
  if (!activeProxy || !activeProxy.is_valid) {
    toast({
      severity: 'critical',
      title: 'No valid proxy configured',
      description:
        'Please activate at least one proxy before running the SMTP test.',
    })
    // Return a minimal closed dummy to keep callers safe
    const dummy = new PooledWebSocket(url)
    dummy.readyState = dummy.CLOSED
    return dummy as unknown as WebSocket
  }

  // Return a pooled wrapper that will connect asynchronously
  return new PooledWebSocket(url) as unknown as WebSocket
}

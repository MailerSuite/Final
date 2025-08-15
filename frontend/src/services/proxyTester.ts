import { defaultWebSocketPool } from '@/utils/ws/connection-pool'

export interface ProxyTestData {
  status?: string
  message?: string
  [key: string]: any
}

export type MessageHandler = (data: ProxyTestData) => void

export class ProxyTester {
  private connId: string | null = null
  private reconnectTimer: number | null = null
  private msgHandler: ((ev: unknown) => void) | null = null
  private closeHandler: ((ev: unknown) => void) | null = null

  constructor(private onMessage: MessageHandler) { }

  private async connect() {
    if (this.connId) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const base = (import.meta.env.VITE_API_BASE as string) || '/api/v1'
    const url = `${protocol}//${window.location.host}${base}/ws/proxy-test`

    try {
      const id = await defaultWebSocketPool.connect('proxy-test', url)
      this.connId = id

      this.msgHandler = (ev: unknown) => {
        try {
          this.onMessage(JSON.parse(ev.data))
        } catch {
          this.onMessage({ message: ev.data })
        }
      }

      this.closeHandler = (ev: unknown) => {
        // clear conn id so future connect() will attempt again
        this.connId = null
        // schedule reconnect for abnormal closes
        const code = ev?.code || 0
        if (code !== 1000) this.scheduleReconnect()
      }

      defaultWebSocketPool.on(id, 'message', this.msgHandler)
      defaultWebSocketPool.on(id, 'close', this.closeHandler)
      defaultWebSocketPool.on(id, 'error', () => { })
    } catch (err) {
      console.error('ProxyTester connect failed:', err)
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    this.reconnectTimer = window.setTimeout(async () => {
      this.reconnectTimer = null
      try {
        await this.connect()
      } catch (err) {
        this.scheduleReconnect()
      }
    }, 3000)
  }

  start() {
    this.connect()
  }

  stop() {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.connId) {
      try {
        if (this.msgHandler) defaultWebSocketPool.off(this.connId, 'message', this.msgHandler)
        if (this.closeHandler) defaultWebSocketPool.off(this.connId, 'close', this.closeHandler)
      } catch (_) { }

      try { defaultWebSocketPool.close(this.connId) } catch (_) { }
      this.connId = null
    }
  }
}

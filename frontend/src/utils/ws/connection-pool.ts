import { RateLimiter } from './rate-limiter'
import { ErrorRateLimiter } from './error-rate-limiter'
import { toast } from '@/hooks/useToast'

type Handlers = {
    message: Set<(ev: MessageEvent) => void>
    open: Set<(ev: Event) => void>
    close: Set<(ev: CloseEvent) => void>
    error: Set<(ev: Event) => void>
}

type ConnectionRecord = {
    id: string
    type: string
    ws: WebSocket
    rateLimiter: RateLimiter
    heartbeatTimer: number | null
    handlers: Handlers
}

export class WebSocketPool {
    private connections = new Map<string, ConnectionRecord>()
    private typeCounts = new Map<string, number>()
    private maxPerType: number
    private maxTotal: number
    private heartbeatIntervalMs: number
    private errorLimiter = new ErrorRateLimiter()

    constructor({ maxPerType = 5, maxTotal = 50, heartbeatIntervalMs = 30000 } = {}) {
        this.maxPerType = maxPerType
        this.maxTotal = maxTotal
        this.heartbeatIntervalMs = heartbeatIntervalMs
    }

    private generateId() {
        return `ws_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    }

    getConnectionCount(type?: string) {
        if (!type) return this.connections.size
        return this.typeCounts.get(type) || 0
    }

    async connect(type: string, url: string): Promise<string> {
        // check error/backoff limiter before trying
        if (!this.errorLimiter.canAttempt(type)) {
            const wait = this.errorLimiter.timeLeft(type)
            // show user-facing toast indicating backoff
            try {
                toast({
                    severity: 'warning',
                    title: 'Connection delayed',
                    description: `Connections for '${type}' are temporarily paused. Retrying in ${Math.ceil(wait / 1000)}s.`
                })
            } catch (_) { }
            throw new Error(`Backoff active for type: ${type}. retry in ${wait}ms`)
        }
        // enforce per-type and total limits
        if (this.getConnectionCount(type) >= this.maxPerType) {
            try {
                toast({
                    severity: 'info',
                    title: 'Connection limit reached',
                    description: `Too many active '${type}' connections. Please close other sessions or try again later.`
                })
            } catch (_) { }
            throw new Error(`Connection limit reached for type: ${type}`)
        }
        if (this.connections.size >= this.maxTotal) {
            try {
                toast({
                    severity: 'info',
                    title: 'Connection limit reached',
                    description: 'The application has reached the maximum number of concurrent live connections. Please try again later.'
                })
            } catch (_) { }
            throw new Error('Total connection limit reached')
        }

        const id = this.generateId()
        const ws = new WebSocket(url)

        const handlers: Handlers = {
            message: new Set(),
            open: new Set(),
            close: new Set(),
            error: new Set(),
        }

        const rateLimiter = new RateLimiter(100, 1000, 100)

        const rec: ConnectionRecord = { id, type, ws, rateLimiter, heartbeatTimer: null, handlers }

        const onOpen = (ev: Event) => {
            this.typeCounts.set(type, (this.typeCounts.get(type) || 0) + 1)
            // successful connection - reset any backoff for this type
            try { this.errorLimiter.reset(type) } catch (_) { }
            // start heartbeat
            rec.heartbeatTimer = window.setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    try { ws.send(JSON.stringify({ type: 'ping' })) } catch { }
                }
            }, this.heartbeatIntervalMs)
            handlers.open.forEach(h => h(ev))
        }

        const onMessage = (ev: MessageEvent) => {
            handlers.message.forEach(h => h(ev))
        }

        const onClose = (ev: CloseEvent) => {
            // cleanup
            if (rec.heartbeatTimer) {
                clearInterval(rec.heartbeatTimer)
                rec.heartbeatTimer = null
            }
            this.connections.delete(id)
            this.typeCounts.set(type, Math.max(0, (this.typeCounts.get(type) || 1) - 1))
            // record error/backoff for abnormal closures
            try {
                const code = ev?.code || 0
                if (code !== 1000) {
                    this.errorLimiter.recordError(type)
                }
            } catch (_) { }
            handlers.close.forEach(h => h(ev))
        }

        const onError = (ev: Event) => {
            // record error occurrences
            try { this.errorLimiter.recordError(type) } catch (_) { }
            handlers.error.forEach(h => h(ev))
        }

        ws.addEventListener('open', onOpen)
        ws.addEventListener('message', onMessage)
        ws.addEventListener('close', onClose)
        ws.addEventListener('error', onError)

        this.connections.set(id, rec)
        return id
    }

    send(id: string, data: any): boolean {
        const rec = this.connections.get(id)
        if (!rec) return false
        if (!rec.rateLimiter.tryRemove(1)) return false
        if (rec.ws.readyState !== WebSocket.OPEN) return false
        try {
            rec.ws.send(typeof data === 'string' ? data : JSON.stringify(data))
            return true
        } catch {
            return false
        }
    }

    close(id: string, code?: number, reason?: string) {
        const rec = this.connections.get(id)
        if (!rec) return
        try { rec.ws.close(code || 1000, reason || 'closed by client') } catch { }
        // onClose handler will cleanup
    }

    on(id: string, event: 'message' | 'open' | 'close' | 'error', handler: (ev: any) => void) {
        const rec = this.connections.get(id)
        if (!rec) return
        rec.handlers[event].add(handler as any)
    }

    off(id: string, event: 'message' | 'open' | 'close' | 'error', handler: (ev: any) => void) {
        const rec = this.connections.get(id)
        if (!rec) return
        rec.handlers[event].delete(handler as any)
    }

    dispose() {
        // close all
        this.connections.forEach((rec) => {
            try { rec.ws.close(1000, 'pool disposed') } catch { }
            if (rec.heartbeatTimer) clearInterval(rec.heartbeatTimer)
            rec.rateLimiter.stop()
        })
        this.connections.clear()
        this.typeCounts.clear()
    }
}

// Singleton instance for app-wide usage
export const defaultWebSocketPool = new WebSocketPool()

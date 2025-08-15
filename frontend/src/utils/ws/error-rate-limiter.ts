type ErrorRecord = {
    count: number
    lastErrorAt: number
}

interface Options {
    baseBackoffMs?: number
    maxBackoffMs?: number
    resetAfterMs?: number
}

// Simple per-type exponential backoff error limiter
export class ErrorRateLimiter {
    private records = new Map<string, ErrorRecord>()
    private baseBackoffMs: number
    private maxBackoffMs: number
    private resetAfterMs: number

    constructor({ baseBackoffMs = 1000, maxBackoffMs = 60000, resetAfterMs = 5 * 60 * 1000 }: Options = {}) {
        this.baseBackoffMs = baseBackoffMs
        this.maxBackoffMs = maxBackoffMs
        this.resetAfterMs = resetAfterMs
    }

    private now() {
        return Date.now()
    }

    // Record an error for a given type
    recordError(type: string) {
        const rec = this.records.get(type) || { count: 0, lastErrorAt: 0 }
        // reset if old
        if (this.now() - rec.lastErrorAt > this.resetAfterMs) {
            rec.count = 0
        }
        rec.count += 1
        rec.lastErrorAt = this.now()
        this.records.set(type, rec)
    }

    // Clear error state for type
    reset(type: string) {
        this.records.delete(type)
    }

    // Compute backoff duration for type based on count
    private backoffFor(type: string) {
        const rec = this.records.get(type)
        if (!rec) return 0
        const ms = Math.min(this.baseBackoffMs * Math.pow(2, rec.count - 1), this.maxBackoffMs)
        return ms
    }

    // Whether an attempt can be made now
    canAttempt(type: string) {
        const rec = this.records.get(type)
        if (!rec) return true
        const elapsed = this.now() - rec.lastErrorAt
        return elapsed >= this.backoffFor(type)
    }

    // Get time left for backoff (ms)
    timeLeft(type: string) {
        const rec = this.records.get(type)
        if (!rec) return 0
        const left = this.backoffFor(type) - (this.now() - rec.lastErrorAt)
        return left > 0 ? left : 0
    }
}

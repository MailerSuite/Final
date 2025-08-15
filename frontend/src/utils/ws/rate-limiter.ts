// Simple token-bucket rate limiter
export class RateLimiter {
    private capacity: number
    private tokens: number
    private refillIntervalMs: number
    private refillAmount: number
    private refillTimer: number | null = null

    constructor(capacity = 100, refillIntervalMs = 1000, refillAmount = 100) {
        this.capacity = capacity
        this.tokens = capacity
        this.refillIntervalMs = refillIntervalMs
        this.refillAmount = refillAmount
        this.start()
    }

    start() {
        if (this.refillTimer) return
        this.refillTimer = window.setInterval(() => {
            this.tokens = Math.min(this.capacity, this.tokens + this.refillAmount)
        }, this.refillIntervalMs)
    }

    stop() {
        if (this.refillTimer) {
            clearInterval(this.refillTimer)
            this.refillTimer = null
        }
    }

    tryRemove(count = 1): boolean {
        if (this.tokens >= count) {
            this.tokens -= count
            return true
        }
        return false
    }
}

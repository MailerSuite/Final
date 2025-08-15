import { describe, it, expect } from 'vitest'
import { RateLimiter } from '../rate-limiter'

describe('RateLimiter', () => {
    it('allows tokens up to capacity and then denies', () => {
        const rl = new RateLimiter(3, 1000, 1) // capacity 3
        rl.start()

        expect(rl.tryRemove(1)).toBe(true)
        expect(rl.tryRemove(1)).toBe(true)
        expect(rl.tryRemove(1)).toBe(true)
        // now empty
        expect(rl.tryRemove(1)).toBe(false)

        rl.stop()
    })

    it('refills tokens over time', async () => {
        const rl = new RateLimiter(2, 100, 1)
        rl.start()

        // consume
        expect(rl.tryRemove(1)).toBe(true)
        expect(rl.tryRemove(1)).toBe(true)
        expect(rl.tryRemove(1)).toBe(false)

        // wait for refill (100ms)
        await new Promise(resolve => setTimeout(resolve, 150))

        // after one refill interval at least one token should be available
        expect(rl.tryRemove(1)).toBe(true)
        rl.stop()
    })
})

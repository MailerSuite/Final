import { describe, it, expect } from 'vitest'
import { UnifiedAPIClient } from '@/http/unified-client'

// Smoke test to ensure client constructs and allows base origin URLs

describe('UnifiedAPIClient SSRF allowlist', () => {
  it('allows base origin and relative URLs', async () => {
    const client = new UnifiedAPIClient({
      api: { baseUrl: 'http://localhost:8000', timeout: 1000, retryAttempts: 0 },
      debug: false,
    })
    // @ts-expect-no-error private access in test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyClient: any = client
    expect(anyClient["isValidURL"]('/api/v1/health')).toBe(true)
    expect(anyClient["isValidURL"]('http://localhost:8000/api/v1/health')).toBe(true)
  })
})

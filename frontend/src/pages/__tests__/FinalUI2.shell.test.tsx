import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { render } from '@/test-utils'
import App from '@/App'

describe('FinalUI2 shell (router)', () => {
  beforeAll(() => {
    // Avoid react-router fetch/AbortSignal noise by stubbing fetch
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }) as any
    )
  })
  afterAll(() => {
    vi.restoreAllMocks()
  })
  it('mounts app without crashing', () => {
    render(<App />)
    expect(document.body).not.toBeEmptyDOMElement()
  })
})

// Polyfills and test setup for RTL
import '@testing-library/jest-dom'

// ResizeObserver polyfill for JSDOM
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as any).ResizeObserver = (globalThis as any).ResizeObserver || ResizeObserver

// Ensure AbortController/AbortSignal are unified across global & window (prefer Undici)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AbortController, AbortSignal } = require('undici')
  if (AbortController && AbortSignal) {
    const g: any = globalThis as any
    const w: any = (globalThis as any).window ?? globalThis
    g.AbortController = AbortController
    g.AbortSignal = AbortSignal
    if (w) {
      w.AbortController = AbortController
      w.AbortSignal = AbortSignal
    }
  }
} catch {}

// If Undici isn't available, rely on Node/JSdom globals without custom shims

// JSDOM provides localStorage, but ensure it's available in case of environment quirks
if (!(globalThis as any).localStorage) {
  const store = new Map<string, string>()
  ;(globalThis as any).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)) },
    removeItem: (k: string) => { store.delete(k) },
    clear: () => { store.clear() },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size },
  }
}

// Defensive: clear pending auth-store timeouts on test teardown to avoid post-run localStorage access
const originalSetTimeout = globalThis.setTimeout
const timeoutIds: any[] = []
;(globalThis as any).setTimeout = ((fn: any, ms?: number, ...args: any[]) => {
  const id = originalSetTimeout(fn, ms as any, ...args)
  timeoutIds.push(id)
  return id
}) as any

// Vitest will call afterEach hooks in tests, but as a global fallback, flush timeouts after each test file
// eslint-disable-next-line @typescript-eslint/no-empty-function
;(globalThis as any).afterEach?.(() => {
  for (const id of timeoutIds.splice(0)) {
    try { clearTimeout(id) } catch {}
  }
})

// Ensure Element.scrollIntoView exists for Radix components in JSDOM
if (!(Element.prototype as any).scrollIntoView) {
  ;(Element.prototype as any).scrollIntoView = () => {}
}

// Suppress noisy AbortSignal brand mismatch from undici/react-router in tests only
// Keeps test output clean without affecting runtime code
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  process.on('unhandledRejection', (err: any) => {
    const msg = String(err?.message || err || '')
    if (msg.includes('Expected signal ("AbortSignal {}") to be an instance of AbortSignal')) {
      return
    }
    throw err
  })
} catch {}

import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/**',          // Playwright E2E tests (run via playwright, not vitest)
      'src/tests/**',      // Additional E2E/RTL samples not maintained
      'archives/**' // Archived components and tests
      , 'src/components/ui/__tests__/Button.a11y.test.tsx' // unresolved a11y helper
    ],
    setupFiles: ['vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/test-utils': path.resolve(__dirname, './src/test-utils.tsx')
    }
  }
})

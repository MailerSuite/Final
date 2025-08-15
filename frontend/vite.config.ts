import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'node:url'

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    // Lightweight dev-only mocks to avoid noisy proxy errors when backend is down
    {
      name: 'dev-health-mock',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || ''

          const respondJson = (payload: unknown, status = 200) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(payload))
          }

          // Health endpoints
          if (url === '/health' || url === '/health/' || url === '/api/v1/health' || url === '/api/v1/health/') {
            return respondJson({ status: 'unavailable', message: 'Backend not running (dev mock)' })
          }
          if (url.startsWith('/health/live') || url.startsWith('/api/v1/health/live')) {
            return respondJson({ status: 'unavailable' })
          }
          if (url.startsWith('/health/ready') || url.startsWith('/api/v1/health/ready')) {
            return respondJson({ status: 'unavailable' })
          }

          // Common dashboard calls - provide harmless mock data in dev when API is offline
          if (url.startsWith('/api/v1/admin/system/status')) {
            return respondJson({
              system: { api: 'offline', db: 'unknown', cache: 'unknown' },
              message: 'Dev mock response (backend offline)'
            })
          }
          if (url.startsWith('/api/v1/analytics/summary')) {
            return respondJson({
              campaigns: { total: 0, active: 0 },
              emails: { sent: 0, delivered: 0, bounced: 0 },
              note: 'Dev mock response (backend offline)'
            })
          }

          // Additional dev mocks for common analytics/templates calls
          if (url.startsWith('/api/metrics/analytics') || url.startsWith('/metrics/analytics')) {
            return respondJson({
              period: '24h',
              timestamp: new Date().toISOString(),
              campaigns: { total_sent: 0, successful: 0, failed: 0, success_rate: 0, bounce_rate: 0, open_rate: 0, click_rate: 0 },
              users: { active_sessions: 0, new_registrations: 0, total_users: 0 },
              revenue: { daily: 0, monthly: 0, yearly: 0 },
              top_campaigns: []
            })
          }

          if (url.startsWith('/api/templates') || url.startsWith('/templates')) {
            // List and simple POST/PUT/DELETE stubs
            if (req.method === 'GET') {
              return respondJson([])
            }
            if (req.method === 'POST') {
              return respondJson({ id: 'temp-id', name: 'Dev Template' }, 201)
            }
            if (req.method === 'PUT') {
              return respondJson({ ok: true })
            }
            if (req.method === 'DELETE') {
              return respondJson({ ok: true })
            }
          }

          next()
        })
      },
    },
    react(),
  ],
  optimizeDeps: {
    // Force re-bundling of deps on server restart to avoid stale .vite cache
    force: true,
    include: [
      '@radix-ui/react-progress',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'framer-motion',
    ],
  },
  envPrefix: ['VITE_'],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/**',          // Playwright E2E tests (run via playwright, not vitest)
      'src/tests/**',      // Additional E2E/RTL samples not maintained
      'src/components/ui/__tests__/**' // skip UI a11y tests not wired in this setup
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          'vendor-charts': ['recharts'],
        }
      }
    },
    chunkSizeWarningLimit: 1500,
    sourcemap: mode !== 'production',
    target: 'esnext',
  },
  server: {
    port: 4000,
    host: true,
    // Add headers to avoid any stale caching that can cause MIME issues in dev
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err: Error & { code?: string }, _req: unknown, res: { writeHead?: (code: number) => void; end: (body: string) => void }) => {
            // Gracefully silence ECONNREFUSED noise and return a JSON error
            if (res.writeHead) {
              res.writeHead(503)
            }
            res.end(JSON.stringify({ error: 'Backend unreachable', code: err?.code || 'E_PROXY' }))
          })
        },
      },
      // Proxy health endpoints used by the dashboard to avoid CORS in dev
      '/health': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err: Error, _req: unknown, res: { writeHead?: (code: number, headers: Record<string, string>) => void; end: (data: string) => void }) => {
            if (res.writeHead) {
              res.writeHead(503, { 'Content-Type': 'application/json' })
            }
            res.end(JSON.stringify({ error: 'Backend unreachable', code: (err as NodeJS.ErrnoException)?.code || 'E_PROXY' }))
          })
        },
      },
    },
    strictPort: true,
    cors: true,
    hmr: { overlay: true },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  preview: {
    port: 4173,
    host: true,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
    },
  },
  // Ensure proper handling of TypeScript files
  esbuild: {
    loader: 'tsx',
    include: ['src/**/*.{ts,tsx}'],
  },
  // Force proper MIME types for development
  define: {
    __DEV__: mode === 'development',
  },

}))

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithRouter as render, screen } from '@/test-utils'
import UnifiedFunctionsDashboard from '@/pages/finalui2/pages/UnifiedFunctionsDashboard'

const ok = (data: any) => ({ ok: true, json: async () => data }) as any

describe('UnifiedFunctionsDashboard', () => {
  const realFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/api/v1/health')) return ok({ status: 'healthy' })
      if (url.endsWith('/health/live')) return ok({ status: 'healthy' })
      if (url.endsWith('/health/ready')) return ok({ status: 'healthy' })
      if (url.endsWith('/api/v1/admin/system/status')) return ok({ system: { cpu_percent: 12, memory_percent: 34, disk_percent: 56, uptime: '1d 2h' } })
      if (url.endsWith('/api/v1/analytics/summary')) return ok({ campaigns_active: 3, emails_sent_24h: 1234, smtp_accounts: 10, imap_accounts: 5 })
      return ok({})
    }) as any
  })

  afterEach(() => {
    globalThis.fetch = realFetch as any
  })

  it('renders Platform Overview and key cards', async () => {
    render(<UnifiedFunctionsDashboard />)
    expect(await screen.findByText(/Platform Overview/i)).toBeInTheDocument()
    expect(await screen.findByText(/System Health/i)).toBeInTheDocument()
    expect(await screen.findByText(/CPU Load/i)).toBeInTheDocument()
    expect(await screen.findByText(/Active Campaigns/i)).toBeInTheDocument()
  }, 15000)
})

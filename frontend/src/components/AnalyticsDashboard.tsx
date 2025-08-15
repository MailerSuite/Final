import React, { useMemo, useState } from 'react'
import { BarChart3, Home, Layers, Settings } from 'lucide-react'

type RangeKey = 'today' | 'week' | 'month'

interface Stat {
  id: string
  label: string
  value: number
  percent: number
  accent?: string
}

const CYAN = '#00C4FF'
const BASE_DARK = '#121212'
const TEXT_PRIMARY = '#FFFFFF'
const TEXT_SECONDARY = '#A0A0A0'

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

import { Progress } from '@/components/ui/progress'
function ProgressBar({ percent, testId }: { percent: number; testId?: string }) {
  const width = Math.max(0, Math.min(100, percent))
  return (
    <Progress value={width} data-testid={testId ? `${testId}-track` : undefined} />
  )
}

function SidebarItem({ icon: Icon, label, active }: { icon: React.ComponentType<unknown>; label: string; active?: boolean }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-md cursor-pointer select-none"
      style={{
        color: active ? CYAN : TEXT_PRIMARY,
        backgroundColor: active ? '#1a1a1a' : 'transparent',
      }}
      aria-current={active ? 'page' : undefined}
      data-testid={`sidebar-item-${label.toLowerCase()}`}
      data-active={active ? 'true' : 'false'}
    >
      <Icon
        size={18}
        strokeWidth={2}
        style={{ color: TEXT_PRIMARY, fill: active ? CYAN : 'transparent' }}
      />
      <span className="text-[14px] font-medium">{label}</span>
    </div>
  )
}

export default function AnalyticsDashboard() {
  const [range, setRange] = useState<RangeKey>('today')

  const stats: Stat[] = useMemo(() => {
    const base: Record<RangeKey, Stat[]> = {
      today: [
        { id: 'delivered', label: 'Delivered', value: 98214, percent: 88, accent: CYAN },
        { id: 'opened', label: 'Opened', value: 61234, percent: 55 },
        { id: 'clicked', label: 'Clicked', value: 15432, percent: 22 },
      ],
      week: [
        { id: 'delivered', label: 'Delivered', value: 102334, percent: 90, accent: CYAN },
        { id: 'opened', label: 'Opened', value: 70112, percent: 61 },
        { id: 'clicked', label: 'Clicked', value: 18420, percent: 24 },
      ],
      month: [
        { id: 'delivered', label: 'Delivered', value: 412334, percent: 92, accent: CYAN },
        { id: 'opened', label: 'Opened', value: 280110, percent: 63 },
        { id: 'clicked', label: 'Clicked', value: 80110, percent: 27 },
      ],
    }
    return base[range]
  }, [range])

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: BASE_DARK }}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="flex-shrink-0" style={{ width: 240, backgroundColor: BASE_DARK }}>
          <div className="px-3 py-4">
            <div className="mb-4 px-2">
              <div className="text-[14px] font-semibold" style={{ color: TEXT_PRIMARY }}>SGPT</div>
              <div className="text-[12px]" style={{ color: TEXT_SECONDARY }}>Marketing Suite</div>
            </div>

            <nav className="space-y-1">
              <SidebarItem icon={Home} label="Home" />
              <SidebarItem icon={BarChart3} label="Analytics" active />
              <SidebarItem icon={Layers} label="Campaigns" />
              <SidebarItem icon={Settings} label="Settings" />
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[14px] font-semibold" style={{ color: TEXT_PRIMARY }}>Analytics Overview</h1>
              <p className="text-[12px]" style={{ color: TEXT_SECONDARY }}>Real-time delivery performance</p>
            </div>

            <div className="inline-flex items-center gap-2 bg-[#1a1a1a] rounded-md p-1" role="tablist">
              {(['today', 'week', 'month'] as RangeKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setRange(k)}
                  className="px-3 py-1.5 rounded"
                  style={{
                    color: range === k ? BASE_DARK : TEXT_PRIMARY,
                    backgroundColor: range === k ? CYAN : 'transparent',
                    fontWeight: range === k ? 700 : 500,
                    fontSize: 12,
                  }}
                  data-testid={`range-toggle-${k}`}
                  role="tab"
                  aria-selected={range === k}
                >
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((s) => (
              <section
                key={s.id}
                className="rounded-lg p-4"
                style={{ backgroundColor: '#171717', border: '1px solid #1f1f1f' }}
              >
                <div className="text-center">
                  <div className="text-[12px]" style={{ color: TEXT_SECONDARY }}>{s.label}</div>
                  <div
                    className="leading-tight"
                    style={{ color: TEXT_PRIMARY, fontWeight: 800, fontSize: 14 }}
                  >
                    <span data-testid={`metric-${s.id}-value`}>{formatNumber(s.value)}</span> {s.label}
                  </div>
                </div>

                <div className="mt-3">
                  <ProgressBar percent={s.percent} accent={s.accent} testId={`progress-${s.id}`} />
                  <div className="mt-1 text-right text-[12px]" style={{ color: TEXT_SECONDARY }}>
                    {s.percent}%
                  </div>
                </div>
              </section>
            ))}
          </div>

          {/* Insights */}
          <section className="mt-8 rounded-lg p-4" style={{ backgroundColor: '#171717', border: '1px solid #1f1f1f' }}>
            <h2 className="text-[14px] font-semibold mb-2" style={{ color: TEXT_PRIMARY }}>Insights</h2>
            <ul className="space-y-2 text-[12px]" style={{ color: TEXT_SECONDARY }}>
              <li>• Delivery rates remain strong with minimal variance.</li>
              <li>• Engagement is stable; consider testing new subject lines.</li>
              <li>• Click-through trending upward for the selected range.</li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  )
}

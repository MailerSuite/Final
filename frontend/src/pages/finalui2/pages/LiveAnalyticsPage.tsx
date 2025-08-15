import React from 'react'
import LiveAnalytics from '@/pages/client/analytics/live-analytics-dashboard'
import PageShell from '../components/PageShell'

export default function LiveAnalyticsPage() {
  return (
    <PageShell
      title="Live Analytics"
      subtitle="Real-time engagement and delivery metrics"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Analytics' }, { label: 'Live' }]}
      compact
    >
      <LiveAnalytics />
    </PageShell>
  )
}

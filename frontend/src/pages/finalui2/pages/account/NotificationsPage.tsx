import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import PageShell from '../../components/PageShell'

export default function NotificationsPage() {
  return (
    <PageShell
      title="Notifications"
      subtitle="Control how you receive alerts and updates"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Account' }, { label: 'Notifications' }]}
      compact
    >
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Coming soon</div>
        </CardContent>
      </Card>
    </PageShell>
  )
}

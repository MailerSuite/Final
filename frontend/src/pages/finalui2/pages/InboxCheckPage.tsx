import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import * as CompactDataTable from "../components/CompactDataTable"
import PageShell from '../components/PageShell'
type CompactEntry = CompactDataTable.CompactEntry

export default function InboxCheckPage() {
  const sample: CompactEntry[] = [
    { id: 'i1', country: 'US', host: 'gmail.com', email: 'test@gmail.com', user: 'inboxbot', pass: '***', port: 993, ssl: 'SSL', type: 'INBOX', responseMs: 210, aiPrediction: 'Primary' },
    { id: 'i2', country: 'US', host: 'outlook.com', email: 'test@outlook.com', user: 'inboxbot', pass: '***', port: 993, ssl: 'SSL', type: 'INBOX', responseMs: 260, aiPrediction: 'Focused' },
  ]
  return (
    <PageShell
      title="Inbox Placement"
      subtitle="Deliverability diagnostics to land in the Primary inbox"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Tools' }, { label: 'Inbox Check' }]}
      compact
    >
      <Card>
        <CardHeader>
          <CardTitle className="">Smart Inbox Placement</CardTitle>
          <CardDescription>Deliverability diagnostics to land in the Primary inbox</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p className="mb-3">Run inbox placement checks, see folder destinations, and get AI guidance to improve deliverability.</p>
          <div className="flex gap-2">
            <Button size="sm">Run Inbox Check</Button>
            <Button size="sm" variant="outline">View History</Button>
          </div>
        </CardContent>
      </Card>
      <CompactDataTable title="Recent Inbox Checks" entries={sample} caption="Folder outcomes and latency by provider" />
    </PageShell>
  )
}

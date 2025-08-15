import React from 'react'
import PageShell from '../../components/PageShell'
import useSWR from 'swr'
import axios from '@/http/axios'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const fetcher = (url: string) => axios.get(url).then(r => r.data)

export default function SessionsPage() {
  const { data, mutate, isLoading } = useSWR('/api/v1/sessions/active', fetcher)

  const terminateAll = async () => {
    try {
      await axios.post('/api/v1/sessions/terminate-all')
      toast.success('All sessions terminated')
      mutate()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? 'Failed to terminate sessions')
    }
  }

  const terminateOne = async (id: string) => {
    try {
      await axios.post(`/api/v1/sessions/${id}/terminate`)
      toast.success('Session terminated')
      mutate()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? 'Failed to terminate session')
    }
  }

  const sessions = Array.isArray(data) ? data : []

  return (
    <PageShell
      title="Sessions"
      subtitle="Manage and terminate logged-in devices"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Account' }, { label: 'Sessions' }]}
      compact
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Sessions</CardTitle>
            <Button variant="destructive" onClick={terminateAll} disabled={isLoading}>Terminate all</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions.length === 0 && <div className="text-sm text-muted-foreground">No active sessions</div>}
            {sessions.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <div className="font-medium">{s.name || 'Session'}</div>
                  <div className="text-xs text-muted-foreground">{s.id}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => terminateOne(s.id)}>Terminate</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}

import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { createWebSocket } from '@/utils/websocket'
import { getSessionId } from '@/utils/getSessionId'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  getCampaign,
  startCampaign,
  pauseCampaign,
  stopCampaign,
  deleteCampaign,
  getCampaignThrottle,
  setCampaignThrottle,
  addCampaignRecipients,
  exportCampaignEmails,
} from '@/api/campaigns'
import { listThreadPools } from '@/api/threads'
import { listLeadBases } from '@/api/leadBases'

const Field: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div>
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className="text-sm">{value ?? '—'}</div>
  </div>
)

const CampaignDetails: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const sid = getSessionId()
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [campaign, setCampaign] = React.useState<unknown>(null)
  const [batchSize, setBatchSize] = React.useState<number>(100)
  const [delayMs, setDelayMs] = React.useState<number>(1000)
  const [threads, setThreads] = React.useState<number>(1)
  const [recipientInput, setRecipientInput] = React.useState<string>('')
  const [threadPools, setThreadPools] = React.useState<unknown[]>([])
  const [selectedThreadPool, setSelectedThreadPool] = React.useState<string>('')
  const [leadBases, setLeadBases] = React.useState<unknown[]>([])
  const [leadBasePick, setLeadBasePick] = React.useState<string>('')
  const [selectedLeadBaseIds, setSelectedLeadBaseIds] = React.useState<string[]>([])
  const [logs, setLogs] = React.useState<string[]>([])
  const [streaming, setStreaming] = React.useState<boolean>(true)
  const wsRef = React.useRef<WebSocket | null>(null)

  const refresh = React.useCallback(async () => {
    if (!sid || !id) return
    try {
      setLoading(true)
      const c = await getCampaign(sid, id)
      const data: unknown = (c as any)?.data ?? c
      setCampaign(data)
      try {
        const thr = await getCampaignThrottle(id)
        const t = (thr as any)?.data ?? thr
        if (t) {
          if (t.batch_size != null) setBatchSize(Number(t.batch_size))
          if (t.delay_between_batches != null) setDelayMs(Number(t.delay_between_batches))
          if (t.threads_count != null) setThreads(Number(t.threads_count))
        }
      } catch { /* optional */ }
    } catch (e: unknown) {
      toast.error?.(e?.message || 'Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }, [sid, id])

  React.useEffect(() => { void refresh() }, [refresh])
  React.useEffect(() => {
    (async () => {
      try {
        const res = await listThreadPools()
        const items: unknown[] = (res as any)?.data ?? (res as any)
        setThreadPools(Array.isArray(items) ? items : [])
      } catch { /* optional */ }
      try {
        const l = await listLeadBases()
        const rows: unknown[] = (l as any)?.data ?? (l as any)
        setLeadBases(Array.isArray(rows) ? rows : [])
      } catch { /* optional */ }
    })()
  }, [])

  // Live logs WebSocket
  React.useEffect(() => {
    if (!id || !streaming) return
    const wsPath = `/api/v1/ws/campaigns/${id}/progress`
    const loc = window.location
    const scheme = loc.protocol === 'https:' ? 'wss' : 'ws'
    const url = `${scheme}://${loc.host}${wsPath}`
    const ws = createWebSocket(url)
    wsRef.current = ws
    ws.onmessage = (evt) => {
      const line = typeof evt.data === 'string' ? evt.data : ''
      setLogs(prev => (prev.length > 300 ? prev.slice(-300) : prev).concat(line))
    }
    ws.onerror = () => { /* ignore */ }
    ws.onclose = () => { wsRef.current = null }
    return () => { try { ws.close() } catch { /* ignore */ } }
  }, [id, streaming])

  const runAction = async (action: 'start' | 'pause' | 'stop' | 'delete') => {
    if (!sid || !id) return
    try {
      switch (action) {
        case 'start': await startCampaign(sid, id); toast.success?.('Started'); break
        case 'pause': await pauseCampaign(sid, id); toast.success?.('Paused'); break
        case 'stop': await stopCampaign(sid, id); toast.success?.('Stopped'); break
        case 'delete':
          if (!window.confirm('Delete this campaign?')) return
          await deleteCampaign(sid, id); toast.success?.('Deleted'); navigate('/campaigns'); return
      }
      void refresh()
    } catch (e: unknown) {
      toast.error?.(e?.message || 'Action failed')
    }
  }

  const saveThrottle = async () => {
    if (!id) return
    try {
      setSaving(true)
      await setCampaignThrottle(id, { batch_size: batchSize, delay_between_batches: delayMs, threads_count: threads })
      // Assign thread pool if selected
      if (selectedThreadPool) {
        try {
          const { assignCampaignThreadPool } = await import('@/api/campaigns')
          await assignCampaignThreadPool(id, selectedThreadPool)
        } catch { /* optional */ }
      }
      toast.success?.('Throttle updated')
    } catch (e: unknown) {
      toast.error?.(e?.message || 'Failed to update throttle')
    } finally { setSaving(false) }
  }

  const addRecipients = async () => {
    if (!id) return
    const lines = recipientInput.split(/\s|,|;|\n/).map(s => s.trim()).filter(Boolean)
    if (lines.length === 0) { toast.error?.('Enter at least one email'); return }
    try {
      await addCampaignRecipients(id, { recipients: lines })
      toast.success?.('Recipients queued')
      setRecipientInput('')
    } catch (e: unknown) {
      toast.error?.(e?.message || 'Failed to add recipients')
    }
  }

  const onExport = async () => {
    if (!id) return
    try {
      await exportCampaignEmails(id, 'csv')
      toast.success?.('Export requested')
    } catch (e: unknown) {
      toast.error?.(e?.message || 'Export failed')
    }
  }

  return (
    <PageShell title="Campaign Details" subtitle={id ? `ID: ${id}` : ''} breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Campaigns', href: '/campaigns' }, { label: 'Details' }]}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Overview</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => runAction('start')} disabled={loading}>Start</Button>
                <Button size="sm" variant="outline" onClick={() => runAction('pause')} disabled={loading}>Pause</Button>
                <Button size="sm" variant="outline" onClick={() => runAction('stop')} disabled={loading}>Stop</Button>
                <Button size="sm" variant="destructive" onClick={() => runAction('delete')} disabled={loading}>Delete</Button>
              </div>
            </CardHeader>
            <CardContent>
              {campaign ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Name" value={campaign.name || campaign.campaign_name} />
                  <Field label="Status" value={<Badge variant="outline">{campaign.status || 'draft'}</Badge>} />
                  <Field label="Type" value={campaign.type || 'regular'} />
                  <Field label="Subject" value={campaign.subject} />
                  <Field label="Recipients" value={campaign.total_recipients ?? '—'} />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{loading ? 'Loading…' : 'Not found'}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Live Logs</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant={streaming ? 'outline' : 'primary'} onClick={() => setStreaming(!streaming)}>
                  {streaming ? 'Pause' : 'Resume'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 overflow-auto rounded border p-2 bg-background">
                {logs.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No logs yet.</div>
                ) : (
                  <pre className="text-xs whitespace-pre-wrap">{logs.join('\n')}</pre>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recipients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="email1@example.com, email2@example.com" value={recipientInput} onChange={(e) => setRecipientInput(e.target.value)} />
                  <Button onClick={addRecipients}>Add Emails</Button>
                  <Button variant="outline" onClick={onExport}>Export Emails</Button>
                </div>
                <div className="text-xs text-muted-foreground">Paste emails separated by spaces, commas, or new lines.</div>

                <Separator />

                <div className="flex items-center gap-2">
                  <Select value={leadBasePick} onValueChange={setLeadBasePick}>
                    <SelectTrigger className="w-72">
                      <SelectValue placeholder="Select lead base" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadBases.map((b: unknown) => (
                        <SelectItem key={b.id} value={b.id}>{b.name} ({b.leads_count ?? 0})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => {
                    if (!leadBasePick) return
                    setSelectedLeadBaseIds(prev => prev.includes(leadBasePick) ? prev : prev.concat(leadBasePick))
                    setLeadBasePick('')
                  }}>Add Base</Button>
                  <Button onClick={async () => {
                    if (!id || selectedLeadBaseIds.length === 0) return
                    try {
                      await addCampaignRecipients(id, { lead_base_ids: selectedLeadBaseIds })
                      toast.success?.('Lead bases attached')
                      setSelectedLeadBaseIds([])
                    } catch (e: unknown) { toast.error?.(e?.message || 'Failed to attach') }
                  }}>Attach Selected</Button>
                </div>
                {selectedLeadBaseIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedLeadBaseIds.map(idv => (
                      <Badge key={idv} variant="secondary" className="cursor-pointer" onClick={() => setSelectedLeadBaseIds(prev => prev.filter(x => x !== idv))}>
                        {idv} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Throttle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Batch size</Label>
                  <Input type="number" value={batchSize} onChange={(e) => setBatchSize(parseInt(e.target.value || '0'))} />
                </div>
                <div>
                  <Label>Delay between batches (ms)</Label>
                  <Input type="number" value={delayMs} onChange={(e) => setDelayMs(parseInt(e.target.value || '0'))} />
                </div>
                <div>
                  <Label>Threads</Label>
                  <Input type="number" value={threads} onChange={(e) => setThreads(parseInt(e.target.value || '1'))} />
                </div>
                <div>
                  <Label>Thread Pool</Label>
                  <Select value={selectedThreadPool} onValueChange={setSelectedThreadPool}>
                    <SelectTrigger><SelectValue placeholder="Select pool" /></SelectTrigger>
                    <SelectContent>
                      {threadPools.map((p: unknown) => (
                        <SelectItem key={p.id} value={p.id}>{p.name || p.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => void refresh()} disabled={saving || loading}>Reset</Button>
                <Button onClick={saveThrottle} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" variant="outline" onClick={() => navigate('/campaigns')}>Back to list</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}

export default CampaignDetails

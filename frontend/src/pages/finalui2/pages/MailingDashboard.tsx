import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  CpuChipIcon,
  ServerStackIcon,
  BoltIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import PageShell from '../components/PageShell'
import PageConsole from '@/components/ui/PageConsole'
import { listThreadPools, createThreadPool, deleteThreadPool, updateThreadPool } from '@/api/threads'

type ThreadPool = {
  id: string
  name?: string
  max_threads?: number
  timeout_ms?: number
  retry_backoff_ms?: number
  enabled?: boolean
}

const defaultNewPool: Required<Pick<ThreadPool, 'name' | 'max_threads' | 'timeout_ms' | 'retry_backoff_ms' | 'enabled'>> = {
  name: 'Default Pool',
  max_threads: 8,
  timeout_ms: 30000,
  retry_backoff_ms: 2000,
  enabled: true,
}

const formatMs = (ms?: number) => (typeof ms === 'number' ? `${Math.round(ms)} ms` : '-')

const MailingDashboard: React.FC = () => {
  const [pools, setPools] = useState<ThreadPool[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newPool, setNewPool] = useState(defaultNewPool)
  const [editing, setEditing] = useState<ThreadPool | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return pools
    return pools.filter((p) => !!p.enabled === (filter === 'enabled'))
  }, [pools, filter])

  const refresh = async () => {
    setLoading(true)
    try {
      const data = await listThreadPools().catch(() => [])
      setPools(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      await createThreadPool({
        name: newPool.name,
        max_threads: newPool.max_threads,
        timeout_ms: newPool.timeout_ms,
        retry_backoff_ms: newPool.retry_backoff_ms,
        enabled: newPool.enabled,
      } as any)
      setShowCreate(false)
      setNewPool(defaultNewPool)
      refresh()
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteThreadPool(id).catch(() => {})
    refresh()
  }

  const handleSaveEdit = async () => {
    if (!editing?.id) return
    setSavingEdit(true)
    try {
      await updateThreadPool(editing.id, {
        name: editing.name,
        max_threads: editing.max_threads,
        timeout_ms: editing.timeout_ms,
        retry_backoff_ms: editing.retry_backoff_ms,
        enabled: editing.enabled,
      } as any)
      setEditing(null)
      refresh()
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <TooltipProvider>
      <PageShell
        title="Mailing Dashboard"
        titleIcon={
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/30">
            <ServerStackIcon className="w-4 h-4 text-primary neon-glow" />
          </span>
        }
        subtitle="Configure threads, timeouts, and runtime behavior"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Mailing' }]}
        toolbar={
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v: unknown) => setFilter(v)}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pools</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <ActionButton kind="add" onClick={() => setShowCreate(true)}>New Pool</ActionButton>
          </div>
        }
      >
        <motion.div className="grid grid-cols-12 gap-4">
          {/* Top Monitor Console */}
          <div className="col-span-12">
            <PageConsole
              title="Mailing Runtime"
              source="mailing"
              height="md"
              logCategories={["SEND", "RETRY", "ERROR", "QUEUE"]}
              showSearch
              showControls
              autoConnect
              className="mb-2"
            />
          </div>
          <div className="col-span-8 space-y-4">
            <Card className="bg-background/70 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ServerStackIcon className="w-5 h-5 text-blue-400" /> Thread Pools
                </CardTitle>
                <CardDescription>Manage concurrency and timeouts for campaign sending</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs text-blue-300/80">Name</TableHead>
                        <TableHead className="text-xs text-blue-300/80">Threads</TableHead>
                        <TableHead className="text-xs text-blue-300/80">Timeout</TableHead>
                        <TableHead className="text-xs text-blue-300/80">Backoff</TableHead>
                        <TableHead className="text-xs text-blue-300/80">Status</TableHead>
                        <TableHead className="text-right text-xs text-blue-300/80">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((p) => (
                        <TableRow key={p.id} className="hover:bg-white/5">
                          <TableCell className="text-sm text-white">{p.name || p.id}</TableCell>
                          <TableCell className="text-sm text-blue-300/80">{p.max_threads ?? '-'}</TableCell>
                          <TableCell className="text-sm text-blue-300/80">{formatMs(p.timeout_ms)}</TableCell>
                          <TableCell className="text-sm text-blue-300/80">{formatMs(p.retry_backoff_ms)}</TableCell>
                          <TableCell>
                            {p.enabled ? (
                              <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/30">Enabled</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">Disabled</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <ActionButton kind="edit" variant="outline" size="icon" onClick={() => setEditing(p)} />
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <ActionButton kind="delete" variant="outline" size="icon" onClick={() => handleDelete(p.id)} />
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No pools found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/70 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CpuChipIcon className="w-5 h-5 text-blue-400" /> Runtime Controls
                </CardTitle>
                <CardDescription>Live tuning of concurrency and throttling</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-xs text-muted-foreground">Global Max Threads</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Slider defaultValue={[16]} min={1} max={128} step={1} className="flex-1" />
                      <Badge variant="outline" className="text-[10px]">16</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Per-Host Timeout (ms)</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Slider defaultValue={[30000]} min={1000} max={120000} step={500} className="flex-1" />
                      <Badge variant="outline" className="text-[10px]">30,000</Badge>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/10">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BoltIcon className="w-4 h-4 text-blue-400" /> Adaptive throttling
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-4 space-y-4">
            <PageConsole
              title="Mailing Runtime"
              source="mailing"
              height="lg"
              logCategories={["SEND", "RETRY", "ERROR", "QUEUE"]}
              showSearch
              showControls
              autoConnect
            />
          </div>
        </motion.div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Thread Pool</DialogTitle>
              <DialogDescription>Define concurrency and timeouts for this pool</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Name</Label>
                <Input value={newPool.name} onChange={(e) => setNewPool({ ...newPool, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Max Threads</Label>
                <Input type="number" min={1} value={newPool.max_threads}
                  onChange={(e) => setNewPool({ ...newPool, max_threads: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Timeout (ms)</Label>
                <Input type="number" min={1000} step={500} value={newPool.timeout_ms}
                  onChange={(e) => setNewPool({ ...newPool, timeout_ms: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Retry Backoff (ms)</Label>
                <Input type="number" min={0} step={100} value={newPool.retry_backoff_ms}
                  onChange={(e) => setNewPool({ ...newPool, retry_backoff_ms: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newPool.enabled} onCheckedChange={(v) => setNewPool({ ...newPool, enabled: v })} />
                <span className="text-sm">Enabled</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Thread Pool</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Name</Label>
                  <Input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Max Threads</Label>
                  <Input type="number" min={1} value={editing.max_threads ?? 1}
                    onChange={(e) => setEditing({ ...editing, max_threads: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Timeout (ms)</Label>
                  <Input type="number" min={1000} step={500} value={editing.timeout_ms ?? 0}
                    onChange={(e) => setEditing({ ...editing, timeout_ms: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Retry Backoff (ms)</Label>
                  <Input type="number" min={0} step={100} value={editing.retry_backoff_ms ?? 0}
                    onChange={(e) => setEditing({ ...editing, retry_backoff_ms: Number(e.target.value) })} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={!!editing.enabled} onCheckedChange={(v) => setEditing({ ...editing, enabled: v })} />
                  <span className="text-sm">Enabled</span>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={savingEdit}>{savingEdit ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageShell>
    </TooltipProvider>
  )
}

export default MailingDashboard

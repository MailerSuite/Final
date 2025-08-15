import React from 'react';
import { getSessionId } from '@/utils/getSessionId';
import { listImap, deleteImap, testImapAccount, bulkUploadImap, createImap, updateImap } from '@/api/imap';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageShell from '../components/PageShell';
import { Separator } from '@/components/ui/separator'
import MailLoader from '@/components/ui/MailLoader'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/hooks/useToast'
import { useNavigate } from 'react-router-dom'

export default function IMAPListPage() {
  const navigate = useNavigate()
  const sessionId = getSessionId() || ''
  const [items, setItems] = React.useState<unknown[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [quickEmail, setQuickEmail] = React.useState('')
  const [quickPass, setQuickPass] = React.useState('')
  const [bulkData, setBulkData] = React.useState('')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<any | null>(null)
  const [form, setForm] = React.useState({
    email: '',
    password: '',
    server: '',
    port: 993 as number | string,
    ssl: 'ssl' as 'ssl' | 'starttls' | 'none',
    use_oauth: false,
  })

  const refresh = async () => {
    try {
      setLoading(true)
      const data = await listImap(sessionId)
      setItems(data || [])
      setError(null)
    } catch (e: unknown) {
      setError(e?.message || 'Failed to load IMAP accounts')
      toast.error?.(e?.message || 'Failed to load IMAP accounts')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    refresh()
  }, [])

  return (
    <PageShell
      title="IMAP Accounts"
      subtitle="Manage inbound inboxes and monitor retrieval"
      actions={<div className="flex items-center gap-2"><Button variant="outline" onClick={() => setModalOpen(true)}>Add Account</Button><Button onClick={() => navigate('/imap/checker?tab=host-config')}>Open Checker</Button></div>}
      toolbar={<div className="flex items-center gap-2"><Button variant="outline"><ArrowDownTrayIcon className="w-4 h-4 mr-2 rotate-180" />Import</Button><Button variant="outline"><ArrowDownTrayIcon className="w-4 h-4 mr-2" />Export</Button></div>}
    >
      <Card className="p-4">
        <Dialog open={modalOpen} onOpenChange={(v) => { setModalOpen(v); if (!v) { setEditing(null); setForm({ email: '', password: '', server: '', port: 993, ssl: 'ssl', use_oauth: false }) } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit IMAP Account' : 'Add IMAP Account'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
              </div>
              <div>
                <Label>Server</Label>
                <Input value={form.server} onChange={(e) => setForm({ ...form, server: e.target.value })} placeholder="imap.example.com" />
              </div>
              <div>
                <Label>Port</Label>
                <Input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} placeholder="993" />
              </div>
              <div>
                <Label>Security</Label>
                <Select value={form.ssl} onValueChange={(v) => setForm({ ...form, ssl: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ssl">SSL/TLS</SelectItem>
                    <SelectItem value="starttls">STARTTLS</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                try {
                  if (!form.email || !form.server) return
                  if (editing) {
                    await updateImap(sessionId, editing.id, { email: form.email, password: form.password || undefined as any, imap_server: form.server, imap_port: Number(form.port) || 993, use_oauth: false })
                  } else {
                    await createImap(sessionId, { email: form.email, password: form.password, imap_server: form.server, imap_port: Number(form.port) || 993, use_oauth: false })
                  }
                  setModalOpen(false)
                  await refresh()
                } catch (e: unknown) {
                  toast.error?.(e?.message || 'Save failed')
                }
              }}>{editing ? 'Save' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>
        {loading && (
          <div className="py-8 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-full" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {/* Quick Add */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
          <Input placeholder="email@example.com" value={quickEmail} onChange={(e) => setQuickEmail(e.target.value)} />
          <Input placeholder="password" type="password" value={quickPass} onChange={(e) => setQuickPass(e.target.value)} />
          <div className="col-span-1 md:col-span-2 flex gap-2">
            <Button onClick={async () => {
              if (!quickEmail || !quickPass) return;
              await bulkUploadImap(sessionId, `${quickEmail}:${quickPass}`)
              setQuickEmail(''); setQuickPass('');
              refresh()
            }}>Add</Button>
          </div>
        </div>
        {/* Bulk Upload */}
        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-1">Bulk upload (email:password per line)</div>
          <div className="flex gap-2">
            <Input placeholder="user1:pass1\nuser2:pass2" value={bulkData} onChange={(e) => setBulkData(e.target.value)} />
            <Button variant="outline" onClick={async () => {
              if (!bulkData.trim()) return;
              await bulkUploadImap(sessionId, bulkData.trim())
              setBulkData('')
              refresh()
            }}>Bulk Upload</Button>
          </div>
        </div>
        {!loading && !error && (
          <div className="overflow-x-auto">
            <Table className="min-w-[48rem] text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Server</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No IMAP accounts found.</TableCell>
                  </TableRow>
                ) : items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">{it.email}</TableCell>
                    <TableCell className="text-muted-foreground">{it.server}:{it.port}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="mr-2" onClick={() => { setEditing(it); setForm({ email: it.email, password: '', server: it.server || it.imap_server, port: it.port || it.imap_port || 993, ssl: 'ssl', use_oauth: false }); setModalOpen(true) }}>Edit</Button>
                      <Button size="sm" variant="outline" className="mr-2" onClick={async () => { try { await testImapAccount(it.id); toast.success?.('IMAP test triggered') } catch (e: unknown) { toast.error?.(e?.message || 'Test failed') } }}>Test</Button>
                      <Button size="sm" variant="destructive" onClick={async () => { await deleteImap(sessionId, it.id); refresh() }}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </PageShell>
  )
}


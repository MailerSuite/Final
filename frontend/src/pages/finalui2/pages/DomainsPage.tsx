import React from 'react'
import { motion } from 'framer-motion'
import PageShell from '../components/PageShell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
// Removed direct Button usage in favor of ActionButton
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { GlobeAltIcon, ShieldCheckIcon, FingerPrintIcon, ArrowDownTrayIcon, PlusIcon, ArrowPathIcon, TrashIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'
import { Skeleton } from '@/components/ui/skeleton'
import * as CompactDataTable from "../components/CompactDataTable"
type CompactEntry = CompactDataTable.CompactEntry
import { domainApi } from '@/http/api'
import { getSessionId } from '@/utils/getSessionId'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function DomainsPage() {
  const [initialLoading, setInitialLoading] = React.useState(true)
  const [rows, setRows] = React.useState<unknown[]>([])
  const [modalOpen, setModalOpen] = React.useState(false)
  const [form, setForm] = React.useState({ url: '', domain_type: 'website' as 'website' | 'api' | 'other' })
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [uploadFile, setUploadFile] = React.useState<File | null>(null)
  const [verificationOpen, setVerificationOpen] = React.useState(false)
  const [selectedDomain, setSelectedDomain] = React.useState<unknown>(null)
  const [importMapping, setImportMapping] = React.useState({ domain: 0, type: 1 })
  const sid = Number(getSessionId() || 0)

  const load = async () => {
    try {
      setInitialLoading(true)
      const { data } = await domainApi.list(sid)
      setRows(Array.isArray(data) ? data : (data?.items || []))
    } catch (e: unknown) {
      toast.error?.(e?.message || 'Failed to load domains')
    } finally { setInitialLoading(false) }
  }

  React.useEffect(() => { void load() }, [])
  return (
    <PageShell
      title="Domain Reputation & Auth"
      titleIcon={<GlobeAltIcon className="w-4 h-4 text-primary" />}
      subtitle="SPF • DKIM • DMARC checks with proactive recommendations"
      toolbar={<div className="flex items-center gap-2"><Button variant="outline"><ArrowDownTrayIcon className="w-4 h-4 mr-2" />Export</Button></div>}
    >
      <motion.div
        className="relative z-10 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
      >
        <Card className="bg-background/60 border-border backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2"><GlobeAltIcon className="w-5 h-5 text-primary" /> Overview</CardTitle>
                <CardDescription className="text-muted-foreground">DNS and authentication status</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setModalOpen(true)}><PlusIcon className="w-4 h-4 mr-2" />Add Domain</Button>
                <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}><ArrowDownTrayIcon className="w-4 h-4 mr-2 rotate-180" />Import CSV</Button>
                <Button size="sm" variant="outline" onClick={() => load()}><ArrowPathIcon className="w-4 h-4 mr-2" />Refresh</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dialog open={modalOpen} onOpenChange={(v) => { setModalOpen(v); if (!v) setForm({ url: '', domain_type: 'website' }) }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Domain</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Domain</Label>
                    <Input placeholder="example.com" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={form.domain_type} onValueChange={(v) => setForm({ ...form, domain_type: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="api">API</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button onClick={async () => {
                    try {
                      if (!form.url.trim()) return
                      await domainApi.create(sid, { url: form.url.trim(), domain_type: form.domain_type } as any)
                      setModalOpen(false)
                      await load()
                    } catch (e: unknown) {
                      toast.error?.(e?.message || 'Create failed')
                    }
                  }}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={uploadOpen} onOpenChange={(v) => { setUploadOpen(v); if (!v) setUploadFile(null) }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Import Domains</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>CSV File</Label>
                    <Input type="file" accept=".csv,.txt" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                    <div className="text-xs text-muted-foreground mt-1">Expected columns: domain[, type]</div>
                  </div>
                  <div>
                    <Label>Column Mapping</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Domain Column</Label>
                        <Select value={String(importMapping.domain)} onValueChange={(v) => setImportMapping({ ...importMapping, domain: Number(v) })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Column 1</SelectItem>
                            <SelectItem value="1">Column 2</SelectItem>
                            <SelectItem value="2">Column 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Type Column</Label>
                        <Select value={String(importMapping.type)} onValueChange={(v) => setImportMapping({ ...importMapping, type: Number(v) })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Column 1</SelectItem>
                            <SelectItem value="1">Column 2</SelectItem>
                            <SelectItem value="2">Column 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                    <Button onClick={async () => {
                      try {
                        if (!uploadFile) return
                        await domainApi.bulkUpload(sid, uploadFile)
                        setUploadOpen(false)
                        await load()
                        toast.success?.('Import started')
                      } catch (e: unknown) {
                        toast.error?.(e?.message || 'Import failed')
                      }
                    }}>Upload</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Domain Verification Records Dialog */}
            <Dialog open={verificationOpen} onOpenChange={(v) => { setVerificationOpen(v); if (!v) setSelectedDomain(null) }}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Domain Verification Records</DialogTitle>
                </DialogHeader>
                {selectedDomain && (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/20 rounded-lg">
                      <h4 className="font-medium mb-2">{selectedDomain.url || selectedDomain.domain}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">SPF Record</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input value="v=spf1 include:_spf.example.com ~all" readOnly className="text-xs" />
                            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText("v=spf1 include:_spf.example.com ~all")}>Copy</Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">DKIM Record</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input value="k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..." readOnly className="text-xs" />
                            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText("k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...")}>Copy</Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">DMARC Record</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input value="v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com" readOnly className="text-xs" />
                            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText("v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com")}>Copy</Button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        Add these DNS records to your domain provider to verify ownership and improve deliverability.
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            {initialLoading ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Skeleton className="h-9 w-64" />
                  <Skeleton className="h-9 w-[160px]" />
                  <Skeleton className="h-9 w-[160px]" />
                  <Skeleton className="h-9 w-24" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative min-w-0 flex-1">
                    <Input placeholder="Search domains..." className="pl-3 w-64 max-w-full" />
                  </div>
                  <Select>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Auth" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pass">All Passed</SelectItem>
                      <SelectItem value="issues">Issues</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Provider" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="aws">AWS SES</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline"><ArrowDownTrayIcon className="w-4 h-4 mr-2" />Export</Button>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><ShieldCheckIcon className="w-4 h-4 text-primary" /> SPF/DKIM/DMARC: OK 12</span>
                  <span className="flex items-center gap-1"><FingerPrintIcon className="w-4 h-4 text-blue-400" /> Issues: 3</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        {initialLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Card className="bg-background/60 border-border backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="text-sm font-semibold text-white mb-3">Domains</div>
                <div className="rounded-lg border border-white/10 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="px-4 py-2">Domain</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Auth</th>
                        <th className="px-4 py-2">Last Check</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr><td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={5}>No domains</td></tr>
                      ) : rows.map((d: unknown) => (
                        <tr key={d.id} className="hover:bg-white/5">
                          <td className="px-4 py-2 text-sm text-white">{d.url || d.domain || '-'}</td>
                          <td className="px-4 py-2 text-sm"><Badge variant="outline" className="capitalize">{d.status || 'unknown'}</Badge></td>
                          <td className="px-4 py-2 text-sm">{d.auth_status ? <Badge variant="outline" className="text-green-400 border-green-500/30">Verified</Badge> : <Badge variant="secondary">Unverified</Badge>}</td>
                          <td className="px-4 py-2 text-sm text-muted-foreground">{d.last_checked ? new Date(d.last_checked).toLocaleString() : '-'}</td>
                          <td className="px-4 py-2 text-right">
                            <Button size="sm" variant="outline" className="mr-2" onClick={() => { setSelectedDomain(d); setVerificationOpen(true) }}><ShieldCheckIcon className="w-4 h-4 mr-1" />Verify</Button>
                            <Button size="sm" variant="outline" className="mr-2" onClick={async () => { try { await (domainApi as any).check ? await (domainApi as any).check(sid, d.id) : await (await import('@/http/axios')).default.post(`/api/v1/domains/${sid}/domains/${d.id}/check`); toast.success?.('Check scheduled') } catch (e: unknown) { toast.error?.(e?.message || 'Check failed') } }}><CheckBadgeIcon className="w-4 h-4 mr-1" />Check</Button>
                            <Button size="sm" variant="destructive" onClick={async () => { try { await domainApi.remove(sid, d.id); await load() } catch (e: unknown) { toast.error?.(e?.message || 'Delete failed') } }}><TrashIcon className="w-4 h-4 mr-1" />Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </PageShell>
  )
}

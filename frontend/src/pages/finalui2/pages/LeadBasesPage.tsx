import React from 'react'
import PageShell from '../components/PageShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/useToast'
import { listLeadBases, createLeadBase, updateLeadBase, deleteLeadBase } from '@/api/leadBases'
import type { LeadBase } from '@/types/leads'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { leadBaseApi } from '@/http/api'

const LeadBasesPage: React.FC = () => {
  const [items, setItems] = React.useState<LeadBase[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [name, setName] = React.useState('')
  const [country, setCountry] = React.useState('')
  const [comment, setComment] = React.useState('')
  const [importOpen, setImportOpen] = React.useState(false)
  const [importFile, setImportFile] = React.useState<File | null>(null)
  const [importMapping, setImportMapping] = React.useState<Record<string, string>>({})
  const [importOptions, setImportOptions] = React.useState({
    skipDuplicates: true,
    validateEmails: true,
    createNewBase: false,
    newBaseName: ''
  })
  const [importProgress, setImportProgress] = React.useState(0)
  const [importStatus, setImportStatus] = React.useState('')
  const [csvPreview, setCsvPreview] = React.useState<string[][]>([])
  const [csvHeaders, setCsvHeaders] = React.useState<string[]>([])

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listLeadBases()
      const rows: unknown[] = Array.isArray((data as any)?.data) ? (data as any).data : (data as any)
      setItems(Array.isArray(rows) ? rows as any : [])
    } catch (e: unknown) {
      setError(e?.message || 'Failed to load lead bases')
    } finally { setLoading(false) }
  }, [])

  React.useEffect(() => { void refresh() }, [refresh])

  const onCreate = async () => {
    try {
      if (!name.trim()) { toast.error?.('Name required'); return }
      await createLeadBase({ id: '', name, country, comment })
      setName(''); setCountry(''); setComment('')
      void refresh()
      toast.success?.('Lead base created')
    } catch (e: unknown) {
      toast.error?.(e?.message || 'Create failed')
    }
  }

  const onUpdate = async (id: string, payload: Partial<LeadBase>) => {
    try {
      await updateLeadBase(id, payload as any)
      void refresh()
      toast.success?.('Updated')
    } catch (e: unknown) { toast.error?.(e?.message || 'Update failed') }
  }

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this lead base?')) return
    try { await deleteLeadBase(id); void refresh(); toast.success?.('Deleted') } catch (e: unknown) { toast.error?.(e?.message || 'Delete failed') }
  }

  return (
    <PageShell title="Lead Bases" subtitle="Manage lead repositories">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Create Lead Base</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
          <Input placeholder="Comment" value={comment} onChange={(e) => setComment(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={onCreate}>Create</Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>Import CSV</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lead Bases</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="text-destructive text-sm mb-2">{error}</div>}
          <div className="overflow-x-auto">
            <Table className="min-w-[48rem] text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={5}>No lead bases</TableCell></TableRow>
                ) : items.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.name}</TableCell>
                    <TableCell>{b.country}</TableCell>
                    <TableCell><Badge variant="outline">{b.status}</Badge></TableCell>
                    <TableCell>{b.leads_count}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => onUpdate(b.id, { name: b.name + ' *' } as any)}>Rename</Button>
                      <Button size="sm" variant="destructive" onClick={() => onDelete(b.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* CSV Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Leads from CSV</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>Select CSV File</Label>
              <Input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setImportFile(file)
                    // Preview CSV
                    const reader = new FileReader()
                    reader.onload = (e) => {
                      const text = e.target?.result as string
                      const lines = text.split('\n').slice(0, 6) // First 6 lines
                      const preview = lines.map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')))
                      setCsvHeaders(preview[0] || [])
                      setCsvPreview(preview.slice(1) || [])

                      // Auto-map common fields
                      const autoMapping: Record<string, string> = {}
                      preview[0]?.forEach(header => {
                        const lower = header.toLowerCase()
                        if (lower.includes('email')) autoMapping[header] = 'email'
                        else if (lower.includes('first') || lower.includes('name')) autoMapping[header] = 'first_name'
                        else if (lower.includes('last')) autoMapping[header] = 'last_name'
                        else if (lower.includes('company')) autoMapping[header] = 'company'
                        else if (lower.includes('phone')) autoMapping[header] = 'phone'
                        else if (lower.includes('website')) autoMapping[header] = 'website'
                      })
                      setImportMapping(autoMapping)
                    }
                    reader.readAsText(file)
                  }
                }}
              />
            </div>

            {/* Import Options */}
            <div className="space-y-3">
              <Label>Import Options</Label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <Switch checked={importOptions.skipDuplicates} onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, skipDuplicates: checked }))} />
                  <span className="text-sm">Skip duplicate emails</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={importOptions.validateEmails} onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, validateEmails: checked }))} />
                  <span className="text-sm">Validate email format</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={importOptions.createNewBase} onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, createNewBase: checked }))} />
                  <span className="text-sm">Create new lead base</span>
                </label>
              </div>
              {importOptions.createNewBase && (
                <Input
                  placeholder="New lead base name"
                  value={importOptions.newBaseName}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, newBaseName: e.target.value }))}
                />
              )}
            </div>

            {/* Field Mapping */}
            {csvHeaders.length > 0 && (
              <div className="space-y-3">
                <Label>Field Mapping</Label>
                <div className="grid grid-cols-2 gap-4">
                  {csvHeaders.map(header => (
                    <div key={header} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{header}</Label>
                      <Select value={importMapping[header] || ''} onValueChange={(value) => setImportMapping(prev => ({ ...prev, [header]: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Skip this column</SelectItem>
                          <SelectItem value="email">Email (Required)</SelectItem>
                          <SelectItem value="first_name">First Name</SelectItem>
                          <SelectItem value="last_name">Last Name</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="industry">Industry</SelectItem>
                          <SelectItem value="location">Location</SelectItem>
                          <SelectItem value="notes">Notes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CSV Preview */}
            {csvPreview.length > 0 && (
              <div className="space-y-2">
                <Label>Preview (first 5 rows)</Label>
                <div className="border rounded-md p-2 max-h-32 overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        {csvHeaders.map((header, i) => (
                          <th key={i} className="text-left p-1 border-b">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} className="p-1">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import Progress */}
            {importProgress > 0 && (
              <div className="space-y-2">
                <Label>Import Progress</Label>
                <Progress value={importProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">{importStatus}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!importFile || !importMapping.email) {
                    toast.error?.('Please select a file and map the email field')
                    return
                  }

                  try {
                    setImportProgress(10)
                    setImportStatus('Starting import...')

                    let baseId = items[0]?.id
                    if (importOptions.createNewBase && importOptions.newBaseName) {
                      const newBase = await createLeadBase({
                        id: '',
                        name: importOptions.newBaseName,
                        country: 'N/A',
                        comment: 'Created via CSV import'
                      })
                      baseId = (newBase as any)?.id || (newBase as any)?.data?.id
                      setImportProgress(30)
                      setImportStatus('Created new lead base...')
                    }

                    if (baseId) {
                      await leadBaseApi.upload(baseId, importFile)
                      setImportProgress(100)
                      setImportStatus('Import completed!')
                      toast.success?.('Leads imported successfully')
                      setTimeout(() => {
                        setImportOpen(false)
                        setImportProgress(0)
                        setImportStatus('')
                        void refresh()
                      }, 2000)
                    }
                  } catch (e: unknown) {
                    toast.error?.(e?.message || 'Import failed')
                    setImportProgress(0)
                    setImportStatus('')
                  }
                }}
                disabled={!importFile || !importMapping.email || importProgress > 0}
              >
                Start Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

export default LeadBasesPage

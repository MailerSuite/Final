import { useState, FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { MultiSelect } from '@/components/ui/multi-select'
import type { CampaignCreate } from '@/types/campaign'
import { toast } from '@/hooks/smtp-checker/use-toast'

interface Option {
  id: string
  name: string
}

interface CampaignFormProps {
  templates: Option[]
  leadBases: Option[]
  smtps: Option[]
  proxies: Option[]
  onSubmit: (data: CampaignCreate) => void
  loading?: boolean
}

const defaultValues: CampaignCreate = {
  name: '',
  template_id: '',
  subject: '',
  lead_base_ids: [],
  batch_size: 100,
  delay_between_batches: 60,
  threads_count: 5,
  autostart: false,
  proxy_type: 'none',
  proxy_host: '',
  proxy_port: undefined,
  proxy_username: '',
  proxy_password: '',
  retry_limit: 3,
  smtps: [],
  proxies: [],
  subjects: [],
  templates: [],
  content_blocks: [],
}

export default function CampaignForm({
  templates,
  leadBases,
  smtps,
  proxies,
  onSubmit,
  loading,
}: CampaignFormProps) {
  const [form, setForm] = useState<CampaignCreate>(defaultValues)
  const [subjectInput, setSubjectInput] = useState('')
  const [contentBlocksText, setContentBlocksText] = useState('[]')

  const addSubject = () => {
    const trimmed = subjectInput.trim()
    if (!trimmed) return
    if (!form.subjects.includes(trimmed)) {
      setForm({ ...form, subjects: [...form.subjects, trimmed] })
    }
    setSubjectInput('')
  }
  const removeSubject = (idx: number) => {
    const next = [...form.subjects]
    next.splice(idx, 1)
    setForm({ ...form, subjects: next })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.template_id) {
      toast({ description: 'Name and template are required', severity: 'critical' })
      return
    }
    if (form.lead_base_ids.length === 0) {
      toast({ description: 'Select at least one lead base', severity: 'critical' })
      return
    }
    let contentBlocks: Record<string, unknown>[] = []
    try {
      contentBlocks = JSON.parse(contentBlocksText || '[]')
    } catch {
      toast({ description: 'Content blocks JSON is invalid', severity: 'critical' })
      return
    }
    onSubmit({
      ...form,
      subject: form.subject || undefined,
      proxy_host: form.proxy_type !== 'none' ? form.proxy_host || undefined : undefined,
      proxy_port:
        form.proxy_type !== 'none' && form.proxy_port
          ? Number(form.proxy_port)
          : undefined,
      proxy_username:
        form.proxy_type !== 'none' ? form.proxy_username || undefined : undefined,
      proxy_password:
        form.proxy_type !== 'none' ? form.proxy_password || undefined : undefined,
      content_blocks: contentBlocks,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Campaign Name<span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          maxLength={255}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="template">Template<span className="text-destructive ml-1">*</span></Label>
        <Select
          value={form.template_id}
          onValueChange={(val) => setForm({ ...form, template_id: val })}
        >
          <SelectTrigger id="template" className="w-full">
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((tpl) => (
              <SelectItem key={tpl.id} value={tpl.id}>
                {tpl.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Lead Bases<span className="text-destructive ml-1">*</span></Label>
        <MultiSelect
          options={leadBases.map((lb) => ({ value: lb.id, label: lb.name }))}
          selected={form.lead_base_ids}
          onChange={(vals: string[]) => setForm({ ...form, lead_base_ids: vals })}
          placeholder="Select lead bases"
        />
      </div>

      <div className="space-y-2">
        <Label>SMTP Servers</Label>
        <MultiSelect
          options={smtps.map((s) => ({ value: s.id, label: s.name }))}
          selected={form.smtps}
          onChange={(vals: string[]) => setForm({ ...form, smtps: vals })}
          placeholder="Select SMTP servers"
        />
      </div>

      <div className="space-y-2">
        <Label>Proxies</Label>
        <MultiSelect
          options={proxies.map((p) => ({ value: p.id, label: p.name }))}
          selected={form.proxies}
          onChange={(vals: string[]) => setForm({ ...form, proxies: vals })}
          placeholder="Select proxies"
        />
      </div>

      <div className="space-y-2">
        <Label>Template Pool</Label>
        <MultiSelect
          options={templates.map((t) => ({ value: t.id, label: t.name }))}
          selected={form.templates}
          onChange={(vals: string[]) => setForm({ ...form, templates: vals })}
          placeholder="Optional templates"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject_add">Subjects</Label>
        <div className="flex gap-2">
          <Input
            id="subject_add"
            value={subjectInput}
            onChange={(e) => setSubjectInput(e.target.value)}
          />
          <Button type="button" onClick={addSubject}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {form.subjects.map((s, idx) => (
            <Badge key={idx} className="flex items-center gap-1">
              {s}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => removeSubject(idx)}
              />
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="batch_size">Batch Size</Label>
          <Input
            id="batch_size"
            type="number"
            min={1}
            max={1000}
            value={form.batch_size}
            onChange={(e) =>
              setForm({ ...form, batch_size: Number(e.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="delay_between_batches">Delay Between Batches (s)</Label>
          <Input
            id="delay_between_batches"
            type="number"
            min={1}
            max={3600}
            value={form.delay_between_batches}
            onChange={(e) =>
              setForm({
                ...form,
                delay_between_batches: Number(e.target.value),
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="threads_count">Threads Count</Label>
          <Input
            id="threads_count"
            type="number"
            min={1}
            max={20}
            value={form.threads_count}
            onChange={(e) =>
              setForm({ ...form, threads_count: Number(e.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="retry_limit">Retry Limit</Label>
          <Input
            id="retry_limit"
            type="number"
            min={1}
            max={10}
            value={form.retry_limit}
            onChange={(e) =>
              setForm({ ...form, retry_limit: Number(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="autostart"
          checked={form.autostart}
          onCheckedChange={(c) => setForm({ ...form, autostart: !!c })}
        />
        <Label htmlFor="autostart">Autostart After Creation</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proxy_type">Proxy Type</Label>
        <Select
          value={form.proxy_type}
          onValueChange={(val) => setForm({ ...form, proxy_type: val as any })}
        >
          <SelectTrigger id="proxy_type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="http">HTTP</SelectItem>
            <SelectItem value="https">HTTPS</SelectItem>
            <SelectItem value="socks">SOCKS</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {form.proxy_type !== 'none' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="proxy_host">Proxy Host</Label>
            <Input
              id="proxy_host"
              value={form.proxy_host}
              onChange={(e) => setForm({ ...form, proxy_host: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proxy_port">Proxy Port</Label>
            <Input
              id="proxy_port"
              type="number"
              value={form.proxy_port || ''}
              onChange={(e) =>
                setForm({ ...form, proxy_port: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proxy_username">Proxy Username</Label>
            <Input
              id="proxy_username"
              value={form.proxy_username || ''}
              onChange={(e) =>
                setForm({ ...form, proxy_username: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proxy_password">Proxy Password</Label>
            <Input
              id="proxy_password"
              type="password"
              value={form.proxy_password || ''}
              onChange={(e) =>
                setForm({ ...form, proxy_password: e.target.value })
              }
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="content_blocks">Content Blocks (JSON)</Label>
        <Textarea
          id="content_blocks"
          value={contentBlocksText}
          onChange={(e) => setContentBlocksText(e.target.value)}
          className="min-h-32"
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  )
}

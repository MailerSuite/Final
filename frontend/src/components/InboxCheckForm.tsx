import React, { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/LoadingSpinner'
import { getOptions, runCheck, InboxCheckOptions, StepResult } from '@/api/inboxCheckService'

interface InboxCheckFormProps {
  onStart?: () => void
  onComplete: (results: StepResult[]) => void
  onError?: (message: string) => void
}

export default function InboxCheckForm({ onStart, onComplete, onError }: InboxCheckFormProps) {
  const [options, setOptions] = useState<InboxCheckOptions | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    domain: '',
    template: '',
    proxy: '',
    smtp: '',
    imap: '',
  })

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getOptions()
        setOptions(data)
      } catch {
        onError?.('Failed to load options')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [onError])

  const disabled =
    sending ||
    !form.domain ||
    !form.template ||
    !form.proxy ||
    !form.smtp ||
    !form.imap

  const handleChange = (key: keyof typeof form) => (value: string) => {
    setForm((p) => ({ ...p, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (disabled) return
    try {
      onStart?.()
      setSending(true)
      const results = await runCheck(form)
      onComplete(results)
    } catch {
      onError?.('Inbox check failed')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <LoadingSpinner />
      </div>
    )
  }

  if (!options) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="domain-select">Domain</Label>
        <Select value={form.domain} onValueChange={handleChange('domain')}>
          <SelectTrigger id="domain-select">
            <SelectValue placeholder="Select domain" />
          </SelectTrigger>
          <SelectContent>
            {options.domains.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="template-select">Template</Label>
        <Select value={form.template} onValueChange={handleChange('template')}>
          <SelectTrigger id="template-select">
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            {options.templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="proxy-select">Proxy</Label>
        <Select value={form.proxy} onValueChange={handleChange('proxy')}>
          <SelectTrigger id="proxy-select">
            <SelectValue placeholder="Select proxy" />
          </SelectTrigger>
          <SelectContent>
            {options.proxies.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="smtp-select">SMTP Server</Label>
        <Select value={form.smtp} onValueChange={handleChange('smtp')}>
          <SelectTrigger id="smtp-select">
            <SelectValue placeholder="Select SMTP" />
          </SelectTrigger>
          <SelectContent>
            {options.smtps.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="imap-select">IMAP Inbox</Label>
        <Select value={form.imap} onValueChange={handleChange('imap')}>
          <SelectTrigger id="imap-select">
            <SelectValue placeholder="Select inbox" />
          </SelectTrigger>
          <SelectContent>
            {options.imapInboxes.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={disabled} className="w-full">
        {sending ? <LoadingSpinner size="h-4 w-4" /> : 'Send Test'}
      </Button>
    </form>
  )
}

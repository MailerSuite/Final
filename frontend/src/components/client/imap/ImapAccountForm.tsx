import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { IMAPAccount } from '@/types/imap'

interface Props {
  initial?: Partial<IMAPAccount>
  onSubmit: (data: Partial<IMAPAccount>) => void
  onCancel: () => void
  loading?: boolean
}

export default function ImapAccountForm({ initial, onSubmit, onCancel, loading }: Props) {
  const [form, setForm] = useState<Partial<IMAPAccount>>({})

  useEffect(() => {
    setForm(initial || {})
  }, [initial])

  const handleChange = (field: keyof IMAPAccount, value: any) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const submit = () => onSubmit(form)

  return (
    <div className="space-y-4">
      <Input
        placeholder="imap.server.com"
        value={form.imap_server || ''}
        onChange={(e) => handleChange('imap_server', e.target.value)}
      />
      <Input
        type="number"
        placeholder="993"
        value={form.imap_port || 993}
        onChange={(e) => handleChange('imap_port', Number(e.target.value))}
      />
      <Input
        placeholder="email@example.com"
        value={form.email || ''}
        onChange={(e) => handleChange('email', e.target.value)}
      />
      <Input
        type="password"
        placeholder="password"
        value={form.password || ''}
        onChange={(e) => handleChange('password', e.target.value)}
      />
      <div className="flex gap-2 justify-end">
        <Button onClick={submit} disabled={loading}>Save IMAP Configuration</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

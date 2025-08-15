import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { MultiSelect } from '@/components/ui/multi-select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { templateApi } from '@/http/api'
import useSessionStore from '@/store/session'
import { Skeleton } from '@/components/ui/skeleton'
import SectionCard from '@/components/common/SectionCard'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Option { value: string; label: string }

export default function StepNameMaterials() {
  const { control, watch, setValue } = useFormContext()
  const { session } = useSessionStore()
  const [templates, setTemplates] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [senderInput, setSenderInput] = useState('')

  const senders: string[] = watch('senders') || []
  const sender: string = watch('sender') || ''
  const cc: string[] = watch('cc') || []
  const bcc: string[] = watch('bcc') || []
  const name: string = watch('campaignName') || ''
  const xHeaders: { key: string; value: string }[] = watch('xHeaders') || []

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true)
      try {
        const { data } = await templateApi.list({
          session_id: session?.id || localStorage.getItem('session_id') || '0',
        })
        setTemplates(data.map((t) => ({ value: String(t.id), label: t.name })))
        setError(false)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  const addSender = () => {
    const trimmed = senderInput.trim()
    if (!trimmed) return
    if (!senders.includes(trimmed)) {
      setValue('senders', [...senders, trimmed])
    }
    setSenderInput('')
  }

  const removeSender = (idx: number) => {
    const next = [...senders]
    next.splice(idx, 1)
    setValue('senders', next)
  }

  const addHeaderRow = () => {
    setValue('xHeaders', [...xHeaders, { key: '', value: '' }])
  }

  const updateHeader = (idx: number, field: 'key' | 'value', value: string) => {
    const next = [...xHeaders]
    next[idx] = { ...next[idx], [field]: value }
    setValue('xHeaders', next)
  }

  const removeHeader = (idx: number) => {
    const next = [...xHeaders]
    next.splice(idx, 1)
    setValue('xHeaders', next)
  }

  const handleHeaderPaste = (idx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text')
    if (text.includes('\n')) {
      e.preventDefault()
      const lines = text.split(/\r?\n/).filter(Boolean)
      const parsed = lines.map((line) => {
        const [k, v] = line.split(':')
        return { key: k.trim(), value: (v || '').trim() }
      })
      const next = [...xHeaders]
      next.splice(idx, 1, ...parsed)
      setValue('xHeaders', next)
    }
  }

  return (
    <SectionCard title="Basic Configuration">
      <div className="space-y-6">
        <FormField
          control={control}
          name="campaignName"
        rules={{ required: 'Campaign name is required', maxLength: 100 }}
        render={({ field }: any) => (
          <FormItem>
            <FormLabel>Campaign Name</FormLabel>
            <FormControl>
              <div className="space-y-1">
                <Input {...field} maxLength={100} />
                <div className="text-right text-xs text-muted-foreground">
                  {name.length}/100
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="templateIds"
        rules={{ validate: (v: string[]) => (v?.length ? true : 'Select at least one template') }}
        render={({ field }: any) => (
          <FormItem>
            <FormLabel>Templates</FormLabel>
            <FormControl>
              {loading ? (
                <Skeleton height={40} />
              ) : error ? (
                <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              ) : (
                <MultiSelect
                  options={templates}
                  selected={field.value || []}
                  onChange={field.onChange}
                  placeholder="Select templates"
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="sender"
          rules={{ required: 'Sender is required', pattern: { value: EMAIL_REGEX, message: 'Invalid email' } }}
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Sender</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  value={sender}
                  onChange={(e) => setValue('sender', e.target.value, { shouldValidate: true })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="cc"
          rules={{ validate: (v: string[]) => v.every((e) => EMAIL_REGEX.test(e)) || 'Invalid email' }}
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>CC</FormLabel>
              <FormControl>
                <Input
                  value={cc.join(', ')}
                  onChange={(e) =>
                    setValue(
                      'cc',
                      e.target.value.split(/[,\s]+/).filter(Boolean),
                      { shouldValidate: true }
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="bcc"
          rules={{ validate: (v: string[]) => v.every((e) => EMAIL_REGEX.test(e)) || 'Invalid email' }}
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>BCC</FormLabel>
              <FormControl>
                <Input
                  value={bcc.join(', ')}
                  onChange={(e) =>
                    setValue(
                      'bcc',
                      e.target.value.split(/[,\s]+/).filter(Boolean),
                      { shouldValidate: true }
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="space-y-2">
        <FormLabel>Sender Names</FormLabel>
        <div className="flex gap-2">
          <Input
            value={senderInput}
            onChange={(e) => setSenderInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' && (e.preventDefault(), addSender())
            }
          />
          <Button size="sm" type="button" onClick={addSender} variant="secondary">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {senders.map((s, idx) => (
            <Badge key={idx} className="flex items-center gap-1">
              {s}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeSender(idx)} />
            </Badge>
          ))}
        </div>
      </div>
      <FormField
        control={control}
        name="sender"
        rules={{
          required: 'Sender is required',
          pattern: { value: /.+@.+\..+/, message: 'Invalid email' },
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sender</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={sender}
                onChange={(e) => setValue('sender', e.target.value)}
                placeholder="sender@example.com"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="cc"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CC</FormLabel>
            <FormControl>
              <Input
                value={cc.join(', ')}
                onChange={(e) =>
                  setValue(
                    'cc',
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="cc1@example.com, cc2@example.com"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="bcc"
        render={({ field }) => (
          <FormItem>
            <FormLabel>BCC</FormLabel>
            <FormControl>
              <Input
                value={bcc.join(', ')}
                onChange={(e) =>
                  setValue(
                    'bcc',
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="bcc1@example.com, bcc2@example.com"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="space-y-2">
        <FormLabel>X-Headers</FormLabel>
        {xHeaders.map((h, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <Input
              placeholder="Key"
              value={h.key}
              onChange={(e) => updateHeader(idx, 'key', e.target.value)}
              onPaste={(e) => handleHeaderPaste(idx, e)}
            />
            <Input
              placeholder="Value"
              value={h.value}
              onChange={(e) => updateHeader(idx, 'value', e.target.value)}
            />
            <Button size="icon" variant="ghost" onClick={() => removeHeader(idx)} aria-label="Remove header">
              <X className="size-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addHeaderRow} size="sm">
          Add Header
        </Button>
      </div>
      </div>
    </SectionCard>
  )
}

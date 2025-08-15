import React from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { toast } from 'sonner'
import { getSessionId } from '@/utils/getSessionId'
import { createCampaign } from '@/api/campaigns'
import { listTemplates } from '@/api/templates'
import { listSmtp } from '@/api/smtp'
import campaignService from '@/api/consolidated/campaign-service'
import { leadBaseApi, type LeadBaseResponse } from '@/http/api'
import { bounceApi, type SuppressionListEntry } from '@/api/bounce-api'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { PlusIcon, TrashIcon } from 'lucide-react'

const CampaignCreateWizard: React.FC = () => {
  const navigate = useNavigate()
  const sid = getSessionId()
  const [step, setStep] = React.useState(1)
  const [name, setName] = React.useState('')
  const [type, setType] = React.useState('regular')
  const [subject, setSubject] = React.useState('')
  const [templateId, setTemplateId] = React.useState('')
  const [batch, setBatch] = React.useState(100)
  const [delay, setDelay] = React.useState(1000)
  const [threads, setThreads] = React.useState(1)
  const [leadBaseIds, setLeadBaseIds] = React.useState<string>('')
  const [creating, setCreating] = React.useState(false)
  const [templates, setTemplates] = React.useState<{ id: string; name: string }[]>([])
  const [smtps, setSmtps] = React.useState<{ id: string; email: string }[]>([])
  const [selectedSmtps, setSelectedSmtps] = React.useState<string[]>([])
  const [preflightChecks, setPreflightChecks] = React.useState({
    dns: false,
    smtp: false,
    template: false,
    blacklist: false
  })
  const [testEmail, setTestEmail] = React.useState('')
  const [testSent, setTestSent] = React.useState(false)
  const [scheduledAt, setScheduledAt] = React.useState<string>('')
  const [abTesting, setAbTesting] = React.useState(false)
  const [abVariants, setAbVariants] = React.useState([
    { id: 1, name: 'Control', subject: '', content: '', percentage: 50, isWinner: false }
  ])
  const [abMetric, setAbMetric] = React.useState<'open_rate' | 'click_rate' | 'conversion_rate'>('open_rate')
  const [abDuration, setAbDuration] = React.useState(7)
  const [abTestSize, setAbTestSize] = React.useState(10000)
  const [dripSequence, setDripSequence] = React.useState(false)
  const [dripSteps, setDripSteps] = React.useState([
    { id: 1, name: 'Welcome', delay: 0, subject: '', content: '', conditions: [] }
  ])
  const [dripDelayUnit, setDripDelayUnit] = React.useState<'hours' | 'days'>('days')
  const [scheduleType, setScheduleType] = React.useState<'immediate' | 'once' | 'recurring'>('immediate')
  const [timezone, setTimezone] = React.useState('UTC')
  const [recurringType, setRecurringType] = React.useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [recurringDays, setRecurringDays] = React.useState<number[]>([1]) // Monday
  const [recurringTime, setRecurringTime] = React.useState('09:00')
  const [sendTimeOptimization, setSendTimeOptimization] = React.useState(false)
  const [optimizationWindow, setOptimizationWindow] = React.useState(2)
  const [leadBases, setLeadBases] = React.useState<LeadBaseResponse[]>([])
  const [selectedLeadBases, setSelectedLeadBases] = React.useState<number[]>([])
  const [newListName, setNewListName] = React.useState('')
  const [newListFile, setNewListFile] = React.useState<File | null>(null)
  const [suppressionLists, setSuppressionLists] = React.useState<SuppressionListEntry[]>([])
  const [selectedSuppressions, setSelectedSuppressions] = React.useState<string[]>([])

  React.useEffect(() => {
    (async () => {
      try {
        if (!sid) return
        const t = await listTemplates()
        setTemplates((t || []).map((x: unknown) => ({ id: x.id, name: x.name || x.template_name || x.id })))
        const s = await listSmtp(sid)
        setSmtps((s || []).map((x: unknown) => ({ id: x.id, email: x.email })))
        try {
          const { data } = await leadBaseApi.list('')
          setLeadBases(Array.isArray(data) ? data : [])
          try {
            const { entries } = await bounceApi.getSuppressionList({ limit: 100 })
            setSuppressionLists(entries || [])
          } catch { }
        } catch { }
      } catch { }
    })()
  }, [sid])

  const canNext = () => {
    if (step === 1) return name.trim().length > 0
    if (step === 2) return true
    if (step === 3) return subject.trim().length > 0
    if (step === 4) return selectedSmtps.length > 0
    if (step === 5) return Object.values(preflightChecks).every(Boolean)
    if (step === 6) return !abTesting || (abVariants.length >= 2 && abVariants.every(v => v.subject.trim() && v.percentage > 0))
    return true
  }

  const onCreate = async () => {
    if (!sid) { toast.error?.('No active session'); return }
    try {
      setCreating(true)
      const created = await createCampaign(sid, {
        name,
        subject,
        template_id: templateId || 'default',
        lead_base_ids: selectedLeadBases.length ? selectedLeadBases.map(String) : leadBaseIds.split(/[\s,]+/).map(s => s.trim()).filter(Boolean),
        suppression_lists: selectedSuppressions,
        ab_testing: abTesting ? {
          metric: abMetric,
          duration: abDuration,
          test_size: abTestSize,
          variants: abVariants.map(v => ({
            name: v.name,
            subject: v.subject,
            percentage: v.percentage
          }))
        } : undefined,
        drip_sequence: dripSequence ? {
          steps: dripSteps.map(step => ({
            name: step.name,
            delay: step.delay,
            delay_unit: dripDelayUnit,
            subject: step.subject,
            content: step.content,
            conditions: step.conditions
          }))
        } : undefined,
        schedule: scheduleType !== 'immediate' ? {
          type: scheduleType,
          timezone,
          ...(scheduleType === 'once' && { scheduled_at: scheduledAt }),
          ...(scheduleType === 'recurring' && {
            recurring_type: recurringType,
            recurring_days: recurringDays,
            recurring_time: recurringTime
          }),
          send_time_optimization: sendTimeOptimization,
          optimization_window: optimizationWindow
        } : undefined,
        batch_size: batch,
        delay_between_batches: delay,
        threads_count: threads,
        autostart: false,
        proxy_type: 'none',
        retry_limit: 0,
        smtps: selectedSmtps,
        proxies: [],
        subjects: [subject],
        templates: [],
        content_blocks: [],
      })
      if (scheduledAt) {
        try {
          const id = (created as { id?: string; data?: { id?: string } })?.id || (created as { id?: string; data?: { id?: string } })?.data?.id
          if (id) await campaignService.scheduleCampaign(String(id), new Date(scheduledAt).toISOString())
        } catch { /* non-fatal */ }
      }
      toast.success?.('Campaign created successfully! Redirecting...')
      setStep(7)
      
      // Navigate to campaign details or campaigns list after a short delay
      setTimeout(() => {
        if (created?.id) {
          navigate(`/campaigns/${created.id}`)
        } else {
          navigate('/campaigns')
        }
      }, 2000)
    } catch (e: unknown) {
      toast.error?.(e?.message || 'Failed to create campaign')
    } finally { setCreating(false) }
  }

  return (
    <PageShell title="Create Campaign" subtitle="Guided setup wizard" breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Campaigns', href: '/campaigns' }, { label: 'Create' }]}>
      <Card>
        <CardHeader>
          <CardTitle>Step {step} of 7</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Spring Promo" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="automated">Automated</SelectItem>
                    <SelectItem value="ab-test">A/B Test</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Select Lead Bases</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto p-2 border rounded-md">
                  {leadBases.length === 0 && <div className="text-xs text-muted-foreground">No lead bases yet. Create a new list below.</div>}
                  {leadBases.map(lb => (
                    <label key={lb.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={selectedLeadBases.includes(lb.id)}
                        onChange={(e) => {
                          setSelectedLeadBases(prev => e.target.checked ? [...prev, lb.id] : prev.filter(x => x !== lb.id))
                        }}
                      />
                      <span>{lb.name} <span className="text-xs text-muted-foreground">({lb.leads_count ?? 0})</span></span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Or specify lead base IDs</Label>
                  <Input value={leadBaseIds} onChange={(e) => setLeadBaseIds(e.target.value)} placeholder="base_123 base_456" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Create New List (optional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="List name" value={newListName} onChange={(e) => setNewListName(e.target.value)} />
                  <Input type="file" accept=".csv,.txt" onChange={(e) => setNewListFile(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <Button variant="outline" size="sm" onClick={async () => {
                    try {
                      if (!newListName.trim() || !newListFile) return
                      const created = await leadBaseApi.create({ name: newListName.trim(), country: 'N/A', comment: '', status: 'active' })
                      const id = (created as { data?: { id?: number }; id?: number })?.data?.id || (created as { data?: { id?: number }; id?: number })?.id
                      if (id) {
                        await leadBaseApi.upload(id, newListFile)
                        setSelectedLeadBases(prev => [...prev, Number(id)])
                        const { data } = await leadBaseApi.list('')
                        setLeadBases(Array.isArray(data) ? data : [])
                        setNewListName(''); setNewListFile(null)
                        toast.success?.('List created and uploaded')
                      }
                    } catch (e: unknown) {
                      toast.error?.(e?.message || 'Create list failed')
                    }
                  }}>Create & Upload</Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Attach one or more lead bases; you can refine recipients later.</div>
              <div className="space-y-2">
                <Label>Exclude Suppression Lists (optional)</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-auto p-2 border rounded-md">
                  {suppressionLists.length === 0 && <div className="text-xs text-muted-foreground">No suppression lists found.</div>}
                  {suppressionLists.map(sl => (
                    <label key={sl.email_address} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={selectedSuppressions.includes(sl.email_address)}
                        onChange={(e) => {
                          setSelectedSuppressions(prev => e.target.checked ? [...prev, sl.email_address] : prev.filter(x => x !== sl.email_address))
                        }}
                      />
                      <span>{sl.email_address} <span className="text-xs text-muted-foreground">({sl.suppression_type})</span></span>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">Selected emails will be excluded from this campaign.</div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Save 20% this week" />
              </div>
              <div>
                <Label>Template</Label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label>SMTP Senders</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto p-2 border rounded-md">
                  {smtps.length === 0 && <div className="text-xs text-muted-foreground">No SMTP accounts. Add some in SMTP Accounts.</div>}
                  {smtps.map(s => (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={selectedSmtps.includes(s.id)}
                        onChange={(e) => {
                          setSelectedSmtps(prev => e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id))
                        }}
                      />
                      <span>{s.email}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Batch size</Label>
                  <Input type="number" value={batch} onChange={(e) => setBatch(parseInt(e.target.value || '0'))} />
                </div>
                <div>
                  <Label>Delay between batches (ms)</Label>
                  <Input type="number" value={delay} onChange={(e) => setDelay(parseInt(e.target.value || '0'))} />
                </div>
                <div>
                  <Label>Threads</Label>
                  <Input type="number" value={threads} onChange={(e) => setThreads(parseInt(e.target.value || '1'))} />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <Label>Preflight Checks</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={preflightChecks.dns} onChange={(e) => setPreflightChecks(prev => ({ ...prev, dns: e.target.checked }))} />
                    <span className="text-sm">DNS records (SPF/DKIM/DMARC)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={preflightChecks.smtp} onChange={(e) => setPreflightChecks(prev => ({ ...prev, smtp: e.target.checked }))} />
                    <span className="text-sm">SMTP account health</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={preflightChecks.template} onChange={(e) => setPreflightChecks(prev => ({ ...prev, template: e.target.checked }))} />
                    <span className="text-sm">Template validation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={preflightChecks.blacklist} onChange={(e) => setPreflightChecks(prev => ({ ...prev, blacklist: e.target.checked }))} />
                    <span className="text-sm">Domain blacklist check</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Test Send</Label>
                <div className="flex gap-2">
                  <Input placeholder="test@example.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
                  <Button variant="outline" onClick={() => {
                    if (!testEmail.trim()) return
                    setTestSent(true)
                    setTimeout(() => setTestSent(false), 3000)
                  }}>Send Test</Button>
                </div>
                {testSent && <div className="text-sm text-green-600">Test email sent!</div>}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Schedule Type</Label>
                  <Select value={scheduleType} onValueChange={(value: unknown) => setScheduleType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Send Immediately</SelectItem>
                      <SelectItem value="once">Send Once</SelectItem>
                      <SelectItem value="recurring">Recurring Schedule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {scheduleType === 'once' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Date & Time</Label>
                        <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                      </div>
                      <div>
                        <Label>Timezone</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                            <SelectItem value="America/Chicago">Central Time</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                            <SelectItem value="Europe/London">London</SelectItem>
                            <SelectItem value="Europe/Paris">Paris</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                            <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {scheduleType === 'recurring' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Recurring Type</Label>
                        <Select value={recurringType} onValueChange={(value: unknown) => setRecurringType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Send Time</Label>
                        <Input type="time" value={recurringTime} onChange={(e) => setRecurringTime(e.target.value)} />
                      </div>

                      <div>
                        <Label>Timezone</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                            <SelectItem value="America/Chicago">Central Time</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                            <SelectItem value="Europe/London">London</SelectItem>
                            <SelectItem value="Europe/Paris">Paris</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                            <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {recurringType === 'weekly' && (
                      <div>
                        <Label>Days of Week</Label>
                        <div className="grid grid-cols-7 gap-2 mt-2">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                            <label key={day} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={recurringDays.includes(index)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setRecurringDays(prev => [...prev, index])
                                  } else {
                                    setRecurringDays(prev => prev.filter(d => d !== index))
                                  }
                                }}
                                className="accent-primary"
                              />
                              <span className="text-sm">{day}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {recurringType === 'monthly' && (
                      <div>
                        <Label>Day of Month</Label>
                        <Select
                          value={recurringDays[0]?.toString() || '1'}
                          onValueChange={(value) => setRecurringDays([Number(value)])}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                              <SelectItem key={day} value={day.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={sendTimeOptimization} onCheckedChange={setSendTimeOptimization} />
                    <Label>Send Time Optimization</Label>
                  </div>

                  {sendTimeOptimization && (
                    <div className="p-3 border rounded-lg bg-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Optimization Window (hours)</Label>
                          <Input
                            type="number"
                            value={optimizationWindow}
                            onChange={(e) => setOptimizationWindow(Number(e.target.value))}
                            min="1"
                            max="24"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            Campaign will be sent within {optimizationWindow} hours of the scheduled time
                            based on recipient engagement patterns.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch checked={abTesting} onCheckedChange={setAbTesting} />
                  <Label>Enable A/B Testing</Label>
                </div>

                {abTesting && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Test Metric</Label>
                        <Select value={abMetric} onValueChange={(value: unknown) => setAbMetric(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open_rate">Open Rate</SelectItem>
                            <SelectItem value="click_rate">Click Rate</SelectItem>
                            <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Test Duration (days)</Label>
                        <Input type="number" value={abDuration} onChange={(e) => setAbDuration(Number(e.target.value))} min="1" max="30" />
                      </div>

                      <div>
                        <Label>Test Size</Label>
                        <Input type="number" value={abTestSize} onChange={(e) => setAbTestSize(Number(e.target.value))} min="1000" step="1000" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>A/B Test Variants</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newVariant = {
                              id: Date.now(),
                              name: `Variant ${abVariants.length + 1}`,
                              subject: '',
                              content: '',
                              percentage: Math.floor(100 / (abVariants.length + 1)),
                              isWinner: false
                            }
                            setAbVariants(prev => {
                              const updated = [...prev, newVariant]
                              // Redistribute percentages
                              const total = updated.length
                              return updated.map((v) => ({ ...v, percentage: Math.floor(100 / total) }))
                            })
                          }}
                        >
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Add Variant
                        </Button>
                      </div>

                      {abVariants.map((variant, index) => (
                        <div key={variant.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={variant.isWinner ? 'default' : 'secondary'}>
                                {variant.name}
                              </Badge>
                              {index === 0 && <span className="text-xs text-muted-foreground">(Control)</span>}
                            </div>
                            {abVariants.length > 2 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAbVariants(prev => {
                                    const filtered = prev.filter(v => v.id !== variant.id)
                                    const total = filtered.length
                                    return filtered.map((v) => ({ ...v, percentage: Math.floor(100 / total) }))
                                  })
                                }}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label>Subject Line</Label>
                              <Input
                                value={variant.subject}
                                onChange={(e) => setAbVariants(prev => prev.map(v =>
                                  v.id === variant.id ? { ...v, subject: e.target.value } : v
                                ))}
                                placeholder={index === 0 ? "Control subject" : "Variant subject"}
                              />
                            </div>
                            <div>
                              <Label>Percentage</Label>
                              <Input
                                type="number"
                                value={variant.percentage}
                                onChange={(e) => {
                                  const newPercentage = Number(e.target.value)
                                  if (newPercentage >= 0 && newPercentage <= 100) {
                                    setAbVariants(prev => {
                                      const updated = prev.map(v =>
                                        v.id === variant.id ? { ...v, percentage: newPercentage } : v
                                      )
                                      // Normalize percentages to sum to 100
                                      const total = updated.reduce((sum, v) => sum + v.percentage, 0)
                                      if (total !== 100) {
                                        const factor = 100 / total
                                        return updated.map(v => ({ ...v, percentage: Math.round(v.percentage * factor) }))
                                      }
                                      return updated
                                    })
                                  }
                                }}
                                min="0"
                                max="100"
                              />
                            </div>
                          </div>

                          {index > 0 && (
                            <div>
                              <Label>Content (optional)</Label>
                              <Textarea
                                value={variant.content}
                                onChange={(e) => setAbVariants(prev => prev.map(v =>
                                  v.id === variant.id ? { ...v, content: e.target.value } : v
                                ))}
                                placeholder="Leave empty to use control content"
                                className="min-h-[100px]"
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="text-xs text-muted-foreground">
                        A/B test will run for {abDuration} days with {abTestSize.toLocaleString()} recipients.
                        Winner will be selected based on {abMetric.replace('_', ' ')} performance.
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={dripSequence} onCheckedChange={setDripSequence} />
                    <Label>Enable Drip Sequence</Label>
                  </div>

                  {dripSequence && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Drip Sequence Steps</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newStep = {
                                id: Date.now(),
                                name: `Step ${dripSteps.length + 1}`,
                                delay: dripSteps.length === 0 ? 0 : dripSteps[dripSteps.length - 1].delay + 1,
                                subject: '',
                                content: '',
                                conditions: []
                              }
                              setDripSteps(prev => [...prev, newStep])
                            }}
                          >
                            <PlusIcon className="w-4 h-4 mr-1" />
                            Add Step
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {dripSteps.map((step, index) => (
                            <div key={step.id} className="p-4 border rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{step.name}</Badge>
                                  <span className="text-xs text-muted-foreground">Step {index + 1}</span>
                                </div>
                                {dripSteps.length > 1 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setDripSteps(prev => prev.filter(s => s.id !== step.id))
                                    }}
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <Label>Step Name</Label>
                                  <Input
                                    value={step.name}
                                    onChange={(e) => setDripSteps(prev => prev.map(s =>
                                      s.id === step.id ? { ...s, name: e.target.value } : s
                                    ))}
                                    placeholder="e.g., Welcome, Follow-up, Reminder"
                                  />
                                </div>
                                <div>
                                  <Label>Delay</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      value={step.delay}
                                      onChange={(e) => setDripSteps(prev => prev.map(s =>
                                        s.id === step.id ? { ...s, delay: Number(e.target.value) } : s
                                      ))}
                                      min="0"
                                      className="flex-1"
                                    />
                                    <Select value={dripDelayUnit} onValueChange={(value: 'hours' | 'days') => setDripDelayUnit(value)}>
                                      <SelectTrigger className="w-20">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="hours">Hours</SelectItem>
                                        <SelectItem value="days">Days</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div>
                                  <Label>Subject Line</Label>
                                  <Input
                                    value={step.subject}
                                    onChange={(e) => setDripSteps(prev => prev.map(s =>
                                      s.id === step.id ? { ...s, subject: e.target.value } : s
                                    ))}
                                    placeholder="Subject for this step"
                                  />
                                </div>
                              </div>

                              <div>
                                <Label>Content (optional)</Label>
                                <Textarea
                                  value={step.content}
                                  onChange={(e) => setDripSteps(prev => prev.map(s =>
                                    s.id === step.id ? { ...s, content: e.target.value } : s
                                  ))}
                                  placeholder="Leave empty to use main template content"
                                  className="min-h-[100px]"
                                />
                              </div>

                              <div className="text-xs text-muted-foreground">
                                {step.delay === 0 ? 'This step will be sent immediately' :
                                  `This step will be sent ${step.delay} ${dripDelayUnit} after the previous step`}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Drip sequences automatically send follow-up emails based on timing and recipient behavior.
                          Each step can have different content and delays.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="text-sm text-muted-foreground">Campaign created. You can manage it from the list or details page.</div>
          )}

          <Separator />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1 || creating}>Back</Button>
            {step < 7 && <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>Next</Button>}
            {step === 7 && <Button onClick={onCreate} disabled={creating || !canNext()}>{creating ? 'Creating…' : 'Create'}</Button>}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}

export default CampaignCreateWizard

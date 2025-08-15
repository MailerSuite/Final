import React, { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Copy, RefreshCw, TestTube, Webhook, Shield, Clock, RotateCcw } from 'lucide-react'
import { toast } from '@/hooks/useToast'

const webhookEventTypes = [
  { id: 'campaign.created', label: 'Campaign Created', description: 'Triggered when a new campaign is created' },
  { id: 'campaign.started', label: 'Campaign Started', description: 'Triggered when a campaign begins execution' },
  { id: 'campaign.completed', label: 'Campaign Completed', description: 'Triggered when a campaign finishes' },
  { id: 'campaign.paused', label: 'Campaign Paused', description: 'Triggered when a campaign is paused' },
  { id: 'email.sent', label: 'Email Sent', description: 'Triggered when an email is successfully sent' },
  { id: 'email.bounced', label: 'Email Bounced', description: 'Triggered when an email bounces' },
  { id: 'email.opened', label: 'Email Opened', description: 'Triggered when a recipient opens an email' },
  { id: 'email.clicked', label: 'Email Clicked', description: 'Triggered when a recipient clicks a link' },
  { id: 'lead.created', label: 'Lead Created', description: 'Triggered when a new lead is added' },
  { id: 'lead.updated', label: 'Lead Updated', description: 'Triggered when lead information is modified' },
  { id: 'smtp.failed', label: 'SMTP Failed', description: 'Triggered when SMTP connection fails' },
  { id: 'imap.failed', label: 'IMAP Failed', description: 'Triggered when IMAP connection fails' },
]

const webhookFormSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL' }),
  events: z.array(z.string()).min(1, { message: 'Select at least one event' }),
  secret: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  retry_count: z.number().min(0).max(10).default(3),
  timeout_seconds: z.number().min(1).max(300).default(30),
})

type WebhookFormData = z.infer<typeof webhookFormSchema>

interface WebhookFormProps {
  webhook?: Partial<WebhookFormData & { id: string }>
  onSubmit: (data: WebhookFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  mode?: 'create' | 'edit'
}

export default function WebhookForm({ 
  webhook, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  mode = 'create' 
}: WebhookFormProps) {
  const [showSecret, setShowSecret] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [lastTestResult, setLastTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const form = useForm<WebhookFormData>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      url: webhook?.url || '',
      events: webhook?.events || [],
      secret: webhook?.secret || '',
      description: webhook?.description || '',
      is_active: webhook?.is_active ?? true,
      retry_count: webhook?.retry_count ?? 3,
      timeout_seconds: webhook?.timeout_seconds ?? 30,
    },
  })

  const generateSecret = () => {
    const secret = `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    form.setValue('secret', secret)
    toast.success?.('New secret generated')
  }

  const copySecret = () => {
    const secret = form.getValues('secret')
    if (secret) {
      navigator.clipboard.writeText(secret)
      toast.success?.('Secret copied to clipboard')
    }
  }

  const testWebhook = async () => {
    const url = form.getValues('url')
    if (!url) {
      toast.error?.('Please enter a webhook URL first')
      return
    }

    setTestingWebhook(true)
    try {
      // Mock test - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      const success = Math.random() > 0.3 // 70% success rate for demo
      
      setLastTestResult({
        success,
        message: success 
          ? 'Webhook endpoint responded successfully (200 OK)'
          : 'Webhook endpoint failed to respond (timeout or error)'
      })
      
      if (success) {
        toast.success?.('Webhook test successful')
      } else {
        toast.error?.('Webhook test failed')
      }
    } catch (error) {
      setLastTestResult({
        success: false,
        message: 'Test failed: Network error or invalid URL'
      })
      toast.error?.('Webhook test failed')
    } finally {
      setTestingWebhook(false)
    }
  }

  const handleSubmit = async (data: WebhookFormData) => {
    try {
      await onSubmit(data)
      toast.success?.(mode === 'create' ? 'Webhook created successfully' : 'Webhook updated successfully')
    } catch (error) {
      toast.error?.(`Failed to ${mode} webhook`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Webhook className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">
            {mode === 'create' ? 'Create Webhook' : 'Edit Webhook'}
          </h2>
          <p className="text-muted-foreground">
            {mode === 'create' 
              ? 'Set up a new webhook endpoint to receive event notifications'
              : 'Update webhook configuration and event subscriptions'
            }
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Basic Configuration
              </CardTitle>
              <CardDescription>
                Configure the webhook endpoint and basic settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook URL *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          placeholder="https://your-app.com/webhooks/sgpt" 
                          {...field} 
                          className="flex-1"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={testWebhook}
                        disabled={testingWebhook || !field.value}
                        className="shrink-0"
                      >
                        {testingWebhook ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <TestTube className="w-4 h-4" />
                        )}
                        Test
                      </Button>
                    </div>
                    <FormDescription>
                      The URL where webhook events will be sent. Must be HTTPS for production.
                    </FormDescription>
                    <FormMessage />
                    
                    {lastTestResult && (
                      <Alert className={lastTestResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                        <AlertDescription className={lastTestResult.success ? 'text-green-800' : 'text-red-800'}>
                          {lastTestResult.message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Main application webhook for campaign events"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description to help identify this webhook
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Webhook</FormLabel>
                      <FormDescription>
                        When disabled, no events will be sent to this endpoint
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security
              </CardTitle>
              <CardDescription>
                Configure webhook security and verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook Secret</FormLabel>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <FormControl>
                          <Input 
                            type={showSecret ? 'text' : 'password'}
                            placeholder="Auto-generated secret for webhook verification"
                            {...field} 
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                          onClick={() => setShowSecret(!showSecret)}
                        >
                          {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateSecret}
                        className="shrink-0"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Generate
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={copySecret}
                        disabled={!field.value}
                        className="shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <FormDescription>
                      Used to verify webhook authenticity. Include this in your webhook verification logic.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Event Subscription */}
          <Card>
            <CardHeader>
              <CardTitle>Event Subscription</CardTitle>
              <CardDescription>
                Select which events should trigger this webhook
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="events"
                render={() => (
                  <FormItem>
                    <FormLabel>Events to Subscribe *</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {webhookEventTypes.map((event) => (
                        <FormField
                          key={event.id}
                          control={form.control}
                          name="events"
                          render={({ field }) => {
                            const isChecked = field.value?.includes(event.id)
                            return (
                              <FormItem
                                key={event.id}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      const currentEvents = field.value || []
                                      if (checked) {
                                        field.onChange([...currentEvents, event.id])
                                      } else {
                                        field.onChange(currentEvents.filter((e) => e !== event.id))
                                      }
                                    }}
                                  />
                                </FormControl>
                                <div className="grid gap-1.5 leading-none">
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    {event.label}
                                  </FormLabel>
                                  <p className="text-xs text-muted-foreground">
                                    {event.description}
                                  </p>
                                </div>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormDescription>
                      Select one or more events that will trigger this webhook
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Configure retry behavior and timeout settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timeout_seconds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeout (seconds)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min={1}
                          max={300}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        How long to wait for a response (1-300 seconds)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="retry_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retry Count</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min={0}
                          max={10}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of retry attempts on failure (0-10)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : mode === 'create' ? (
                <>Create Webhook</>
              ) : (
                <>Update Webhook</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
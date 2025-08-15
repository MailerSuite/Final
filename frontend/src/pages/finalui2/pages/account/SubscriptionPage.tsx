import React from 'react'
import useSWR from 'swr'
import axios from '@/http/axios'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

const fetcher = (url: string) => axios.get(url).then(r => r.data)

export default function SubscriptionPage() {
  const { data, mutate, isLoading } = useSWR('/api/v1/subscription/me', fetcher)
  const { data: plansData } = useSWR('/api/v1/plans/', fetcher)

  const current = data?.subscription
  const usage = data?.usage

  const cancel = async () => {
    try {
      await axios.post('/api/v1/subscription/me/cancel')
      toast.success('Cancellation scheduled at period end')
      mutate()
    } catch (e: unknown) {
      toast.error(e?.response?.data?.detail ?? 'Failed to cancel')
    }
  }

  const uncancel = async () => {
    try {
      await axios.post('/api/v1/subscription/me/uncancel')
      toast.success('Cancellation removed')
      mutate()
    } catch (e: unknown) {
      toast.error(e?.response?.data?.detail ?? 'Failed to undo cancel')
    }
  }

  const upgrade = async (plan_code: string) => {
    try {
      await axios.post('/api/v1/subscription/me/upgrade', { plan_code })
      toast.success('Plan updated')
      mutate()
    } catch (e: unknown) {
      toast.error(e?.response?.data?.detail ?? 'Failed to upgrade')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        {!current ? (
          <div className="space-y-6">
            <div>
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-56 mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded border p-3">
                  <Skeleton className="h-4 w-28 mb-2" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-60" />
              <Skeleton className="h-9 w-48" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="text-sm text-muted-foreground">Current plan</div>
              <div className="text-lg font-medium">{current.plan_name} ({current.plan_code})</div>
              {current.renews_at && (
                <div className="text-sm text-muted-foreground">Renews at {new Date(current.renews_at).toLocaleString()}</div>
              )}
              {current.cancel_at_period_end && (
                <div className="text-sm text-amber-600">Cancellation scheduled at period end</div>
              )}
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-2">Usage</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded border p-3">
                  <div className="text-muted-foreground">Emails this month</div>
                  <div className="text-lg font-medium">{usage?.emails_sent_month ?? 0}</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-muted-foreground">API calls today</div>
                  <div className="text-lg font-medium">{usage?.api_calls_day ?? 0}</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-muted-foreground">Max threads</div>
                  <div className="text-lg font-medium">{usage?.threads_max ?? 0}</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-muted-foreground">Peak threads used</div>
                  <div className="text-lg font-medium">{usage?.threads_used_peak ?? 0}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select onValueChange={upgrade}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="Change plan" />
                </SelectTrigger>
                <SelectContent>
                  {!plansData ? (
                    <div className="p-2">
                      <Skeleton className="h-6 w-40" />
                    </div>
                  ) : (
                    (plansData || []).map((p: unknown) => (
                      <SelectItem value={p.code} key={p.code}>{p.name} - ${p.price_per_month ?? p.price}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!current.cancel_at_period_end ? (
                <Button variant="destructive" onClick={cancel} disabled={isLoading || current.plan_code === 'free'}>
                  Cancel at period end
                </Button>
              ) : (
                <Button variant="outline" onClick={uncancel} disabled={isLoading}>
                  Undo cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

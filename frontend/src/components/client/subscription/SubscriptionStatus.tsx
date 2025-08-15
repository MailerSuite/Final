/**
 * Subscription Status Components
 * Displays current plan, usage, and upgrade options
 */

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Crown, 
  Zap, 
  TrendingUp, 
  AlertCircle, 
  ChevronRight,
  BarChart3,
  Infinity as InfinityIcon,
  Shield,
  Star,
  Clock,
  Check,
  X
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '../ui/dialog'
import { usePlan } from '../../hooks/usePlan'
import { planService } from '../../services/plan-service'
import { cn } from '../../lib/utils'
import { formatDistanceToNow } from 'date-fns'

// Plan tier configuration
const PLAN_CONFIGS = {
  basic: {
    icon: Zap,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    borderColor: 'border-border',
    description: 'Essential features for getting started'
  },
  premium: {
    icon: Star,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    description: 'Advanced features for professionals'
  },
  deluxe: {
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    description: 'Unlimited power for serious users'
  },
  enterprise: {
    icon: Shield,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    description: 'Custom solutions for teams'
  }
} as const

// Subscription Status Card
export function SubscriptionStatusCard({ className }: { className?: string }) {
  const { userPlan, upgradeInfo, isLoading, error } = usePlan()
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  if (error || !userPlan) {
    return (
      <Card className={cn("border-red-200", className)}>
        <CardHeader>
          <CardTitle className="text-red-600">Subscription Error</CardTitle>
          <CardDescription>Unable to load subscription information</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const planConfig = PLAN_CONFIGS[userPlan.code as keyof typeof PLAN_CONFIGS]
  const Icon = planConfig?.icon || Zap

  return (
    <Card className={cn(planConfig?.borderColor, className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", planConfig?.bgColor)}>
              <Icon className={cn("h-5 w-5", planConfig?.color)} />
            </div>
            <div>
              <CardTitle className="text-lg">{userPlan.display_name}</CardTitle>
              <CardDescription>{planConfig?.description}</CardDescription>
            </div>
          </div>
          {upgradeInfo && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowUpgradeDialog(true)}
              className="ml-4"
            >
              Upgrade
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Billing cycle */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Billing cycle</span>
          <span className="font-medium">{userPlan.billing_cycle}</span>
        </div>

        {/* Next billing date */}
        {userPlan.next_billing_date && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Next billing</span>
            <span className="font-medium">
              {formatDistanceToNow(new Date(userPlan.next_billing_date), { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Usage summary */}
        <div className="pt-2 border-t">
          <UsageQuickView planId={userPlan.id} />
        </div>

        {/* Upgrade dialog */}
        <UpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          currentPlan={userPlan}
          upgradeInfo={upgradeInfo}
        />
      </CardContent>
    </Card>
  )
}

// Usage Quick View
function UsageQuickView({ planId }: { planId: string }) {
  const { data: usage, isLoading } = useQuery({
    queryKey: ['planUsage', planId],
    queryFn: () => planService.getUsage(),
    staleTime: 60 * 1000 // 1 minute
  })

  if (isLoading || !usage) {
    return <div className="h-8 bg-muted rounded animate-pulse"></div>
  }

  const primaryMetric = usage.metrics[0]
  if (!primaryMetric) return null

  const percentage = primaryMetric.limit === null 
    ? 0 
    : (primaryMetric.used / primaryMetric.limit) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{primaryMetric.name}</span>
        <span className="font-medium">
          {primaryMetric.used.toLocaleString()}
          {primaryMetric.limit !== null && ` / ${primaryMetric.limit.toLocaleString()}`}
          {primaryMetric.limit === null && ' (Unlimited)'}
        </span>
      </div>
      {primaryMetric.limit !== null && (
        <Progress value={percentage} className="h-2" />
      )}
    </div>
  )
}

// Detailed Usage Component
export function SubscriptionUsage({ className }: { className?: string }) {
  const { userPlan } = usePlan()
  const { data: usage, isLoading, error } = useQuery({
    queryKey: ['planUsage', userPlan?.id],
    queryFn: () => planService.getUsage(),
    staleTime: 60 * 1000,
    enabled: !!userPlan
  })

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-5 bg-gray-200 rounded w-1/4"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error || !usage || !userPlan) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Usage Error</AlertTitle>
        <AlertDescription>Unable to load usage information</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Usage Overview</CardTitle>
        <CardDescription>
          Current billing period: {new Date(usage.period_start).toLocaleDateString()} - {new Date(usage.period_end).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {usage.metrics.map((metric: unknown) => (
            <UsageMetric key={metric.metric_id} metric={metric} />
          ))}
        </div>

        {usage.warnings && usage.warnings.length > 0 && (
          <div className="mt-6 space-y-2">
            {usage.warnings.map((warning: unknown, idx: number) => (
              <Alert key={idx} variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Individual Usage Metric
function UsageMetric({ metric }: { metric: unknown }) {
  const percentage = metric.limit === null ? 0 : (metric.used / metric.limit) * 100
  const isNearLimit = percentage > 80
  const isOverLimit = percentage > 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{metric.name}</span>
          {metric.description && (
            <span className="text-sm text-muted-foreground">({metric.description})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium",
            isOverLimit && "text-red-600",
            isNearLimit && !isOverLimit && "text-orange-600"
          )}>
            {metric.used.toLocaleString()}
            {metric.limit !== null ? ` / ${metric.limit.toLocaleString()}` : ''}
          </span>
          {metric.limit === null && (
            <Badge variant="secondary" className="text-xs">
              <InfinityIcon className="h-3 w-3 mr-1" />
              Unlimited
            </Badge>
          )}
        </div>
      </div>

      {metric.limit !== null && (
        <div className="space-y-1">
          <Progress 
            value={Math.min(percentage, 100)} 
            className={cn(
              "h-2",
              isOverLimit && "bg-red-100",
              isNearLimit && !isOverLimit && "bg-orange-100"
            )}
          />
          {isNearLimit && (
            <p className="text-xs text-orange-600">
              {isOverLimit 
                ? `${(percentage - 100).toFixed(1)}% over limit`
                : `${(100 - percentage).toFixed(1)}% remaining`
              }
            </p>
          )}
        </div>
      )}

      {metric.reset_period && (
        <p className="text-xs text-muted-foreground">
          Resets {metric.reset_period}
        </p>
      )}
    </div>
  )
}

// Feature Comparison Component
export function FeatureComparison({ currentPlanCode }: { currentPlanCode: string }) {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['availablePlans'],
    queryFn: () => planService.getAvailablePlans(),
    staleTime: 10 * 60 * 1000 // 10 minutes
  })

  if (isLoading || !plans) {
    return <div className="animate-pulse h-64 bg-muted rounded"></div>
  }

  const features = Array.from(
    new Set(plans.flatMap((plan: unknown) => plan.features))
  ).sort()

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Feature</th>
            {plans.map((plan: unknown) => (
              <th key={plan.code} className="text-center p-4 min-w-[120px]">
                <div className="flex flex-col items-center gap-1">
                  <span className={cn(
                    "font-semibold",
                    plan.code === currentPlanCode && "text-primary"
                  )}>
                    {plan.display_name}
                  </span>
                  {plan.code === currentPlanCode && (
            <Badge variant="secondary" className="text-xs" aria-label="Current plan">Current</Badge>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature, idx) => (
            <tr key={feature as string} className={cn(
              "border-b",
              idx % 2 === 0 && "bg-muted"
            )}>
              <td className="p-4 text-sm">{feature}</td>
              {plans.map((plan: unknown) => (
                <td key={plan.code} className="text-center p-4">
                  {plan.features.includes(feature) ? (
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                  )}
                </td>
              ))}
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="p-4">Price</td>
            {plans.map((plan: unknown) => (
              <td key={plan.code} className="text-center p-4">
                ${plan.price_monthly}/mo
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// Upgrade Dialog
function UpgradeDialog({ 
  open, 
  onOpenChange, 
  currentPlan, 
  upgradeInfo 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlan: unknown
  upgradeInfo: unknown
}) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isUpgrading, setIsUpgrading] = useState(false)

  const handleUpgrade = async () => {
    if (!selectedPlan) return

    setIsUpgrading(true)
    try {
      // Navigate to payment page or handle upgrade
      window.location.href = `/checkout?plan=${selectedPlan}&from=${currentPlan.code}`
    } catch (error) {
      console.error('Upgrade failed:', error)
    } finally {
      setIsUpgrading(false)
    }
  }

  if (!upgradeInfo) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          <DialogDescription>
            Choose a plan that best fits your needs
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="comparison" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comparison">Feature Comparison</TabsTrigger>
            <TabsTrigger value="pricing">Pricing Details</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="mt-6">
            <FeatureComparison currentPlanCode={currentPlan.code} />
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upgradeInfo.available_plans.map((plan: unknown) => (
                <Card 
                  key={plan.code}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedPlan === plan.code && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedPlan(plan.code)}
                >
                  <CardHeader>
                    <CardTitle>{plan.display_name}</CardTitle>
                    <CardDescription>${plan.price_monthly}/month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {plan.highlights.slice(0, 5).map((highlight: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpgrade} 
            disabled={!selectedPlan || isUpgrading}
          >
            {isUpgrading ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Subscription Alert Banner
export function SubscriptionAlertBanner() {
  const { userPlan, usageWarnings } = usePlan()
  const [dismissed, setDismissed] = useState(false)

  if (!userPlan || !usageWarnings.length || dismissed) {
    return null
  }

  const severity = usageWarnings.some(w => w.includes('exceeded')) ? 'destructive' : 'warning'

  return (
    <Alert variant={severity} className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Subscription Notice</AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1 mt-2">
          {usageWarnings.map((warning, idx) => (
            <li key={idx}>{warning}</li>
          ))}
        </ul>
      </AlertDescription>
      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="default" onClick={() => window.location.href = '/settings/subscription'}>
          View Details
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      </div>
    </Alert>
  )
} 
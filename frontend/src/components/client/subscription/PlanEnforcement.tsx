/**
 * Plan Enforcement Components
 * Restricts access to features based on subscription level
 */

import React, { ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { 
  Lock, 
  Crown, 
  Zap, 
  AlertCircle, 
  ChevronRight,
  Star,
  Shield,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Badge } from '../ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle 
} from '../ui/dialog'
import { usePlan, useFeatureAccess, usePlanTier } from '../../hooks/usePlan'
import { cn } from '../../lib/utils'

// Feature Gate Component
interface FeatureGateProps {
  feature?: string
  plan?: string
  children: ReactNode
  fallback?: ReactNode
  showUpgradePrompt?: boolean
  redirectTo?: string
  soft?: boolean // If true, shows content with overlay instead of blocking
}

export function FeatureGate({
  feature,
  plan,
  children,
  fallback,
  showUpgradePrompt = true,
  redirectTo,
  soft = false
}: FeatureGateProps) {
  const { userPlan, hasFeature, isAtLeastPlan, isLoading } = usePlan()
  const [showDialog, setShowDialog] = useState(false)

  // Check access
  const hasAccess = feature 
    ? hasFeature(feature) 
    : plan 
    ? isAtLeastPlan(plan)
    : true

  // Handle loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    )
  }

  // Redirect if specified and no access
  if (!hasAccess && redirectTo) {
    return <Navigate to={redirectTo} replace />
  }

  // Show fallback if provided and no access
  if (!hasAccess && fallback) {
    return <>{fallback}</>
  }

  // Show upgrade prompt
  if (!hasAccess && showUpgradePrompt) {
    return (
      <>
        <LockedFeature
          feature={feature}
          requiredPlan={plan}
          currentPlan={userPlan?.code}
          onUpgradeClick={() => setShowDialog(true)}
          soft={soft}
        >
          {soft ? children : null}
        </LockedFeature>
        
        <UpgradePromptDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          feature={feature}
          requiredPlan={plan}
          currentPlan={userPlan}
        />
      </>
    )
  }

  // Grant access
  return <>{children}</>
}

// Locked Feature Display
function LockedFeature({
  feature,
  requiredPlan,
  currentPlan,
  onUpgradeClick,
  soft,
  children
}: {
  feature?: string
  requiredPlan?: string
  currentPlan?: string
  onUpgradeClick: () => void
  soft: boolean
  children?: ReactNode
}) {
  const getPlanIcon = (plan?: string) => {
    switch (plan) {
      case 'premium': return Star
      case 'deluxe': return Crown
      case 'enterprise': return Shield
      default: return Zap
    }
  }

  const Icon = getPlanIcon(requiredPlan)

  if (soft) {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 bg-white/80 dark:bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-2">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Premium Feature</CardTitle>
              <CardDescription>
                {feature 
                  ? `"${feature}" requires ${requiredPlan || 'an upgraded'} plan`
                  : `This feature requires the ${requiredPlan} plan`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={onUpgradeClick} 
                className="w-full"
                size="lg"
              >
                <Icon className="h-4 w-4 mr-2" />
                Upgrade to {requiredPlan}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto p-4 bg-muted dark:bg-card rounded-full w-fit mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle>Feature Locked</CardTitle>
        <CardDescription className="max-w-sm mx-auto">
          {feature 
            ? `Access "${feature}" by upgrading to ${requiredPlan || 'a higher'} plan`
            : `Upgrade to the ${requiredPlan} plan to unlock this feature`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">Your current plan</p>
          <Badge variant="secondary" className="text-base">
            {currentPlan || 'Basic'}
          </Badge>
        </div>
        
        <Button 
          onClick={onUpgradeClick}
          size="lg"
          className="w-full max-w-xs"
        >
          <Icon className="h-4 w-4 mr-2" />
          Upgrade Now
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
        
        <p className="text-xs text-muted-foreground mt-4">
          Unlock advanced features and increase your limits
        </p>
      </CardContent>
    </Card>
  )
}

// Plan Required Alert
export function PlanRequiredAlert({
  feature,
  plan,
  className,
  onUpgrade
}: {
  feature?: string
  plan?: string
  className?: string
  onUpgrade?: () => void
}) {
  return (
    <Alert variant="default" className={cn("border-orange-200 bg-orange-50", className)}>
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">Upgrade Required</AlertTitle>
      <AlertDescription className="text-orange-700">
        {feature 
          ? `The "${feature}" feature requires ${plan || 'an upgraded'} plan.`
          : `This action requires the ${plan} plan.`
        }
      </AlertDescription>
      {onUpgrade && (
        <Button 
          size="sm" 
          variant="outline" 
          className="mt-3 border-orange-300 hover:bg-orange-100"
          onClick={onUpgrade}
        >
          View Plans
        </Button>
      )}
    </Alert>
  )
}

// Upgrade Prompt Dialog
function UpgradePromptDialog({
  open,
  onOpenChange,
  feature,
  requiredPlan,
  currentPlan
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature?: string
  requiredPlan?: string
  currentPlan: unknown
}) {
  const benefits = {
    premium: [
      '5x more AI calls per day',
      'Priority support',
      'Advanced analytics',
      'Custom integrations',
      'Team collaboration'
    ],
    deluxe: [
      'Unlimited AI calls',
      'White-glove support',
      'Custom AI models',
      'API access',
      'Advanced security features'
    ],
    enterprise: [
      'Everything in Deluxe',
      'Dedicated account manager',
      'Custom contracts',
      'On-premise deployment',
      'SLA guarantees'
    ]
  }

  const planBenefits = benefits[requiredPlan as keyof typeof benefits] || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Unlock {feature || 'Premium Features'}
          </DialogTitle>
          <DialogDescription>
            Upgrade to {requiredPlan} to access this feature and much more
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Plan</CardTitle>
              <CardDescription>{currentPlan?.display_name || 'Basic'}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {currentPlan?.highlights?.slice(0, 5).map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Upgrade Plan */}
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg capitalize">{requiredPlan} Plan</CardTitle>
                <Badge>Recommended</Badge>
              </div>
              <CardDescription>Everything in current plan, plus:</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {planBenefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-primary mt-0.5" />
                    <span className="font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mt-6 p-4 bg-muted dark:bg-background rounded-lg">
          <div>
            <p className="font-semibold">Ready to upgrade?</p>
            <p className="text-sm text-muted-foreground">
              Get instant access to all features
            </p>
          </div>
          <Button 
            size="lg"
            onClick={() => window.location.href = `/pricing?upgrade=${requiredPlan}&feature=${feature}`}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Upgrade Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// HOC for plan enforcement
export function withPlanEnforcement<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<FeatureGateProps, 'children'>
) {
  const EnforcedComponent = (props: P) => (
    <FeatureGate {...options}>
      <Component {...props} />
    </FeatureGate>
  )

  EnforcedComponent.displayName = `withPlanEnforcement(${Component.displayName || Component.name})`

  return EnforcedComponent
}

// Usage limit warning component
export function UsageLimitWarning({ 
  metric, 
  current, 
  limit,
  className 
}: { 
  metric: string
  current: number
  limit: number
  className?: string
}) {
  const percentage = (current / limit) * 100
  const isNearLimit = percentage > 80
  const isAtLimit = percentage >= 100

  if (percentage < 80) return null

  return (
    <Alert 
      variant={isAtLimit ? "destructive" : "warning"} 
      className={className}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {isAtLimit ? 'Limit Reached' : 'Approaching Limit'}
      </AlertTitle>
      <AlertDescription>
        You've used {current} of {limit} {metric} ({percentage.toFixed(0)}%)
        {isAtLimit && '. Upgrade your plan to continue.'}
      </AlertDescription>
      {isAtLimit && (
        <Button 
          size="sm" 
          variant="outline" 
          className="mt-2"
          onClick={() => window.location.href = '/pricing'}
        >
          Upgrade Plan
        </Button>
      )}
    </Alert>
  )
} 
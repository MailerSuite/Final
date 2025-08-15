/**
 * PlanGate Component
 * Controls access to features based on user's plan
 */

import React, { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown, Lock, Zap, AlertTriangle, Info } from 'lucide-react'
import { usePlan, useFeatureAccess, useFeaturesAccess, usePlanTier } from '@/hooks/usePlan'
import { cn } from '@/lib/utils'

interface PlanGateProps {
  feature?: string
  features?: string[]
  requireAll?: boolean
  planTier?: string
  children: ReactNode
  fallback?: ReactNode
  showUpgradePrompt?: boolean
  variant?: 'default' | 'card' | 'inline' | 'minimal'
  className?: string
}

export function PlanGate({ 
  feature,
  features,
  requireAll = true,
  planTier,
  children, 
  fallback, 
  showUpgradePrompt = true,
  variant = 'default',
  className
}: PlanGateProps) {
  const { userPlan, upgradeInfo, isLoading } = usePlan()
  
  // Determine which hook to use based on props
  let hasAccess = false
  let loadingState = isLoading
  
  if (feature) {
    const featureAccess = useFeatureAccess(feature)
    hasAccess = featureAccess.hasAccess
    loadingState = featureAccess.isLoading
  } else if (features) {
    const featuresAccess = useFeaturesAccess(features, requireAll)
    hasAccess = featuresAccess.hasAccess
    loadingState = featuresAccess.isLoading
  } else if (planTier) {
    const tierAccess = usePlanTier(planTier)
    hasAccess = tierAccess.hasAccess
    loadingState = tierAccess.isLoading
  }

  // Show loading state
  if (loadingState) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="bg-gray-200 h-8 rounded-md" />
      </div>
    )
  }

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>
  }

  // If no upgrade prompt requested, return nothing
  if (!showUpgradePrompt) {
    return null
  }

  // Determine what feature/plan is required
  const requiredFeature = feature || features?.[0] || planTier
  const featureDisplayName = getFeatureDisplayName(requiredFeature)
  const suggestedPlan = upgradeInfo?.suggestedPlan || 'Premium'

  // Render upgrade prompt based on variant
  switch (variant) {
    case 'card':
      return <UpgradeCard 
        featureDisplayName={featureDisplayName}
        suggestedPlan={suggestedPlan}
        upgradeInfo={upgradeInfo}
        className={className}
      />
    
    case 'inline':
      return <InlineUpgradePrompt 
        featureDisplayName={featureDisplayName}
        suggestedPlan={suggestedPlan}
        className={className}
      />
    
    case 'minimal':
      return <MinimalUpgradePrompt 
        suggestedPlan={suggestedPlan}
        className={className}
      />
    
    default:
      return <DefaultUpgradePrompt 
        featureDisplayName={featureDisplayName}
        suggestedPlan={suggestedPlan}
        upgradeInfo={upgradeInfo}
        className={className}
      />
  }
}

// Upgrade prompt variants
function DefaultUpgradePrompt({ 
  featureDisplayName, 
  suggestedPlan, 
  upgradeInfo,
  className 
}: {
  featureDisplayName: string
  suggestedPlan: string
  upgradeInfo: any
  className?: string
}) {
  return (
    <div className={cn(
      "relative p-4 border border-dashed border-border rounded-lg bg-muted dark:bg-background dark:border-border",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground dark:text-gray-100">
              {featureDisplayName} requires {suggestedPlan}
            </p>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
              {upgradeInfo?.benefit || `Upgrade to access this feature`}
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="ml-4">
          <Crown className="h-3 w-3 mr-1" />
          Upgrade
        </Button>
      </div>
    </div>
  )
}

function UpgradeCard({ 
  featureDisplayName, 
  suggestedPlan, 
  upgradeInfo,
  className 
}: {
  featureDisplayName: string
  suggestedPlan: string
  upgradeInfo: any
  className?: string
}) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-lg">Unlock {featureDisplayName}</CardTitle>
        </div>
        <CardDescription>
          This feature is available with {suggestedPlan} plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            {upgradeInfo?.benefit}
          </p>
          {upgradeInfo?.features && (
            <ul className="text-xs space-y-1">
              {upgradeInfo.features.slice(0, 3).map((feat: string, idx: number) => (
                <li key={idx} className="flex items-center space-x-2">
                  <Zap className="h-3 w-3 text-blue-500" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between pt-2">
            <Badge variant="outline">{upgradeInfo?.price}</Badge>
            <Button size="sm">
              <Crown className="h-3 w-3 mr-1" />
              Upgrade Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function InlineUpgradePrompt({ 
  featureDisplayName, 
  suggestedPlan,
  className 
}: {
  featureDisplayName: string
  suggestedPlan: string
  className?: string
}) {
  return (
    <div className={cn(
      "inline-flex items-center space-x-2 px-3 py-1 text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md border border-yellow-200 dark:border-yellow-800",
      className
    )}>
      <Lock className="h-3 w-3" />
      <span>{featureDisplayName} requires {suggestedPlan}</span>
      <Button size="sm" variant="link" className="h-auto p-0 text-xs text-yellow-700 dark:text-yellow-300">
        Upgrade
      </Button>
    </div>
  )
}

function MinimalUpgradePrompt({ 
  suggestedPlan,
  className 
}: {
  suggestedPlan: string
  className?: string
}) {
  return (
    <Button 
      size="sm" 
      variant="outline" 
      className={cn("text-xs", className)}
    >
      <Crown className="h-3 w-3 mr-1" />
      {suggestedPlan}
    </Button>
  )
}

// Feature display name mapping
function getFeatureDisplayName(feature?: string): string {
  const displayNames: Record<string, string> = {
    // AI Features
    'ai_subject_generation': 'AI Subject Lines',
    'ai_content_optimization': 'AI Content Optimization',
    'ai_campaign_analysis': 'AI Campaign Analysis',
    'ai_send_optimization': 'AI Send Time Optimization',
    'ai_template_generation': 'AI Template Generation',
    'ai_segmentation': 'AI Segmentation',
    'ai_deliverability': 'AI Deliverability Insights',
    'ai_automation_suggestions': 'AI Automation Suggestions',
    
    // Automation
    'automation_workflows': 'Automation Workflows',
    
    // Performance
    'performance_testing': 'Performance Testing',
    
    // Security
    'advanced_security': 'Advanced Security',
    'socks_stream': 'SOCKS Proxies',
    
    // Management
    'bounce_management': 'Bounce Management',
    'unsubscribe_management': 'Unsubscribe Management',
    'leads_management': 'Lead Management',
    
    // Admin
    'admin_functions': 'Admin Dashboard',
    'plan_management': 'Plan Management',
    'system_administration': 'System Administration',
    
    // Plan tiers
    'premium': 'Premium Plan',
    'deluxe': 'Deluxe Plan', 
    'enterprise': 'Enterprise Plan'
  }
  
  return displayNames[feature || ''] || 'Premium Feature'
}

// Usage warnings component
export function PlanUsageWarnings() {
  const { usageWarnings, userPlan } = usePlan()
  
  if (!usageWarnings.length) return null
  
  return (
    <div className="space-y-2">
      {usageWarnings.map((warning, index) => (
        <div 
          key={index}
          className="flex items-center space-x-2 p-2 text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md border border-yellow-200 dark:border-yellow-800"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>{warning}</span>
        </div>
      ))}
    </div>
  )
}

// Plan status indicator
export function PlanStatusIndicator() {
  const { userPlan, isLoading } = usePlan()
  
  if (isLoading) return null
  
  const planColors = {
    basic: 'bg-muted text-foreground dark:bg-card dark:text-foreground',
    premium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    deluxe: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    enterprise: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  }
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-xs",
        planColors[userPlan?.code as keyof typeof planColors] || planColors.basic
      )}
    >
      <Crown className="h-3 w-3 mr-1" />
      {userPlan?.name || 'Basic'}
    </Badge>
  )
} 
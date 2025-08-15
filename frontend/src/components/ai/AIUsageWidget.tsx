/**
 * AI Usage Widget Component
 * Displays AI quota usage and remaining credits
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw,
  Crown,
  Sparkles
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { aiMailingApi, AIUsageStats } from '@/api/ai-mailing-api'

interface AIUsageWidgetProps {
  className?: string
  compact?: boolean
  showUpgrade?: boolean
}

export const AIUsageWidget: React.FC<AIUsageWidgetProps> = ({
  className = '',
  compact = false,
  showUpgrade = true
}) => {
  const [usageStats, setUsageStats] = useState<AIUsageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchUsageStats = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const response = await aiMailingApi.getUsageStats()
      if (response.success) {
        setUsageStats(response)
      } else {
        throw new Error(response.error || 'Failed to fetch usage stats')
      }
    } catch (error: unknown) {
      console.error('Error fetching AI usage stats:', error)
      toast({
        title: "Failed to load AI usage",
        description: "Could not fetch your current AI usage statistics.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUsageStats()
  }, [])

  const getPlanBadgeVariant = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'basic': return 'secondary' as const
      case 'premium': return 'default' as const
      case 'deluxe': return 'default' as const
      case 'team': return 'default' as const
      case 'lifetime': return 'default' as const
      default: return 'secondary' as const
    }
  }

  const getPlanIcon = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'basic': return Brain
      case 'premium': return Sparkles
      case 'deluxe': 
      case 'team':
      case 'lifetime': return Crown
      default: return Brain
    }
  }

  const calculateUsagePercentage = (used: number, limit: number | string) => {
    if (limit === "unlimited" || typeof limit !== 'number') return 0
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Loading AI usage...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!usageStats?.success || !usageStats.plan || !usageStats.usage) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">AI usage unavailable</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { plan, usage } = usageStats
  const PlanIcon = getPlanIcon(plan.name)
  
  const dailyPercentage = calculateUsagePercentage(
    usage.daily_calls, 
    plan.max_ai_calls_daily || "unlimited"
  )
  
  const monthlyPercentage = calculateUsagePercentage(
    usage.monthly_tokens, 
    plan.max_ai_tokens_monthly || "unlimited"
  )

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlanIcon className="h-4 w-4 text-purple-600" />
              <Badge variant={getPlanBadgeVariant(plan.name)}>
                {plan.name}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={getUsageColor(dailyPercentage)}>
                {usage.daily_calls}/{plan.max_ai_calls_daily || '∞'}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fetchUsageStats(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlanIcon className="h-5 w-5 text-purple-600" />
            <span>AI Usage</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getPlanBadgeVariant(plan.name)}>
              {plan.name}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fetchUsageStats(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily Calls Usage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Daily AI Calls</span>
            <span className={`text-sm font-semibold ${getUsageColor(dailyPercentage)}`}>
              {usage.daily_calls} / {plan.max_ai_calls_daily || '∞'}
            </span>
          </div>
          {plan.max_ai_calls_daily && (
            <Progress 
              value={dailyPercentage} 
              className="h-2"
            />
          )}
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">
              {usage.daily_remaining === "unlimited" ? "Unlimited" : `${usage.daily_remaining} remaining`}
            </span>
            {dailyPercentage >= 90 && (
              <span className="text-xs text-red-600 font-medium">
                Limit reached
              </span>
            )}
          </div>
        </div>

        {/* Monthly Tokens Usage */}
        {plan.max_ai_tokens_monthly && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Monthly Tokens</span>
              <span className={`text-sm font-semibold ${getUsageColor(monthlyPercentage)}`}>
                {usage.monthly_tokens.toLocaleString()} / {plan.max_ai_tokens_monthly?.toLocaleString() || '∞'}
              </span>
            </div>
            <Progress 
              value={monthlyPercentage} 
              className="h-2"
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-muted-foreground">
                {typeof usage.monthly_tokens_remaining === 'number' 
                  ? `${usage.monthly_tokens_remaining.toLocaleString()} remaining`
                  : "Unlimited"
                }
              </span>
              {monthlyPercentage >= 90 && (
                <span className="text-xs text-red-600 font-medium">
                  Limit reached
                </span>
              )}
            </div>
          </div>
        )}

        {/* Upgrade CTA */}
        {showUpgrade && (dailyPercentage >= 75 || monthlyPercentage >= 75) && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">
                Running low on AI credits
              </span>
            </div>
            <p className="text-xs text-purple-700 mb-3">
              Upgrade your plan to get more AI-powered features and higher limits.
            </p>
            <Button size="sm" className="w-full">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        )}

        {/* Usage Tips */}
        {plan.name === 'basic' && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">AI Tips</span>
            </div>
            <p className="text-xs text-blue-700">
              Use AI features strategically: Start with subject line generation, 
              then optimize your best performing campaigns.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AIUsageWidget 
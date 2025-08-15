/**
 * Plan Service for Frontend
 * Manages user plan information, feature access, and upgrade logic
 */

import { apiClient } from '@/http/stable-api-client'

export interface UserPlan {
  name: string
  code: string
  features: string[]
  limits: {
    maxThreads?: number
    maxAiCallsDaily?: number
    maxAiTokensMonthly?: number
    maxConcurrentSessions?: number
  }
  usage: {
    aiCallsDaily: number
    aiTokensMonthly: number
    dailyRemaining: number | string
    monthlyTokensRemaining: number | string
  }
  databaseTier: string
}

export interface UpgradeInfo {
  suggestedPlan: string
  benefit: string
  price: string
  features: string[]
}

export interface PlanFeature {
  name: string
  displayName: string
  description: string
  requiredPlan: string
  category: 'core' | 'premium' | 'enterprise'
}

export interface PlanError {
  error: string
  message: string
  currentPlan?: string
  requiredFeature?: string
  upgradeUrl?: string
  upgradeSuggestion?: UpgradeInfo
}

class PlanService {
  private planCache: UserPlan | null = null
  private cacheExpiry: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Get user's current plan information
   */
  async getUserPlan(): Promise<UserPlan> {
    // Check cache first
    if (this.planCache && Date.now() < this.cacheExpiry) {
      return this.planCache
    }

    try {
      const data = await apiClient.get('/ai-mailing/usage-stats')
      
      // Transform backend response to frontend format
      const plan: UserPlan = {
        name: data.plan?.name || 'Basic',
        code: data.plan?.code || 'basic',
        features: data.features || [],
        limits: {
          maxThreads: data.plan?.max_ai_calls_daily,
          maxAiCallsDaily: data.plan?.max_ai_calls_daily,
          maxAiTokensMonthly: data.plan?.max_ai_tokens_monthly,
          maxConcurrentSessions: data.plan?.max_concurrent_sessions
        },
        usage: {
          aiCallsDaily: data.usage?.daily_calls || 0,
          aiTokensMonthly: data.usage?.monthly_tokens || 0,
          dailyRemaining: data.usage?.daily_remaining || 'unlimited',
          monthlyTokensRemaining: data.usage?.monthly_tokens_remaining || 'unlimited'
        },
        databaseTier: data.plan?.database_tier || 'shared'
      }

      // Cache the result
      this.planCache = plan
      this.cacheExpiry = Date.now() + this.CACHE_DURATION
      
      return plan
    } catch (error) {
      console.error('Failed to fetch user plan:', error)
      
      // Return default basic plan on error
      return {
        name: 'Basic',
        code: 'basic',
        features: ['basic_campaigns', 'basic_smtp_imap', 'basic_templates'],
        limits: {
          maxThreads: 5,
          maxAiCallsDaily: 0,
          maxAiTokensMonthly: 0,
          maxConcurrentSessions: 1
        },
        usage: {
          aiCallsDaily: 0,
          aiTokensMonthly: 0,
          dailyRemaining: 0,
          monthlyTokensRemaining: 0
        },
        databaseTier: 'shared'
      }
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  async checkFeatureAccess(feature: string): Promise<boolean> {
    try {
      const plan = await this.getUserPlan()
      return plan.features.includes(feature)
    } catch {
      return false
    }
  }

  /**
   * Check if user has access to multiple features (requires ALL)
   */
  async checkFeaturesAccess(features: string[]): Promise<boolean> {
    try {
      const plan = await this.getUserPlan()
      return features.every(feature => plan.features.includes(feature))
    } catch {
      return false
    }
  }

  /**
   * Check if user has access to any of the provided features (requires ANY)
   */
  async checkAnyFeatureAccess(features: string[]): Promise<boolean> {
    try {
      const plan = await this.getUserPlan()
      return features.some(feature => plan.features.includes(feature))
    } catch {
      return false
    }
  }

  /**
   * Get upgrade information based on current plan
   */
  async getUpgradeInfo(currentPlan?: string): Promise<UpgradeInfo> {
    if (!currentPlan) {
      const plan = await this.getUserPlan()
      currentPlan = plan.code
    }

    const upgradeMap: Record<string, UpgradeInfo> = {
      basic: {
        suggestedPlan: "Premium",
        benefit: "3.3x more AI calls + Advanced features + SOCKS proxies",
        price: "$99-299/month",
        features: [
          "500 AI calls daily (vs 150)",
          "AI content optimization", 
          "Advanced security scanning",
          "SOCKS proxy support",
          "Bounce management",
          "Premium email support"
        ]
      },
      premium: {
        suggestedPlan: "Deluxe", 
        benefit: "Unlimited AI + Automation + Performance tools",
        price: "$499-999/month",
        features: [
          "Unlimited AI calls and tokens",
          "Complete automation workflows",
          "Performance testing tools",
          "Bulk operations",
          "Advanced analytics",
          "Priority support"
        ]
      },
      deluxe: {
        suggestedPlan: "Enterprise",
        benefit: "Admin access + Custom integrations + Dedicated support",
        price: "$1999+/month",
        features: [
          "Admin dashboard access",
          "User and plan management",
          "Custom integrations",
          "White-label options",
          "Dedicated infrastructure",
          "24/7 phone support"
        ]
      }
    }
    
    return upgradeMap[currentPlan] || {
      suggestedPlan: "Contact Sales",
      benefit: "Custom enterprise solution",
      price: "Custom pricing",
      features: ["Custom feature development", "Dedicated infrastructure", "Enterprise SLA"]
    }
  }

  /**
   * Check if user is at least a certain plan tier
   */
  async isAtLeastPlan(planCode: string): Promise<boolean> {
    const hierarchy = ['basic', 'premium', 'deluxe', 'enterprise']
    const plan = await this.getUserPlan()
    
    const currentIndex = hierarchy.indexOf(plan.code)
    const requiredIndex = hierarchy.indexOf(planCode)
    
    return currentIndex >= requiredIndex
  }

  /**
   * Get feature definitions and requirements
   */
  getFeatureDefinitions(): Record<string, PlanFeature> {
    return {
      // Core features (Basic+)
      'basic_campaigns': {
        name: 'basic_campaigns',
        displayName: 'Basic Campaigns',
        description: 'Create and send email campaigns',
        requiredPlan: 'basic',
        category: 'core'
      },
      'basic_smtp_imap': {
        name: 'basic_smtp_imap',
        displayName: 'Email Accounts',
        description: 'SMTP and IMAP account management',
        requiredPlan: 'basic',
        category: 'core'
      },
      'basic_templates': {
        name: 'basic_templates',
        displayName: 'Email Templates',
        description: 'Create and manage email templates',
        requiredPlan: 'basic',
        category: 'core'
      },
      'blacklist_checking': {
        name: 'blacklist_checking',
        displayName: 'Blacklist Checking',
        description: 'Check IP and domain reputation',
        requiredPlan: 'basic',
        category: 'core'
      },

      // Premium features (Premium+)
      'ai_subject_generation': {
        name: 'ai_subject_generation',
        displayName: 'AI Subject Lines',
        description: 'Generate optimized email subject lines with AI',
        requiredPlan: 'premium',
        category: 'premium'
      },
      'ai_content_optimization': {
        name: 'ai_content_optimization',
        displayName: 'AI Content Optimization',
        description: 'Optimize email content for better engagement',
        requiredPlan: 'premium',
        category: 'premium'
      },
      'socks_stream': {
        name: 'socks_stream',
        displayName: 'SOCKS Proxy Support',
        description: 'Advanced proxy configuration and streaming',
        requiredPlan: 'premium',
        category: 'premium'
      },
      'advanced_security': {
        name: 'advanced_security',
        displayName: 'Advanced Security',
        description: 'SPF validation and content scanning',
        requiredPlan: 'premium',
        category: 'premium'
      },
      'bounce_management': {
        name: 'bounce_management',
        displayName: 'Bounce Management',
        description: 'Handle email bounces and suppression lists',
        requiredPlan: 'premium',
        category: 'premium'
      },

      // Deluxe features (Deluxe+)
      'automation_workflows': {
        name: 'automation_workflows',
        displayName: 'Automation Workflows',
        description: 'Create automated email sequences and triggers',
        requiredPlan: 'deluxe',
        category: 'premium'
      },
      'performance_testing': {
        name: 'performance_testing',
        displayName: 'Performance Testing',
        description: 'Load testing and performance monitoring',
        requiredPlan: 'deluxe',
        category: 'premium'
      },
      'ai_campaign_analysis': {
        name: 'ai_campaign_analysis',
        displayName: 'AI Campaign Analysis',
        description: 'Advanced AI-powered campaign analytics',
        requiredPlan: 'deluxe',
        category: 'premium'
      },
      'bulk_operations': {
        name: 'bulk_operations',
        displayName: 'Bulk Operations',
        description: 'Mass operations and large-scale processing',
        requiredPlan: 'deluxe',
        category: 'premium'
      },

      // Enterprise features (Enterprise only)
      'admin_functions': {
        name: 'admin_functions',
        displayName: 'Admin Dashboard',
        description: 'Administrative functions and user management',
        requiredPlan: 'enterprise',
        category: 'enterprise'
      },
      'plan_management': {
        name: 'plan_management',
        displayName: 'Plan Management',
        description: 'Manage user plans and subscriptions',
        requiredPlan: 'enterprise',
        category: 'enterprise'
      },
      'system_administration': {
        name: 'system_administration',
        displayName: 'System Administration',
        description: 'System-level administration and monitoring',
        requiredPlan: 'enterprise',
        category: 'enterprise'
      }
    }
  }

  /**
   * Clear plan cache (useful after plan changes)
   */
  clearCache(): void {
    this.planCache = null
    this.cacheExpiry = 0
  }

  /**
   * Handle plan errors from API responses
   */
  handlePlanError(error: any): PlanError {
    if (error?.response?.status === 402) {
      const detail = error.response.data?.detail
      if (typeof detail === 'object') {
        return detail as PlanError
      }
    }
    
    return {
      error: 'unknown_error',
      message: 'An unexpected error occurred',
      upgradeUrl: '/pricing'
    }
  }

  /**
   * Check usage and warn if approaching limits
   */
  async getUsageWarnings(): Promise<string[]> {
    const plan = await this.getUserPlan()
    const warnings: string[] = []

    // Check AI usage
    if (typeof plan.usage.dailyRemaining === 'number') {
      const remaining = plan.usage.dailyRemaining
      const total = plan.limits.maxAiCallsDaily || 0
      const percentage = remaining / total

      if (percentage <= 0.1) {
        warnings.push(`⚠️ AI calls: ${remaining} remaining today`)
      } else if (percentage <= 0.25) {
        warnings.push(`📊 AI calls: ${remaining} remaining today`)
      }
    }

    // Check token usage
    if (typeof plan.usage.monthlyTokensRemaining === 'number') {
      const remaining = plan.usage.monthlyTokensRemaining
      const total = plan.limits.maxAiTokensMonthly || 0
      const percentage = remaining / total

      if (percentage <= 0.1) {
        warnings.push(`⚠️ AI tokens: ${remaining.toLocaleString()} remaining this month`)
      }
    }

    return warnings
  }
}

// Create singleton instance
export const planService = new PlanService()

// Export for testing
export { PlanService } 
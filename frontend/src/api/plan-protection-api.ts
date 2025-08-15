/**
 * Plan Protection API
 * Frontend integration for plan enforcement and feature access control
 */

import axiosInstance from '@/http/axios'

// Types
export interface UserPlanInfo {
  plan: {
    id: string
    name: string
    code: string
    max_threads?: number
    max_ai_calls_daily?: number
    max_ai_tokens_monthly?: number
    max_concurrent_sessions?: number
    allowed_functions: string[]
    has_premium_support: boolean
    database_tier_label: string
  }
  usage: {
    daily_calls: number
    monthly_tokens: number
    daily_remaining: number | string
    monthly_tokens_remaining: number | string
  }
  features: string[]
  limits: {
    threads: {
      max: number | null
      current: number
    }
    ai_calls: {
      daily_max: number | null
      daily_used: number
      daily_remaining: number | string
    }
    ai_tokens: {
      monthly_max: number | null
      monthly_used: number
      monthly_remaining: number | string
    }
    sessions: {
      max: number
      current: number
    }
  }
}

export interface DatabaseTierInfo {
  tier_label: string
  actual_tier: string
  performance_characteristics: {
    connection_pool_size: number
    query_timeout_ms: number
    max_concurrent_queries: number
    backup_frequency: string
    replication_enabled: boolean
  }
  storage_limits: {
    max_storage_gb: number | null
    current_usage_gb: number
    max_tables: number | null
    max_indexes: number | null
  }
  features: {
    advanced_analytics: boolean
    automated_scaling: boolean
    priority_support: boolean
    custom_schemas: boolean
  }
}

export interface FeatureAccessInfo {
  feature_name: string
  has_access: boolean
  required_plan: string
  current_plan: string
  upgrade_required: boolean
  upgrade_suggestion?: {
    suggested_plan: string
    benefit: string
    price: string
    features: string[]
  }
}

export interface PremiumSupportInfo {
  has_access: boolean
  support_level: 'basic' | 'premium' | 'enterprise'
  response_time_sla: string
  available_channels: string[]
  dedicated_manager: boolean
  priority_queue: boolean
  phone_support: boolean
  features: {
    live_chat: boolean
    priority_tickets: boolean
    implementation_assistance: boolean
    custom_training: boolean
    api_integration_help: boolean
  }
}

export interface SOCKSStreamInfo {
  has_access: boolean
  features: {
    premium_proxy_pool: boolean
    high_speed_streaming: boolean
    geo_targeting: boolean
    dedicated_ips: boolean
    custom_rotation: boolean
    advanced_filtering: boolean
  }
  limits: {
    max_concurrent_streams: number | null
    max_bandwidth_mbps: number | null
    max_requests_per_hour: number | null
  }
  current_usage: {
    active_streams: number
    bandwidth_used_mbps: number
    requests_last_hour: number
  }
}

export interface SessionProtectionInfo {
  max_concurrent_sessions: number
  current_active_sessions: number
  session_devices: {
    fingerprint: string
    last_activity: string
    ip_address: string
    user_agent: string
    location?: string
  }[]
  security_features: {
    device_fingerprinting: boolean
    ip_restriction: boolean
    session_timeout: number
    force_logout_other_devices: boolean
  }
}

export interface ProtectedCampaignRequest {
  name: string
  template_id: string
  threads_number: number
  sending_limit: number
  advanced_features?: {
    ai_optimization: boolean
    performance_monitoring: boolean
    advanced_analytics: boolean
  }
}

export interface ProtectedAIChatRequest {
  message: string
  model: string
  max_tokens?: number
  advanced_features?: {
    context_enhancement: boolean
    multi_model_comparison: boolean
    performance_insights: boolean
  }
}

export interface PlanUsageAnalytics {
  feature_usage: {
    feature_name: string
    usage_count: number
    last_used: string
    usage_trend: 'increasing' | 'stable' | 'decreasing'
  }[]
  
  quota_utilization: {
    ai_calls_daily: {
      used_percentage: number
      trend: 'normal' | 'approaching_limit' | 'at_limit'
      projected_usage: number
    }
    ai_tokens_monthly: {
      used_percentage: number
      trend: 'normal' | 'approaching_limit' | 'at_limit'
      projected_usage: number
    }
    threads: {
      peak_usage: number
      average_usage: number
      utilization_percentage: number
    }
  }
  
  upgrade_recommendations: {
    reason: string
    suggested_plan: string
    expected_benefit: string
    cost_impact: string
    urgency: 'low' | 'medium' | 'high'
  }[]
  
  cost_optimization: {
    current_plan_efficiency: number
    underutilized_features: string[]
    overutilized_quotas: string[]
    optimization_suggestions: string[]
  }
}

export const planProtectionApi = {
  // Plan status and information
  getUserPlanStatus: async (): Promise<UserPlanInfo> => {
    const { data } = await axiosInstance.get<UserPlanInfo>('/protected/user/plan-status')
    return data
  },

  getDatabaseInfo: async (): Promise<DatabaseTierInfo> => {
    const { data } = await axiosInstance.get<DatabaseTierInfo>('/protected/user/database-info')
    return data
  },

  // Feature access checking
  checkFeatureAccess: async (featureName: string): Promise<FeatureAccessInfo> => {
    const { data } = await axiosInstance.get<FeatureAccessInfo>(`/protected/features/check/${featureName}`)
    return data
  },

  bulkCheckFeatures: async (featureNames: string[]): Promise<{
    features: FeatureAccessInfo[]
    summary: {
      total_features: number
      accessible_features: number
      restricted_features: number
      upgrade_recommended: boolean
    }
  }> => {
    const { data } = await axiosInstance.post('/protected/features/bulk-check', {
      feature_names: featureNames
    })
    return data
  },

  // Premium features
  getSOCKSStreamInfo: async (): Promise<SOCKSStreamInfo> => {
    const { data } = await axiosInstance.get<SOCKSStreamInfo>('/protected/features/socks-stream')
    return data
  },

  getPremiumSupportInfo: async (): Promise<PremiumSupportInfo> => {
    const { data } = await axiosInstance.get<PremiumSupportInfo>('/protected/features/premium-support')
    return data
  },

  // Protected operations
  createProtectedCampaign: async (request: ProtectedCampaignRequest): Promise<{
    success: boolean
    campaign_id?: string
    plan_validation: {
      threads_allowed: boolean
      features_allowed: boolean
      quota_sufficient: boolean
    }
    message: string
  }> => {
    const { data } = await axiosInstance.post('/protected/campaigns/protected', request)
    return data
  },

  protectedAIChat: async (request: ProtectedAIChatRequest): Promise<{
    success: boolean
    response?: string
    tokens_used: number
    plan_validation: {
      model_allowed: boolean
      quota_sufficient: boolean
      features_allowed: boolean
    }
    remaining_quota: {
      daily_calls: number | string
      monthly_tokens: number | string
    }
    message: string
  }> => {
    const { data } = await axiosInstance.post('/protected/ai/chat/protected', request)
    return data
  },

  // Session management
  createProtectedSession: async (request: {
    fingerprint: string
    device_info: {
      user_agent: string
      screen_resolution: string
      timezone: string
      language: string
    }
    security_preferences?: {
      force_logout_others: boolean
      restrict_ip: boolean
    }
  }): Promise<{
    success: boolean
    session_id: string
    session_info: SessionProtectionInfo
    message: string
  }> => {
    const { data } = await axiosInstance.post('/protected/auth/session/protected', request)
    return data
  },

  getSessionInfo: async (): Promise<SessionProtectionInfo> => {
    const { data } = await axiosInstance.get<SessionProtectionInfo>('/protected/auth/session/info')
    return data
  },

  terminateOtherSessions: async (): Promise<{
    success: boolean
    terminated_sessions: number
    message: string
  }> => {
    const { data } = await axiosInstance.post('/protected/auth/session/terminate-others')
    return data
  },

  // Usage analytics
  getUsageAnalytics: async (params?: {
    period?: 'day' | 'week' | 'month'
    include_predictions?: boolean
  }): Promise<PlanUsageAnalytics> => {
    const { data } = await axiosInstance.get<PlanUsageAnalytics>('/protected/analytics/usage', { params })
    return data
  },

  getQuotaProjections: async (): Promise<{
    ai_calls_daily: {
      current_usage: number
      projected_end_of_day: number
      will_exceed_limit: boolean
      recommended_action: string
    }
    ai_tokens_monthly: {
      current_usage: number
      projected_end_of_month: number
      will_exceed_limit: boolean
      recommended_action: string
    }
    cost_projections: {
      current_month_cost: number
      projected_month_cost: number
      next_tier_cost: number
      cost_per_feature: Record<string, number>
    }
  }> => {
    const { data } = await axiosInstance.get('/protected/analytics/projections')
    return data
  },

  // Admin features (Enterprise only)
  getSystemPlans: async (): Promise<{
    plans: {
      id: string
      name: string
      code: string
      price: number
      features: string[]
      limits: Record<string, any>
      user_count: number
      is_active: boolean
    }[]
    plan_hierarchy: string[]
  }> => {
    const { data } = await axiosInstance.get('/protected/admin/plans')
    return data
  },

  assignUserPlan: async (userId: string, request: {
    plan_code: string
    duration_days?: number
    custom_limits?: Record<string, any>
    notes?: string
  }): Promise<{
    success: boolean
    assignment_id: string
    effective_date: string
    expiry_date?: string
    message: string
  }> => {
    const { data } = await axiosInstance.post(`/protected/admin/user/${userId}/assign-plan`, request)
    return data
  },

  getUserPlanHistory: async (userId: string): Promise<{
    plan_history: {
      plan_name: string
      plan_code: string
      assigned_date: string
      expiry_date?: string
      assigned_by: string
      reason: string
      is_active: boolean
    }[]
    current_plan: {
      name: string
      code: string
      assigned_date: string
      expiry_date?: string
    }
  }> => {
    const { data } = await axiosInstance.get(`/protected/admin/user/${userId}/plan-history`)
    return data
  },

  // Plan comparison and recommendations
  comparePlans: async (planCodes: string[]): Promise<{
    comparison: {
      feature_name: string
      plans: Record<string, any>
    }[]
    recommendations: {
      current_plan: string
      recommended_plan: string
      reason: string
      cost_difference: number
      feature_upgrades: string[]
    }[]
  }> => {
    const { data } = await axiosInstance.post('/protected/plans/compare', { plan_codes: planCodes })
    return data
  },

  getUpgradeQuote: async (targetPlan: string): Promise<{
    current_plan: string
    target_plan: string
    cost_analysis: {
      current_monthly_cost: number
      new_monthly_cost: number
      cost_difference: number
      annual_savings?: number
    }
    feature_analysis: {
      new_features: string[]
      upgraded_limits: Record<string, any>
      estimated_roi: string
    }
    upgrade_path: {
      immediate_upgrade: boolean
      migration_required: boolean
      downtime_expected: boolean
      estimated_migration_time: string
    }
  }> => {
    const { data } = await axiosInstance.get(`/protected/plans/upgrade-quote/${targetPlan}`)
    return data
  },

  // Feature usage tracking
  trackFeatureUsage: async (featureName: string, metadata?: Record<string, any>): Promise<{
    success: boolean
    usage_recorded: boolean
    quota_impact: {
      quota_consumed: number
      remaining_quota: number | string
    }
  }> => {
    const { data } = await axiosInstance.post('/protected/features/track-usage', {
      feature_name: featureName,
      metadata
    })
    return data
  },

  // Plan validation for specific operations
  validateOperation: async (operation: {
    type: 'campaign' | 'ai_request' | 'bulk_operation' | 'performance_test'
    resource_requirements: {
      threads?: number
      ai_tokens?: number
      storage_mb?: number
      processing_time_minutes?: number
    }
    features_required: string[]
  }): Promise<{
    allowed: boolean
    validation_results: {
      quota_check: boolean
      feature_check: boolean
      resource_check: boolean
    }
    limitations: {
      max_threads_allowed: number
      max_tokens_allowed: number
      restricted_features: string[]
    }
    recommendations: string[]
  }> => {
    const { data } = await axiosInstance.post('/protected/validate-operation', operation)
    return data
  }
}

// React Query hooks for plan protection
export const useUserPlanStatus = () => {
  return {
    queryKey: ['userPlanStatus'],
    queryFn: planProtectionApi.getUserPlanStatus,
    staleTime: 5 * 60 * 1000 // 5 minutes
  }
}

export const useDatabaseInfo = () => {
  return {
    queryKey: ['databaseInfo'],
    queryFn: planProtectionApi.getDatabaseInfo,
    staleTime: 10 * 60 * 1000 // 10 minutes
  }
}

export const useFeatureAccess = (featureName: string) => {
  return {
    queryKey: ['featureAccess', featureName],
    queryFn: () => planProtectionApi.checkFeatureAccess(featureName),
    enabled: !!featureName,
    staleTime: 2 * 60 * 1000 // 2 minutes
  }
}

export const useSOCKSStreamInfo = () => {
  return {
    queryKey: ['socksStreamInfo'],
    queryFn: planProtectionApi.getSOCKSStreamInfo,
    staleTime: 5 * 60 * 1000 // 5 minutes
  }
}

export const usePremiumSupportInfo = () => {
  return {
    queryKey: ['premiumSupportInfo'],
    queryFn: planProtectionApi.getPremiumSupportInfo,
    staleTime: 10 * 60 * 1000 // 10 minutes
  }
}

export const useUsageAnalytics = (params?: any) => {
  return {
    queryKey: ['usageAnalytics', params],
    queryFn: () => planProtectionApi.getUsageAnalytics(params),
    staleTime: 60 * 1000 // 1 minute
  }
}

export const useQuotaProjections = () => {
  return {
    queryKey: ['quotaProjections'],
    queryFn: planProtectionApi.getQuotaProjections,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  }
}

export const useSessionInfo = () => {
  return {
    queryKey: ['sessionInfo'],
    queryFn: planProtectionApi.getSessionInfo,
    staleTime: 30 * 1000 // 30 seconds
  }
} 
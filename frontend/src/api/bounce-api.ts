/**
 * Bounce Management API
 * Frontend integration for email bounce handling and suppression lists
 */

import axiosInstance from '@/http/axios'

// Types
export interface BounceClassification {
  bounce_type: 'hard' | 'soft' | 'general' | 'unknown'
  bounce_category: 'invalid_mailbox' | 'full_mailbox' | 'message_rejected' | 'routing_error' | 'general_failure'
  severity: 'permanent' | 'temporary' | 'transient'
  should_suppress: boolean
  retry_recommended: boolean
  description: string
}

export interface EmailBounce {
  id: string
  email_address: string
  domain: string
  bounce_type: string
  bounce_category: string
  bounce_reason: string
  bounce_code?: string
  raw_message?: string
  first_bounce_date: string
  last_bounce_date: string
  bounce_count: number
  campaign_id?: string
  smtp_account_id?: string
  classification: BounceClassification
  created_at: string
  updated_at: string
}

export interface SuppressionListEntry {
  id: string
  email_address: string
  domain: string
  suppression_type: 'bounce' | 'complaint' | 'unsubscribe' | 'manual' | 'global'
  reason: string
  source: string
  added_date: string
  expires_at?: string
  is_permanent: boolean
  added_by?: string
  notes?: string
  metadata?: Record<string, any>
}

export interface BounceStatistics {
  period: {
    start_date: string
    end_date: string
  }
  
  totals: {
    total_bounces: number
    hard_bounces: number
    soft_bounces: number
    suppressed_emails: number
    bounce_rate_percentage: number
  }
  
  by_type: {
    bounce_type: string
    count: number
    percentage: number
  }[]
  
  by_domain: {
    domain: string
    bounce_count: number
    total_sent: number
    bounce_rate: number
  }[]
  
  by_campaign: {
    campaign_id: string
    campaign_name: string
    bounce_count: number
    total_sent: number
    bounce_rate: number
  }[]
  
  trends: {
    date: string
    total_bounces: number
    hard_bounces: number
    soft_bounces: number
    bounce_rate: number
  }[]
  
  top_bounce_reasons: {
    reason: string
    count: number
    percentage: number
  }[]
}

export interface DeliverabilityDashboard {
  overview: {
    deliverability_score: number
    reputation_status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
    total_emails_sent: number
    delivery_rate: number
    bounce_rate: number
    complaint_rate: number
    suppression_list_size: number
  }
  
  recent_activity: {
    timestamp: string
    event_type: 'bounce' | 'complaint' | 'suppression_added'
    email_address: string
    reason: string
    severity: string
  }[]
  
  domain_health: {
    domain: string
    reputation_score: number
    delivery_rate: number
    bounce_rate: number
    recommendation: string
  }[]
  
  alerts: {
    id: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    type: 'bounce_spike' | 'reputation_drop' | 'blacklist_detected' | 'high_complaint_rate'
    message: string
    timestamp: string
    resolved: boolean
    resolution_note?: string
  }[]
  
  recommendations: {
    category: string
    title: string
    description: string
    priority: 'low' | 'medium' | 'high'
    impact: string
    action_required: boolean
  }[]
}

export interface FeedbackLoop {
  id: string
  isp_name: string
  feedback_type: 'abuse' | 'fraud' | 'virus' | 'not_spam' | 'other'
  email_address: string
  campaign_id?: string
  subject_line?: string
  complaint_date: string
  raw_feedback?: string
  processed: boolean
  action_taken: string
  created_at: string
}

export interface BounceRule {
  id: string
  name: string
  description: string
  pattern_type: 'regex' | 'contains' | 'exact_match' | 'domain'
  pattern_value: string
  classification: BounceClassification
  is_active: boolean
  priority: number
  match_count: number
  created_at: string
  updated_at: string
}

export interface BounceStatus {
  system_status: 'operational' | 'degraded' | 'down'
  processing_enabled: boolean
  rules_count: number
  suppression_list_size: number
  recent_bounces_24h: number
  processing_queue_size: number
  last_processed_at: string
  feedback_loops_configured: number
}

export interface ProcessBounceRequest {
  raw_message?: string
  email_address?: string
  bounce_type?: string
  bounce_reason?: string
  campaign_id?: string
  smtp_account_id?: string
  auto_classify?: boolean
}

export interface BulkSuppressionRequest {
  email_addresses: string[]
  suppression_type: string
  reason: string
  source: string
  expires_at?: string
  notes?: string
}

export const bounceApi = {
  // System status
  getStatus: async (): Promise<BounceStatus> => {
    const { data } = await axiosInstance.get<BounceStatus>('/bounce/status')
    return data
  },

  // Bounce processing
  processBounce: async (request: ProcessBounceRequest): Promise<{
    success: boolean
    bounce_id?: string
    classification: BounceClassification
    suppressed: boolean
    message: string
  }> => {
    const { data } = await axiosInstance.post('/api/v1bounce/process', request)
    return data
  },

  testBounceClassification: async (request: {
    bounce_message: string
    email_address: string
  }): Promise<{
    classification: BounceClassification
    matched_rule?: BounceRule
    confidence_score: number
  }> => {
    const { data } = await axiosInstance.post('/api/v1bounce/test-classification', request)
    return data
  },

  // Suppression list management
  checkSuppression: async (emailAddress: string): Promise<{
    is_suppressed: boolean
    suppression_entry?: SuppressionListEntry
    reason?: string
    can_send: boolean
  }> => {
    const { data } = await axiosInstance.get(`/api/v1bounce/check-suppression/${emailAddress}`)
    return data
  },

  bulkCheckSuppression: async (emailAddresses: string[]): Promise<{
    results: {
      email_address: string
      is_suppressed: boolean
      reason?: string
      suppression_type?: string
    }[]
    summary: {
      total_checked: number
      suppressed_count: number
      clean_count: number
    }
  }> => {
    const { data } = await axiosInstance.post('/api/v1bounce/check-suppression/bulk', {
      email_addresses: emailAddresses
    })
    return data
  },

  addToSuppression: async (request: {
    email_address: string
    suppression_type: string
    reason: string
    source: string
    expires_at?: string
    notes?: string
  }): Promise<{
    success: boolean
    suppression_id: string
    message: string
  }> => {
    const { data } = await axiosInstance.post('/api/v1bounce/suppression/add', request)
    return data
  },

  bulkAddToSuppression: async (request: BulkSuppressionRequest): Promise<{
    success: boolean
    added_count: number
    duplicate_count: number
    failed_count: number
    failed_emails: string[]
    message: string
  }> => {
    const { data } = await axiosInstance.post('/api/v1bounce/suppression/bulk-add', request)
    return data
  },

  removeFromSuppression: async (emailAddress: string): Promise<{
    success: boolean
    message: string
  }> => {
    const { data } = await axiosInstance.delete(`/api/v1bounce/suppression/${emailAddress}`)
    return data
  },

  getSuppressionList: async (params?: {
    suppression_type?: string
    search?: string
    limit?: number
    offset?: number
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }): Promise<{
    entries: SuppressionListEntry[]
    total: number
    has_more: boolean
    filters_applied: Record<string, any>
  }> => {
    const { data } = await axiosInstance.get('/api/v1bounce/suppression-list', { params })
    return data
  },

  exportSuppressionList: async (format: 'csv' | 'excel', filters?: any): Promise<Blob> => {
    const response = await axiosInstance.get('/api/v1bounce/suppression-list/export', {
      params: { format, ...filters },
      responseType: 'blob'
    })
    return response.data
  },

  // Statistics and reporting
  getStatistics: async (params?: {
    start_date?: string
    end_date?: string
    campaign_id?: string
    domain?: string
  }): Promise<BounceStatistics> => {
    const { data } = await axiosInstance.get<BounceStatistics>('/bounce/statistics', { params })
    return data
  },

  getDeliverabilityDashboard: async (): Promise<DeliverabilityDashboard> => {
    const { data } = await axiosInstance.get<DeliverabilityDashboard>('/bounce/deliverability/dashboard')
    return data
  },

  // Feedback loop management
  getFeedbackLoops: async (params?: {
    isp_name?: string
    feedback_type?: string
    processed?: boolean
    limit?: number
    offset?: number
  }): Promise<{
    feedback_loops: FeedbackLoop[]
    total: number
    has_more: boolean
  }> => {
    const { data } = await axiosInstance.get('/api/v1bounce/feedback-loops', { params })
    return data
  },

  processFeedbackLoop: async (request: {
    raw_feedback: string
    isp_name: string
    feedback_type?: string
  }): Promise<{
    success: boolean
    feedback_id: string
    email_address?: string
    action_taken: string
    message: string
  }> => {
    const { data } = await axiosInstance.post('/api/v1bounce/feedback-loop', request)
    return data
  },

  // Bounce rules management
  getBounceRules: async (): Promise<{
    rules: BounceRule[]
    total: number
  }> => {
    const { data } = await axiosInstance.get('/api/v1bounce/rules')
    return data
  },

  createBounceRule: async (rule: {
    name: string
    description: string
    pattern_type: string
    pattern_value: string
    classification: BounceClassification
    priority?: number
  }): Promise<{
    success: boolean
    rule_id: string
    message: string
  }> => {
    const { data } = await axiosInstance.post('/api/v1bounce/rules', rule)
    return data
  },

  updateBounceRule: async (ruleId: string, updates: Partial<BounceRule>): Promise<{
    success: boolean
    message: string
  }> => {
    const { data } = await axiosInstance.put(`/api/v1bounce/rules/${ruleId}`, updates)
    return data
  },

  deleteBounceRule: async (ruleId: string): Promise<{
    success: boolean
    message: string
  }> => {
    const { data } = await axiosInstance.delete(`/api/v1bounce/rules/${ruleId}`)
    return data
  },

  testBounceRule: async (ruleId: string, testData: {
    bounce_message: string
    email_address: string
  }): Promise<{
    matches: boolean
    classification?: BounceClassification
    confidence_score: number
  }> => {
    const { data } = await axiosInstance.post(`/api/v1bounce/rules/${ruleId}/test`, testData)
    return data
  },

  // Bounce analysis and insights
  analyzeBouncePatterns: async (params?: {
    start_date?: string
    end_date?: string
    min_occurrences?: number
  }): Promise<{
    patterns: {
      pattern: string
      frequency: number
      bounce_type: string
      affected_domains: string[]
      recommendation: string
    }[]
    insights: {
      trending_issues: string[]
      domain_specific_problems: string[]
      recommendations: string[]
    }
  }> => {
    const { data } = await axiosInstance.get('/api/v1bounce/analysis/patterns', { params })
    return data
  },

  getDomainReputation: async (domain: string): Promise<{
    domain: string
    reputation_score: number
    delivery_rate: number
    bounce_rate: number
    complaint_rate: number
    blacklist_status: {
      is_blacklisted: boolean
      blacklists: string[]
      last_checked: string
    }
    recommendations: string[]
    last_updated: string
  }> => {
    const { data } = await axiosInstance.get(`/api/v1bounce/domain-reputation/${domain}`)
    return data
  },

  // Cleanup and maintenance
  cleanupSuppressionList: async (params: {
    remove_expired: boolean
    remove_soft_bounces_older_than_days?: number
    dry_run?: boolean
  }): Promise<{
    success: boolean
    removed_count: number
    remaining_count: number
    cleanup_summary: {
      expired_removed: number
      old_soft_bounces_removed: number
      duplicates_removed: number
    }
    message: string
  }> => {
    const { data } = await axiosInstance.post('/api/v1bounce/suppression-list/cleanup', params)
    return data
  },

  // Webhook configuration (for ISP feedback loops)
  getWebhookConfig: async (): Promise<{
    webhook_url: string
    verification_token: string
    enabled_isps: string[]
    last_webhook_received: string
  }> => {
    const { data } = await axiosInstance.get('/api/v1bounce/webhook/config')
    return data
  },

  updateWebhookConfig: async (config: {
    enabled_isps: string[]
    verification_token?: string
  }): Promise<{
    success: boolean
    webhook_url: string
    message: string
  }> => {
    const { data } = await axiosInstance.put('/api/v1bounce/webhook/config', config)
    return data
  }
}

// React Query hooks
export const useBounceStatus = () => {
  return {
    queryKey: ['bounceStatus'],
    queryFn: bounceApi.getStatus
  }
}

export const useBounceStatistics = (params?: any) => {
  return {
    queryKey: ['bounceStatistics', params],
    queryFn: () => bounceApi.getStatistics(params)
  }
}

export const useDeliverabilityDashboard = () => {
  return {
    queryKey: ['deliverabilityDashboard'],
    queryFn: bounceApi.getDeliverabilityDashboard,
    refetchInterval: 30000 // Refresh every 30 seconds
  }
}

export const useSuppressionList = (params?: any) => {
  return {
    queryKey: ['suppressionList', params],
    queryFn: () => bounceApi.getSuppressionList(params)
  }
}

export const useBounceRules = () => {
  return {
    queryKey: ['bounceRules'],
    queryFn: bounceApi.getBounceRules
  }
}

export const useFeedbackLoops = (params?: any) => {
  return {
    queryKey: ['feedbackLoops', params],
    queryFn: () => bounceApi.getFeedbackLoops(params)
  }
} 
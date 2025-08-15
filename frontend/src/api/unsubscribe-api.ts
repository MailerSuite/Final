/**
 * Unsubscribe Management API
 * Frontend integration for unsubscribe handling and preference management
 */

import axiosInstance from '@/http/axios'

// Types
export interface UnsubscribeRecord {
  id: string
  email_address: string
  domain: string
  unsubscribe_method: 'list_unsubscribe' | 'preference_center' | 'reply' | 'manual' | 'api'
  reason_category: string
  reason_text?: string
  campaign_id?: string
  unsubscribe_date: string
  ip_address?: string
  user_agent?: string
  confirmed: boolean
  confirmation_date?: string
  resubscribe_allowed: boolean
  metadata?: Record<string, any>
  created_at: string
}

export interface EmailPreference {
  id: string
  email_address: string
  domain: string
  is_subscribed: boolean
  is_suppressed: boolean
  consent_preferences: Record<string, any>
  max_emails_per_week?: number
  preferred_send_time?: string
  preferred_send_days?: string[]
  language_preference?: string
  timezone?: string
  allow_tracking: boolean
  allow_personalization: boolean
  last_engagement_date?: string
  engagement_score: number
  subscription_source?: string
  subscription_date?: string
  custom_fields?: Record<string, any>
  notes?: string
  created_at: string
  updated_at: string
}

export interface PreferenceCenter {
  id: string
  name: string
  is_active: boolean
  is_default: boolean
  title?: string
  description?: string
  brand_color?: string
  logo_url?: string
  available_consent_types?: string[]
  allow_frequency_control: boolean
  allow_time_preferences: boolean
  allow_complete_unsubscribe: boolean
  custom_questions?: Record<string, any>[]
  privacy_policy_url?: string
  terms_url?: string
  company_address?: string
  config?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface UnsubscribeToken {
  id: string
  token: string
  email_address: string
  campaign_id?: string
  expires_at: string
  used: boolean
  used_at?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface ConsentLog {
  id: string
  email_address: string
  consent_type: 'subscribe' | 'unsubscribe' | 'preference_update' | 'suppression'
  consent_method: 'form' | 'email_link' | 'preference_center' | 'api' | 'manual'
  consent_data: Record<string, any>
  ip_address?: string
  user_agent?: string
  campaign_id?: string
  double_opt_in_required: boolean
  double_opt_in_confirmed: boolean
  confirmation_date?: string
  consent_date: string
  created_at: string
}

export interface UnsubscribeReasonCategory {
  id: string
  name: string
  display_name: string
  description?: string
  is_active: boolean
  sort_order: number
  usage_count: number
  created_at: string
  updated_at: string
}

export interface UnsubscribeStatistics {
  period: {
    start_date: string
    end_date: string
  }
  
  totals: {
    total_unsubscribes: number
    unsubscribe_rate: number
    total_emails_sent: number
    preference_updates: number
    resubscribes: number
  }
  
  by_method: {
    method: string
    count: number
    percentage: number
  }[]
  
  by_reason: {
    reason_category: string
    count: number
    percentage: number
  }[]
  
  by_campaign: {
    campaign_id: string
    campaign_name: string
    unsubscribe_count: number
    emails_sent: number
    unsubscribe_rate: number
  }[]
  
  trends: {
    date: string
    unsubscribes: number
    emails_sent: number
    unsubscribe_rate: number
  }[]
  
  top_domains: {
    domain: string
    unsubscribe_count: number
    total_subscribers: number
    unsubscribe_rate: number
  }[]
}

export interface UnsubscribeStatus {
  system_status: 'operational' | 'degraded' | 'down'
  processing_enabled: boolean
  preference_centers_count: number
  total_unsubscribes_today: number
  pending_confirmations: number
  double_opt_in_enabled: boolean
  compliance_features: {
    gdpr_compliant: boolean
    can_spam_compliant: boolean
    list_unsubscribe_header: boolean
    preference_center_enabled: boolean
  }
}

export interface ComplianceReport {
  report_id: string
  generated_at: string
  period: {
    start_date: string
    end_date: string
  }
  
  compliance_summary: {
    gdpr_compliance_score: number
    can_spam_compliance_score: number
    total_violations: number
    critical_issues: number
  }
  
  unsubscribe_compliance: {
    list_unsubscribe_header_present: number
    preference_center_accessible: number
    unsubscribe_processed_within_10_days: number
    double_opt_in_rate: number
  }
  
  consent_tracking: {
    total_consent_records: number
    explicit_consent_rate: number
    consent_withdrawal_rate: number
    data_retention_compliance: number
  }
  
  violations: {
    violation_type: string
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    count: number
    affected_emails: string[]
    recommended_action: string
  }[]
  
  recommendations: {
    category: string
    title: string
    description: string
    priority: 'low' | 'medium' | 'high'
    compliance_impact: string
  }[]
}

export interface ProcessUnsubscribeRequest {
  email_address: string
  token?: string
  reason_category?: string
  reason_text?: string
  campaign_id?: string
  method?: string
  ip_address?: string
  user_agent?: string
  confirm_immediately?: boolean
}

export interface UpdatePreferencesRequest {
  email_address: string
  token?: string
  preferences: {
    is_subscribed?: boolean
    consent_preferences?: Record<string, any>
    max_emails_per_week?: number
    preferred_send_time?: string
    preferred_send_days?: string[]
    language_preference?: string
    timezone?: string
    allow_tracking?: boolean
    allow_personalization?: boolean
    custom_fields?: Record<string, any>
  }
  ip_address?: string
  user_agent?: string
}

export const unsubscribeApi = {
  // System status
  getStatus: async (): Promise<UnsubscribeStatus> => {
    const { data } = await axiosInstance.get<UnsubscribeStatus>('/unsubscribe/status')
    return data
  },

  // Unsubscribe processing
  processUnsubscribe: async (request: ProcessUnsubscribeRequest): Promise<{
    success: boolean
    unsubscribe_id: string
    requires_confirmation: boolean
    confirmation_token?: string
    message: string
  }> => {
    const { data } = await axiosInstance.post('/unsubscribe/process', request)
    return data
  },

  confirmUnsubscribe: async (token: string, ip_address?: string, user_agent?: string): Promise<{
    success: boolean
    email_address: string
    message: string
  }> => {
    const { data } = await axiosInstance.post('/unsubscribe/confirm', {
      token,
      ip_address,
      user_agent
    })
    return data
  },

  // Preference management
  getPreferenceCenter: async (token: string): Promise<{
    preference_center: PreferenceCenter
    email_preferences: EmailPreference
    available_options: {
      consent_types: { id: string; name: string; description: string }[]
      frequency_options: { value: number; label: string }[]
      time_options: { value: string; label: string }[]
      language_options: { code: string; name: string }[]
    }
  }> => {
    const { data } = await axiosInstance.get(`/unsubscribe/preference-center/${token}`)
    return data
  },

  updatePreferences: async (token: string, request: UpdatePreferencesRequest): Promise<{
    success: boolean
    preferences_updated: string[]
    message: string
  }> => {
    const { data } = await axiosInstance.post(`/unsubscribe/preference-center/${token}/update`, request)
    return data
  },

  // Status checking
  checkUnsubscribeStatus: async (emailAddress: string): Promise<{
    email_address: string
    is_unsubscribed: boolean
    unsubscribe_date?: string
    reason?: string
    method?: string
    can_resubscribe: boolean
    preferences?: EmailPreference
  }> => {
    const { data } = await axiosInstance.get(`/unsubscribe/check-status/${emailAddress}`)
    return data
  },

  bulkCheckStatus: async (emailAddresses: string[]): Promise<{
    results: {
      email_address: string
      is_unsubscribed: boolean
      unsubscribe_date?: string
      reason?: string
      can_send: boolean
    }[]
    summary: {
      total_checked: number
      unsubscribed_count: number
      can_send_count: number
    }
  }> => {
    const { data } = await axiosInstance.post('/unsubscribe/check-status/bulk', {
      email_addresses: emailAddresses
    })
    return data
  },

  // Statistics and reporting
  getStatistics: async (params?: {
    start_date?: string
    end_date?: string
    campaign_id?: string
    domain?: string
  }): Promise<UnsubscribeStatistics> => {
    const { data } = await axiosInstance.get<UnsubscribeStatistics>('/unsubscribe/statistics', { params })
    return data
  },

  getComplianceReport: async (params?: {
    start_date?: string
    end_date?: string
    include_violations?: boolean
  }): Promise<ComplianceReport> => {
    const { data } = await axiosInstance.get<ComplianceReport>('/unsubscribe/compliance-report', { params })
    return data
  },

  // Preference center management
  getPreferenceCenters: async (): Promise<{
    preference_centers: PreferenceCenter[]
    total: number
  }> => {
    const { data } = await axiosInstance.get('/unsubscribe/preference-centers')
    return data
  },

  createPreferenceCenter: async (center: {
    name: string
    title?: string
    description?: string
    brand_color?: string
    logo_url?: string
    available_consent_types?: string[]
    allow_frequency_control?: boolean
    allow_time_preferences?: boolean
    allow_complete_unsubscribe?: boolean
    custom_questions?: Record<string, any>[]
    privacy_policy_url?: string
    terms_url?: string
    company_address?: string
  }): Promise<{
    success: boolean
    preference_center_id: string
    public_url: string
    message: string
  }> => {
    const { data } = await axiosInstance.post('/unsubscribe/create-preference-center', center)
    return data
  },

  updatePreferenceCenter: async (centerId: string, updates: Partial<PreferenceCenter>): Promise<{
    success: boolean
    message: string
  }> => {
    const { data } = await axiosInstance.put(`/unsubscribe/preference-centers/${centerId}`, updates)
    return data
  },

  deletePreferenceCenter: async (centerId: string): Promise<{
    success: boolean
    message: string
  }> => {
    const { data } = await axiosInstance.delete(`/unsubscribe/preference-centers/${centerId}`)
    return data
  },

  // Reason category management
  getReasonCategories: async (): Promise<{
    categories: UnsubscribeReasonCategory[]
    total: number
  }> => {
    const { data } = await axiosInstance.get('/unsubscribe/reason-categories')
    return data
  },

  createReasonCategory: async (category: {
    name: string
    display_name: string
    description?: string
    sort_order?: number
  }): Promise<{
    success: boolean
    category_id: string
    message: string
  }> => {
    const { data } = await axiosInstance.post('/unsubscribe/reason-categories', category)
    return data
  },

  updateReasonCategory: async (categoryId: string, updates: Partial<UnsubscribeReasonCategory>): Promise<{
    success: boolean
    message: string
  }> => {
    const { data } = await axiosInstance.put(`/unsubscribe/reason-categories/${categoryId}`, updates)
    return data
  },

  deleteReasonCategory: async (categoryId: string): Promise<{
    success: boolean
    message: string
  }> => {
    const { data } = await axiosInstance.delete(`/unsubscribe/reason-categories/${categoryId}`)
    return data
  },

  // Token management
  generateUnsubscribeToken: async (request: {
    email_address: string
    campaign_id?: string
    expires_in_hours?: number
  }): Promise<{
    success: boolean
    token: string
    unsubscribe_url: string
    preference_center_url: string
    expires_at: string
  }> => {
    const { data } = await axiosInstance.post('/unsubscribe/generate-token', request)
    return data
  },

  validateToken: async (token: string): Promise<{
    valid: boolean
    email_address?: string
    campaign_id?: string
    expires_at?: string
    message: string
  }> => {
    const { data } = await axiosInstance.get(`/unsubscribe/validate-token/${token}`)
    return data
  },

  // Resubscribe functionality
  resubscribe: async (request: {
    email_address: string
    consent_method: string
    ip_address?: string
    user_agent?: string
    campaign_id?: string
    double_opt_in?: boolean
  }): Promise<{
    success: boolean
    requires_confirmation: boolean
    confirmation_token?: string
    message: string
  }> => {
    const { data } = await axiosInstance.post('/unsubscribe/resubscribe', request)
    return data
  },

  confirmResubscribe: async (token: string, ip_address?: string, user_agent?: string): Promise<{
    success: boolean
    email_address: string
    message: string
  }> => {
    const { data } = await axiosInstance.post('/unsubscribe/confirm-resubscribe', {
      token,
      ip_address,
      user_agent
    })
    return data
  },

  // Consent logging
  getConsentLogs: async (params?: {
    email_address?: string
    consent_type?: string
    start_date?: string
    end_date?: string
    limit?: number
    offset?: number
  }): Promise<{
    logs: ConsentLog[]
    total: number
    has_more: boolean
  }> => {
    const { data } = await axiosInstance.get('/unsubscribe/consent-logs', { params })
    return data
  },

  exportConsentLogs: async (params?: {
    email_address?: string
    start_date?: string
    end_date?: string
    format?: 'csv' | 'excel'
  }): Promise<Blob> => {
    const response = await axiosInstance.get('/unsubscribe/consent-logs/export', {
      params,
      responseType: 'blob'
    })
    return response.data
  },

  // GDPR compliance
  getGdprData: async (emailAddress: string): Promise<{
    email_address: string
    all_data: {
      unsubscribe_records: UnsubscribeRecord[]
      email_preferences: EmailPreference[]
      consent_logs: ConsentLog[]
      campaign_interactions: any[]
    }
    data_processing_purposes: string[]
    legal_basis: string[]
    retention_period: string
  }> => {
    const { data } = await axiosInstance.get(`/unsubscribe/gdpr-data/${emailAddress}`)
    return data
  },

  deleteGdprData: async (emailAddress: string, request: {
    delete_all_data: boolean
    retention_period_expired: boolean
    user_requested: boolean
    notes?: string
  }): Promise<{
    success: boolean
    deleted_records: {
      unsubscribe_records: number
      preferences: number
      consent_logs: number
      campaign_data: number
    }
    message: string
  }> => {
    const { data } = await axiosInstance.post(`/unsubscribe/gdpr-delete/${emailAddress}`, request)
    return data
  },

  // List management integration
  syncWithSuppressionList: async (): Promise<{
    success: boolean
    synced_count: number
    new_suppressions: number
    updated_suppressions: number
    message: string
  }> => {
    const { data } = await axiosInstance.post('/unsubscribe/sync-suppression-list')
    return data
  },

  // Email header generation
  generateListUnsubscribeHeader: async (request: {
    email_address: string
    campaign_id?: string
    include_preference_center?: boolean
  }): Promise<{
    list_unsubscribe_header: string
    list_unsubscribe_post_header: string
    preference_center_url?: string
  }> => {
    const { data } = await axiosInstance.post('/unsubscribe/generate-headers', request)
    return data
  }
}

// React Query hooks
export const useUnsubscribeStatus = () => {
  return {
    queryKey: ['unsubscribeStatus'],
    queryFn: unsubscribeApi.getStatus
  }
}

export const useUnsubscribeStatistics = (params?: any) => {
  return {
    queryKey: ['unsubscribeStatistics', params],
    queryFn: () => unsubscribeApi.getStatistics(params)
  }
}

export const useComplianceReport = (params?: any) => {
  return {
    queryKey: ['complianceReport', params],
    queryFn: () => unsubscribeApi.getComplianceReport(params)
  }
}

export const usePreferenceCenters = () => {
  return {
    queryKey: ['preferenceCenters'],
    queryFn: unsubscribeApi.getPreferenceCenters
  }
}

export const useReasonCategories = () => {
  return {
    queryKey: ['reasonCategories'],
    queryFn: unsubscribeApi.getReasonCategories
  }
}

export const useConsentLogs = (params?: any) => {
  return {
    queryKey: ['consentLogs', params],
    queryFn: () => unsubscribeApi.getConsentLogs(params)
  }
} 
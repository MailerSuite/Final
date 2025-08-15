/**
 * AI Mailing API Service
 * Frontend integration for AI-powered email marketing functions
 */

import axios from '@/http/axios'

// Types
export interface SubjectLineRequest {
  email_content: string
  campaign_type?: string
  industry?: string
  count?: number
}

export interface SubjectLineResponse {
  success: boolean
  subject_lines?: Array<{
    subject: string
    score: number
    reason: string
  }>
  tokens_used?: number
  error?: string
}

export interface ContentOptimizationRequest {
  subject: string
  content: string
  target_audience?: string
  goals?: string[]
}

export interface ContentOptimizationResponse {
  success: boolean
  analysis?: string
  tokens_used?: number
  error?: string
}

export interface CampaignAnalysisRequest {
  campaign_id: string
  include_recommendations?: boolean
}

export interface CampaignAnalysisResponse {
  success: boolean
  analysis?: string
  performance_data?: any
  tokens_used?: number
  error?: string
}

export interface SendTimeOptimizationRequest {
  contact_emails: string[]
  campaign_type?: string
}

export interface SendTimeOptimizationResponse {
  success: boolean
  recommendations?: string
  analyzed_contacts?: number
  tokens_used?: number
  error?: string
}

export interface TemplateGenerationRequest {
  template_type: string
  industry: string
  purpose: string
  tone?: string
  include_cta?: boolean
}

export interface TemplateGenerationResponse {
  success: boolean
  template?: string
  tokens_used?: number
  error?: string
}

export interface SegmentationAnalysisRequest {
  contact_data: Array<Record<string, any>>
  segmentation_goals: string[]
}

export interface SegmentationAnalysisResponse {
  success: boolean
  segmentation_analysis?: string
  analyzed_contacts?: number
  total_contacts?: number
  tokens_used?: number
  error?: string
}

export interface DeliverabilityInsightsRequest {
  campaign_id: string
  bounce_data?: Record<string, any>
}

export interface DeliverabilityInsightsResponse {
  success: boolean
  insights?: string
  metrics?: any
  tokens_used?: number
  error?: string
}

export interface AutomationSuggestionsRequest {
  business_type: string
  goals: string[]
  audience_size: number
}

export interface AutomationSuggestionsResponse {
  success: boolean
  workflow_suggestions?: string
  tokens_used?: number
  error?: string
}

export interface AIUsageStats {
  success: boolean
  plan?: {
    name: string
    max_ai_calls_daily?: number
    max_ai_tokens_monthly?: number
  }
  usage?: {
    daily_calls: number
    monthly_tokens: number
    daily_remaining: number | string
    monthly_tokens_remaining: number | string
  }
  error?: string
}

export const aiMailingApi = {
  // Get AI system status
  getStatus: async () => {
    const { data } = await axios.get('/ai-mailing/status')
    return data
  },

  // Generate optimized subject lines
  generateSubjectLines: async (request: SubjectLineRequest): Promise<SubjectLineResponse> => {
    const { data } = await axios.post<SubjectLineResponse>('/ai-mailing/generate-subject-lines', request)
    return data
  },

  // Optimize email content
  optimizeContent: async (request: ContentOptimizationRequest): Promise<ContentOptimizationResponse> => {
    const { data } = await axios.post<ContentOptimizationResponse>('/ai-mailing/optimize-content', request)
    return data
  },

  // Analyze campaign performance
  analyzeCampaign: async (request: CampaignAnalysisRequest): Promise<CampaignAnalysisResponse> => {
    const { data } = await axios.post<CampaignAnalysisResponse>('/ai-mailing/analyze-campaign', request)
    return data
  },

  // Optimize send time
  optimizeSendTime: async (request: SendTimeOptimizationRequest): Promise<SendTimeOptimizationResponse> => {
    const { data } = await axios.post<SendTimeOptimizationResponse>('/ai-mailing/optimize-send-time', request)
    return data
  },

  // Generate email template
  generateTemplate: async (request: TemplateGenerationRequest): Promise<TemplateGenerationResponse> => {
    const { data } = await axios.post<TemplateGenerationResponse>('/ai-mailing/generate-template', request)
    return data
  },

  // Analyze contact segmentation
  analyzeSegmentation: async (request: SegmentationAnalysisRequest): Promise<SegmentationAnalysisResponse> => {
    const { data } = await axios.post<SegmentationAnalysisResponse>('/ai-mailing/analyze-segmentation', request)
    return data
  },

  // Get deliverability insights
  getDeliverabilityInsights: async (request: DeliverabilityInsightsRequest): Promise<DeliverabilityInsightsResponse> => {
    const { data } = await axios.post<DeliverabilityInsightsResponse>('/ai-mailing/deliverability-insights', request)
    return data
  },

  // Get automation suggestions
  getAutomationSuggestions: async (request: AutomationSuggestionsRequest): Promise<AutomationSuggestionsResponse> => {
    const { data } = await axios.post<AutomationSuggestionsResponse>('/ai-mailing/automation-suggestions', request)
    return data
  },

  // Get AI usage statistics
  getUsageStats: async (): Promise<AIUsageStats> => {
    const { data } = await axios.get<AIUsageStats>('/ai-mailing/usage-stats')
    return data
  }
}

export default aiMailingApi 
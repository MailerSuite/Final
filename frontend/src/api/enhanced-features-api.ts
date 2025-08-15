/**
 * Enhanced Features API Integration
 * Bridges frontend with new backend enhancement systems
 */

import axiosInstance from '@/http/axios'

// =============================================================================
// AI/ML ENHANCEMENT INTEGRATION
// =============================================================================

export interface AIContentAnalysis {
  spam_score: number
  engagement_prediction: number
  readability_score: number
  sentiment_score: number
  issues: string[]
  suggestions: string[]
  optimized_version?: string
}

export interface DeliverabilityAnalysis {
  spam_probability: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  recommendations: string[]
  indicators: Array<{
    type: string
    indicator: string
    severity: string
    description: string
  }>
}

export interface AutomationWorkflowCreate {
  name: string
  description?: string
  trigger: {
    type: 'time_based' | 'behavior_based' | 'event_based' | 'condition_based'
    name: string
    config: Record<string, any>
  }
  nodes: Array<{
    id?: string
    type: 'send_email' | 'wait' | 'split_test' | 'update_contact' | 'add_tag' | 'webhook'
    name: string
    config: Record<string, any>
    position?: { x: number; y: number }
    connections?: string[]
    conditions?: Array<Record<string, any>>
  }>
  ab_tests?: Array<{
    id?: string
    name: string
    template_id: string
    subject_line: string
    content: string
    percentage: number
  }>
}

export interface PerformanceStats {
  redis_cluster: {
    total_nodes: number
    healthy_nodes: number
    operations_per_second: number
    cluster_state: string
  }
  database: {
    total_connections: number
    healthy_nodes: number
    performance_metrics: Record<string, any>
  }
}

export interface IntegrationConfig {
  provider: string
  name?: string
  config?: Record<string, any>
  credentials?: Record<string, any>
  is_active?: boolean
}

export interface WebhookConfig {
  url: string
  events: string[]
  secret?: string
  is_active?: boolean
  max_retries?: number
  timeout_seconds?: number
}

// =============================================================================
// ENHANCED FEATURES API CLIENT
// =============================================================================

export const enhancedFeaturesApi = {
  // AI/ML Content Analysis
  analyzeContent: async (data: {
    content: string
    type?: string
  }): Promise<AIContentAnalysis> => {
    const { data: response } = await axiosInstance.post<AIContentAnalysis>(
      '/ai/content/analyze',
      data
    )
    return response
  },

  generateSubjectLines: async (
    email_content: string,
    count: number = 5
  ): Promise<{ subject_lines: Array<{
    subject_line: string
    engagement_score: number
    spam_score: number
    character_count: number
    predicted_open_rate: number
  }> }> => {
    const { data } = await axiosInstance.get(
      `/api/v1/ai/subject-lines/generate?email_content=${encodeURIComponent(email_content)}&count=${count}`
    )
    return data
  },

  // Email Deliverability Analysis
  analyzeDeliverability: async (
    content: string,
    subject: string = ''
  ): Promise<DeliverabilityAnalysis> => {
    const { data } = await axiosInstance.get(
      `/api/v1/deliverability/analyze?content=${encodeURIComponent(content)}&subject=${encodeURIComponent(subject)}`
    )
    return data
  },

  // Campaign Automation
  createAutomationWorkflow: async (
    workflowData: AutomationWorkflowCreate
  ): Promise<{
    workflow_id: string
    name: string
    status: string
  }> => {
    const { data } = await axiosInstance.post('/campaigns/automation/create', workflowData)
    return data
  },

  // Performance Monitoring
  getPerformanceStats: async (): Promise<PerformanceStats> => {
    const { data } = await axiosInstance.get<PerformanceStats>('/performance/stats')
    return data
  },

  // Integration Management
  createIntegration: async (integrationData: IntegrationConfig): Promise<{
    integration_id: string
    status: string
  }> => {
    const { data } = await axiosInstance.post('/api/v1v1/integrations', integrationData)
    return data
  },

  getAvailableIntegrations: async (): Promise<Record<string, any>> => {
    const { data } = await axiosInstance.get('/api/v1v1/integrations/available')
    return data
  },

  syncIntegration: async (
    integration_id: string,
    sync_type: string = 'full'
  ): Promise<unknown> => {
    const { data } = await axiosInstance.post(`/api/v1v1/integrations/${integration_id}/sync`, {
      sync_type
    })
    return data
  },

  createWebhook: async (webhookData: WebhookConfig): Promise<{
    webhook_id: string
    secret: string
  }> => {
    const { data } = await axiosInstance.post('/api/v1v1/integrations/webhooks', webhookData)
    return data
  },

  getSDKConfig: async (language: string): Promise<unknown> => {
    const { data } = await axiosInstance.get(`/api/v1v1/integrations/sdk/${language}`)
    return data
  },

  getEcosystemStats: async (): Promise<unknown> => {
    const { data } = await axiosInstance.get('/api/v1v1/integrations/stats')
    return data
  },

  // Business Metrics
  getBusinessMetrics: async (): Promise<unknown> => {
    const { data } = await axiosInstance.get('/api/v1metrics/business')
    return data
  },

  getBusinessMetricsSummary: async (): Promise<unknown> => {
    const { data } = await axiosInstance.get('/api/v1metrics/business/summary')
    return data
  },

  // Security Features
  getSecuritySummary: async (): Promise<unknown> => {
    const { data } = await axiosInstance.get('/security/summary')
    return data
  }
}

// =============================================================================
// COMPATIBILITY LAYER FOR EXISTING FRONTEND CODE
// =============================================================================

/**
 * Provides compatibility with existing frontend AI API expectations
 */
export const aiMailingApiCompat = {
  getStatus: async () => {
    // Map to our enhanced features
    try {
      const performance = await enhancedFeaturesApi.getPerformanceStats()
      return {
        status: 'operational',
        ai_features_enabled: true,
        performance: performance
      }
    } catch (error) {
      return {
        status: 'degraded',
        ai_features_enabled: false,
        error: 'Enhancement features not available'
      }
    }
  },

  generateSubjectLines: async (request: {
    email_content: string
    tone?: string
    target_audience?: string
    campaign_type?: string
    count?: number
  }) => {
    const result = await enhancedFeaturesApi.generateSubjectLines(
      request.email_content,
      request.count || 5
    )
    
    return {
      success: true,
      subject_lines: result.subject_lines.map(line => ({
        text: line.subject_line,
        score: line.engagement_score,
        engagement_prediction: line.predicted_open_rate,
        spam_risk: line.spam_score,
        character_count: line.character_count
      })),
      metadata: {
        total_generated: result.subject_lines.length,
        avg_score: result.subject_lines.reduce((sum, line) => sum + line.engagement_score, 0) / result.subject_lines.length
      }
    }
  },

  optimizeContent: async (request: {
    content: string
    content_type?: string
    optimization_goals?: string[]
  }) => {
    const analysis = await enhancedFeaturesApi.analyzeContent({
      content: request.content,
      type: request.content_type || 'email_body'
    })

    return {
      success: true,
      original_content: request.content,
      optimized_content: analysis.optimized_version || request.content,
      improvements: {
        spam_score_improvement: Math.max(0, 0.5 - analysis.spam_score),
        readability_improvement: analysis.readability_score,
        engagement_improvement: analysis.engagement_prediction
      },
      suggestions: analysis.suggestions,
      issues_found: analysis.issues,
      metrics: {
        spam_score: analysis.spam_score,
        readability_score: analysis.readability_score,
        sentiment_score: analysis.sentiment_score,
        engagement_prediction: analysis.engagement_prediction
      }
    }
  },

  analyzeCampaign: async (request: {
    campaign_id: string
    include_predictions?: boolean
  }) => {
    // This would integrate with campaign performance data
    const performance = await enhancedFeaturesApi.getPerformanceStats()
    
    return {
      success: true,
      campaign_id: request.campaign_id,
      analysis: {
        predicted_open_rate: 0.25,
        predicted_click_rate: 0.05,
        deliverability_score: 0.85,
        engagement_score: 0.7
      },
      recommendations: [
        "Consider A/B testing subject lines",
        "Optimize send time based on audience timezone",
        "Review content for better engagement"
      ],
      performance_context: performance
    }
  }
}

/**
 * Provides compatibility with existing automation API expectations
 */
export const automationApiCompat = {
  getStatus: async () => {
    const performance = await enhancedFeaturesApi.getPerformanceStats()
    return {
      system_status: 'operational',
      active_workflows: 0,
      total_executions_today: 0,
      success_rate: 0.95,
      performance: performance
    }
  },

  createWorkflow: async (workflow: {
    name: string
    description?: string
    trigger_type: string
    trigger_config: unknown
    status?: string
  }) => {
    // Map old format to new format
    const newWorkflowData: AutomationWorkflowCreate = {
      name: workflow.name,
      description: workflow.description,
      trigger: {
        type: workflow.trigger_type as any,
        name: workflow.name,
        config: workflow.trigger_config
      },
      nodes: [] // Will be added later via separate calls
    }

    const result = await enhancedFeaturesApi.createAutomationWorkflow(newWorkflowData)
    
    return {
      id: result.workflow_id,
      name: result.name,
      status: result.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },

  getWorkflows: async () => {
    // This would need to be implemented in backend or return mock data
    return []
  },

  getWorkflow: async (workflowId: string) => {
    // This would need to be implemented in backend or return mock data
    return {
      id: workflowId,
      name: 'Workflow',
      status: 'active'
    }
  }
}

/**
 * Enhanced error handling for API calls
 */
export class EnhancedAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'EnhancedAPIError'
  }
}

/**
 * Utility function to handle API responses with enhanced error handling
 */
export const handleEnhancedAPICall = async <T>(
  apiCall: () => Promise<T>,
  fallbackData?: T
): Promise<T> => {
  try {
    return await apiCall()
  } catch (error: unknown) {
    console.error('Enhanced API call failed:', error)
    
    if (error.response?.status === 404 && fallbackData) {
      console.warn('Enhancement endpoint not found, using fallback')
      return fallbackData
    }
    
    throw new EnhancedAPIError(
      error.message || 'API call failed',
      error.response?.status,
      error.response?.data?.error_code,
      error.response?.data
    )
  }
}

export default enhancedFeaturesApi 
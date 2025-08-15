/**
 * Integrations API Client
 * Handles all integration management related API calls
 */

import { httpClient } from './http-client'

// ===== TYPES =====

export interface IntegrationProvider {
  id: string
  name: string
  display_name: string
  description?: string
  category: 'crm' | 'ecommerce' | 'analytics' | 'marketing'
  auth_type: 'oauth2' | 'api_key' | 'basic_auth' | 'webhook'
  auth_config: Record<string, any>
  api_base_url?: string
  api_version?: string
  supported_actions: string[]
  supported_data_types: string[]
  webhook_support: boolean
  real_time_sync: boolean
  config_schema: Record<string, any>
  required_fields: string[]
  logo_url?: string
  documentation_url?: string
  setup_instructions?: string
  is_active: boolean
  is_premium: boolean
  plan_requirements?: Record<string, any>
  usage_count: number
  created_at: string
  updated_at: string
}

export interface Integration {
  id: string
  session_id: string
  provider_id: string
  name: string
  description?: string
  status: 'active' | 'paused' | 'error' | 'disconnected'
  last_sync_at?: string
  last_error?: string
  sync_frequency: 'manual' | 'hourly' | 'daily' | 'weekly'
  total_syncs: number
  successful_syncs: number
  failed_syncs: number
  last_sync_duration?: number
  records_synced: number
  webhook_url?: string
  webhook_events?: string[]
  tags?: string[]
  notes?: string
  created_at: string
  updated_at: string
  provider?: IntegrationProvider
}

export interface IntegrationSyncLog {
  id: string
  integration_id: string
  sync_type: string
  sync_direction: string
  data_type: string
  status: string
  started_at: string
  completed_at?: string
  duration?: number
  records_processed: number
  records_created: number
  records_updated: number
  records_deleted: number
  records_failed: number
  error_message?: string
  sync_summary?: Record<string, any>
}

export interface FieldMapping {
  id: string
  integration_id: string
  source_field: string
  target_field: string
  field_type: string
  sync_direction: 'inbound' | 'outbound' | 'bidirectional'
  is_required: boolean
  is_unique: boolean
  transform_rules?: Record<string, any>
  default_value?: string
  validation_rules?: Record<string, any>
  is_active: boolean
  last_used_at?: string
  created_at: string
  updated_at: string
}

export interface IntegrationTemplate {
  id: string
  name: string
  description?: string
  category: string
  use_case: string
  provider_requirements: string[]
  field_mappings: Record<string, any>
  sync_settings: Record<string, any>
  webhook_events?: string[]
  difficulty_level: string
  estimated_setup_time?: number
  tags?: string[]
  icon?: string
  documentation_url?: string
  tutorial_url?: string
  usage_count: number
  rating?: number
  is_active: boolean
  is_featured: boolean
  is_premium: boolean
  created_at: string
  updated_at: string
}

// ===== REQUEST TYPES =====

export interface CreateIntegrationRequest {
  provider_id: string
  name: string
  description?: string
  auth_data: Record<string, any>
  config?: Record<string, any>
  field_mappings?: Record<string, any>
  sync_settings?: Record<string, any>
  sync_frequency?: string
  tags?: string[]
  notes?: string
}

export interface UpdateIntegrationRequest {
  name?: string
  description?: string
  auth_data?: Record<string, any>
  config?: Record<string, any>
  field_mappings?: Record<string, any>
  sync_settings?: Record<string, any>
  status?: string
  sync_frequency?: string
  tags?: string[]
  notes?: string
}

export interface SyncRequest {
  sync_direction: 'inbound' | 'outbound' | 'bidirectional'
  data_type: string
  sync_type?: 'manual' | 'scheduled' | 'webhook' | 'real_time'
  filters?: Record<string, any>
  options?: Record<string, any>
}

export interface SyncResponse {
  sync_id: string
  status: string
  message: string
  started_at?: string
}

export interface CreateFieldMappingRequest {
  source_field: string
  target_field: string
  field_type: string
  sync_direction?: 'inbound' | 'outbound' | 'bidirectional'
  is_required?: boolean
  is_unique?: boolean
  transform_rules?: Record<string, any>
  default_value?: string
  validation_rules?: Record<string, any>
}

export interface ConnectionTestResponse {
  success: boolean
  message: string
  error?: string
  response_time?: number
  details?: Record<string, any>
}

// ===== API CLIENT =====

class IntegrationsApi {
  private baseUrl = '/integrations'  // Remove the /api/v1 prefix since axios already has /api/v1

  // ===== PROVIDERS =====

  async getProviders(params?: {
    category?: string
    is_premium?: boolean
  }): Promise<IntegrationProvider[]> {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.append('category', params.category)
    if (params?.is_premium !== undefined) searchParams.append('is_premium', params.is_premium.toString())

    const url = searchParams.toString() ? `${this.baseUrl}/providers?${searchParams}` : `${this.baseUrl}/providers`
    const response = await httpClient.get(url)
    return response.data
  }

  async getProvider(providerId: string): Promise<IntegrationProvider> {
    const response = await httpClient.get(`${this.baseUrl}/providers/${providerId}`)
    return response.data
  }

  // ===== INTEGRATIONS =====

  async getIntegrations(params: {
    session_id: string
    category?: string
    status?: string
  }): Promise<Integration[]> {
    const searchParams = new URLSearchParams({ session_id: params.session_id })
    if (params.category) searchParams.append('category', params.category)
    if (params.status) searchParams.append('status', params.status)

    const response = await httpClient.get(`${this.baseUrl}?${searchParams}`)
    return response.data
  }

  async createIntegration(sessionId: string, integration: CreateIntegrationRequest): Promise<Integration> {
    const response = await httpClient.post(`${this.baseUrl}?session_id=${sessionId}`, integration)
    return response.data
  }

  async getIntegration(integrationId: string, sessionId: string): Promise<Integration> {
    const response = await httpClient.get(`${this.baseUrl}/${integrationId}?session_id=${sessionId}`)
    return response.data
  }

  async updateIntegration(
    integrationId: string, 
    sessionId: string, 
    updates: UpdateIntegrationRequest
  ): Promise<Integration> {
    const response = await httpClient.put(`${this.baseUrl}/${integrationId}?session_id=${sessionId}`, updates)
    return response.data
  }

  async deleteIntegration(integrationId: string, sessionId: string): Promise<{ message: string }> {
    const response = await httpClient.delete(`${this.baseUrl}/${integrationId}?session_id=${sessionId}`)
    return response.data
  }

  // ===== SYNC OPERATIONS =====

  async syncIntegration(
    integrationId: string, 
    sessionId: string, 
    syncRequest: SyncRequest
  ): Promise<SyncResponse> {
    const response = await httpClient.post(
      `${this.baseUrl}/${integrationId}/sync?session_id=${sessionId}`,
      syncRequest
    )
    return response.data
  }

  async getSyncLogs(
    integrationId: string,
    sessionId: string,
    params?: {
      limit?: number
      offset?: number
    }
  ): Promise<IntegrationSyncLog[]> {
    const searchParams = new URLSearchParams({ session_id: sessionId })
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())

    const response = await httpClient.get(`${this.baseUrl}/${integrationId}/sync-logs?${searchParams}`)
    return response.data
  }

  // ===== FIELD MAPPINGS =====

  async getFieldMappings(integrationId: string, sessionId: string): Promise<FieldMapping[]> {
    const response = await httpClient.get(`${this.baseUrl}/${integrationId}/field-maps?session_id=${sessionId}`)
    return response.data
  }

  async createFieldMapping(
    integrationId: string,
    sessionId: string,
    fieldMapping: CreateFieldMappingRequest
  ): Promise<FieldMapping> {
    const response = await httpClient.post(
      `${this.baseUrl}/${integrationId}/field-maps?session_id=${sessionId}`,
      fieldMapping
    )
    return response.data
  }

  async updateFieldMapping(
    fieldMappingId: string,
    sessionId: string,
    updates: Partial<CreateFieldMappingRequest>
  ): Promise<FieldMapping> {
    const response = await httpClient.put(
      `${this.baseUrl}/field-maps/${fieldMappingId}?session_id=${sessionId}`,
      updates
    )
    return response.data
  }

  async deleteFieldMapping(fieldMappingId: string, sessionId: string): Promise<{ message: string }> {
    const response = await httpClient.delete(`${this.baseUrl}/field-maps/${fieldMappingId}?session_id=${sessionId}`)
    return response.data
  }

  // ===== CONNECTION TESTING =====

  async testConnection(integrationId: string, sessionId: string): Promise<ConnectionTestResponse> {
    const response = await httpClient.post(`${this.baseUrl}/${integrationId}/test-connection?session_id=${sessionId}`)
    return response.data
  }

  // ===== TEMPLATES =====

  async getTemplates(params?: {
    category?: string
    use_case?: string
    difficulty_level?: string
  }): Promise<IntegrationTemplate[]> {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.append('category', params.category)
    if (params?.use_case) searchParams.append('use_case', params.use_case)
    if (params?.difficulty_level) searchParams.append('difficulty_level', params.difficulty_level)

    const url = searchParams.toString() ? `${this.baseUrl}/templates?${searchParams}` : `${this.baseUrl}/templates`
    const response = await httpClient.get(url)
    return response.data
  }

  // ===== BULK OPERATIONS =====

  async bulkSync(sessionId: string, request: {
    integration_ids: string[]
    sync_direction: 'inbound' | 'outbound' | 'bidirectional'
    data_type: string
    options?: Record<string, any>
  }): Promise<{
    total_integrations: number
    successful_syncs: number
    failed_syncs: number
    sync_ids: string[]
    errors: Array<{ integration_id: string; error: string }>
  }> {
    const response = await httpClient.post(`${this.baseUrl}/bulk-sync?session_id=${sessionId}`, request)
    return response.data
  }

  async pauseIntegrations(sessionId: string, integrationIds: string[]): Promise<{ message: string }> {
    const response = await httpClient.post(`${this.baseUrl}/bulk-pause?session_id=${sessionId}`, {
      integration_ids: integrationIds
    })
    return response.data
  }

  async resumeIntegrations(sessionId: string, integrationIds: string[]): Promise<{ message: string }> {
    const response = await httpClient.post(`${this.baseUrl}/bulk-resume?session_id=${sessionId}`, {
      integration_ids: integrationIds
    })
    return response.data
  }

  // ===== STATISTICS =====

  async getStatistics(sessionId: string): Promise<{
    total_integrations: number
    active_integrations: number
    failed_integrations: number
    total_syncs_today: number
    successful_syncs_today: number
    failed_syncs_today: number
    avg_sync_duration?: number
    most_used_providers: Array<{ provider_name: string; count: number }>
    recent_errors: Array<{ integration_name: string; error: string; timestamp: string }>
  }> {
    const response = await httpClient.get(`${this.baseUrl}/statistics?session_id=${sessionId}`)
    return response.data
  }

  // ===== PROVIDER SETUP =====

  async setupProvider(sessionId: string, request: {
    provider_id: string
    name: string
    auth_data: Record<string, any>
    config?: Record<string, any>
    test_connection?: boolean
  }): Promise<{
    integration_id: string
    setup_successful: boolean
    connection_test_passed: boolean
    message: string
    next_steps: string[]
    field_mapping_suggestions?: Array<{ source_field: string; target_field: string; confidence: number }>
  }> {
    const response = await httpClient.post(`${this.baseUrl}/setup?session_id=${sessionId}`, request)
    return response.data
  }
}

export const integrationsApi = new IntegrationsApi() 
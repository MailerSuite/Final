/**
 * Template Builder API Client
 * Handles all template builder related API calls
 */

import axiosInstance from '@/http/axios'

// ===== TYPES =====

export interface TemplateLayout {
  id: string
  session_id: string
  name: string
  description?: string
  category: string
  layout_type: 'single_column' | 'two_column' | 'three_column' | 'header_footer'
  grid_system: '12_column' | 'flexbox' | 'css_grid'
  layout_config: Record<string, any>
  container_settings: Record<string, any>
  mobile_config?: Record<string, any>
  tablet_config?: Record<string, any>
  background_color?: string
  background_image?: string
  custom_css?: string
  is_template: boolean
  is_public: boolean
  usage_count: number
  is_active: boolean
  created_at: string
  updated_at: string
  blocks?: TemplateBlock[]
}

export interface TemplateBlock {
  id: string
  layout_id: string
  block_type: string
  block_name?: string
  row_position: number
  column_position: number
  column_span: number
  row_span: number
  sort_order: number
  content: Record<string, any>
  styling: Record<string, any>
  mobile_settings?: Record<string, any>
  tablet_settings?: Record<string, any>
  is_editable: boolean
  is_removable: boolean
  is_movable: boolean
  display_conditions?: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TemplateBlockType {
  id: string
  type_name: string
  display_name: string
  description?: string
  category: string
  default_config: Record<string, any>
  config_schema: Record<string, any>
  available_styles: Record<string, any>
  default_styles: Record<string, any>
  icon?: string
  preview_image?: string
  thumbnail?: string
  supports_responsive: boolean
  supports_conditions: boolean
  min_height?: number
  max_height?: number
  is_active: boolean
  is_premium: boolean
  plan_requirements?: Record<string, any>
  usage_count: number
}

export interface TemplateTheme {
  id: string
  name: string
  description?: string
  category: string
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  text_color: string
  heading_font: string
  body_font: string
  font_sizes: Record<string, any>
  button_styles: Record<string, any>
  link_styles: Record<string, any>
  border_styles: Record<string, any>
  spacing_config: Record<string, any>
  preview_image?: string
  thumbnail?: string
  custom_css?: string
  is_active: boolean
  is_premium: boolean
  is_featured: boolean
  usage_count: number
  rating?: number
}

export interface TemplateBuilderSession {
  id: string
  user_session_id: string
  template_id?: string
  layout_id?: string
  session_name?: string
  current_state: Record<string, any>
  auto_save_data?: Record<string, any>
  last_activity: string
  changes_count: number
  is_active: boolean
  session_expired: boolean
  is_collaborative: boolean
  collaborators?: string[]
  created_at: string
  updated_at: string
}

// ===== REQUEST TYPES =====

export interface CreateLayoutRequest {
  name: string
  description?: string
  category?: string
  layout_type?: TemplateLayout['layout_type']
  grid_system?: TemplateLayout['grid_system']
  layout_config?: Record<string, any>
  container_settings?: Record<string, any>
  mobile_config?: Record<string, any>
  tablet_config?: Record<string, any>
  background_color?: string
  background_image?: string
  custom_css?: string
  is_template?: boolean
  is_public?: boolean
}

export interface UpdateLayoutRequest {
  name?: string
  description?: string
  category?: string
  layout_type?: TemplateLayout['layout_type']
  grid_system?: TemplateLayout['grid_system']
  layout_config?: Record<string, any>
  container_settings?: Record<string, any>
  mobile_config?: Record<string, any>
  tablet_config?: Record<string, any>
  background_color?: string
  background_image?: string
  custom_css?: string
  is_template?: boolean
  is_public?: boolean
}

export interface CreateBlockRequest {
  block_type: string
  block_name?: string
  row_position?: number
  column_position?: number
  column_span?: number
  row_span?: number
  sort_order?: number
  content?: Record<string, any>
  styling?: Record<string, any>
  mobile_settings?: Record<string, any>
  tablet_settings?: Record<string, any>
  is_editable?: boolean
  is_removable?: boolean
  is_movable?: boolean
  display_conditions?: Record<string, any>
}

export interface UpdateBlockRequest {
  block_type?: string
  block_name?: string
  row_position?: number
  column_position?: number
  column_span?: number
  row_span?: number
  sort_order?: number
  content?: Record<string, any>
  styling?: Record<string, any>
  mobile_settings?: Record<string, any>
  tablet_settings?: Record<string, any>
  is_editable?: boolean
  is_removable?: boolean
  is_movable?: boolean
  display_conditions?: Record<string, any>
}

export interface BuilderStateUpdate {
  current_state: Record<string, any>
  auto_save_data?: Record<string, any>
}

export interface GenerateTemplateRequest {
  template_name: string
  template_subject: string
  include_tracking?: boolean
  apply_theme_id?: string
}

export interface GenerateTemplateResponse {
  template_id: string
  message: string
  html_content: string
  text_content: string
  layout_id: string
  blocks_count: number
}

// ===== API CLIENT =====

class TemplateBuilderApi {
  private baseUrl = '/template-builder'  // Remove the /api/v1 prefix since axios already has /api/v1

  // ===== LAYOUTS =====

  async getLayouts(params: {
    session_id: string
    category?: string
    is_template?: boolean
    is_public?: boolean
  }): Promise<TemplateLayout[]> {
    const searchParams = new URLSearchParams({ session_id: params.session_id })
    if (params.category) searchParams.append('category', params.category)
    if (params.is_template !== undefined) searchParams.append('is_template', params.is_template.toString())
    if (params.is_public !== undefined) searchParams.append('is_public', params.is_public.toString())

    const response = await axiosInstance.get(`${this.baseUrl}/layouts?${searchParams}`)
    return response.data
  }

  async createLayout(sessionId: string, layout: CreateLayoutRequest): Promise<TemplateLayout> {
    const response = await axiosInstance.post(`${this.baseUrl}/layouts?session_id=${sessionId}`, layout)
    return response.data
  }

  async getLayout(layoutId: string, sessionId: string): Promise<TemplateLayout> {
    const response = await axiosInstance.get(`${this.baseUrl}/layouts/${layoutId}?session_id=${sessionId}`)
    return response.data
  }

  async updateLayout(layoutId: string, sessionId: string, updates: UpdateLayoutRequest): Promise<TemplateLayout> {
    const response = await axiosInstance.put(`${this.baseUrl}/layouts/${layoutId}?session_id=${sessionId}`, updates)
    return response.data
  }

  async deleteLayout(layoutId: string, sessionId: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`${this.baseUrl}/layouts/${layoutId}?session_id=${sessionId}`)
    return response.data
  }

  // ===== BLOCKS =====

  async createBlock(layoutId: string, sessionId: string, block: CreateBlockRequest): Promise<TemplateBlock> {
    const response = await axiosInstance.post(`${this.baseUrl}/layouts/${layoutId}/blocks?session_id=${sessionId}`, block)
    return response.data
  }

  async updateBlock(blockId: string, sessionId: string, updates: UpdateBlockRequest): Promise<TemplateBlock> {
    const response = await axiosInstance.put(`${this.baseUrl}/blocks/${blockId}?session_id=${sessionId}`, updates)
    return response.data
  }

  async deleteBlock(blockId: string, sessionId: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`${this.baseUrl}/blocks/${blockId}?session_id=${sessionId}`)
    return response.data
  }

  // ===== BLOCK TYPES =====

  async getBlockTypes(params?: {
    category?: string
    is_premium?: boolean
  }): Promise<TemplateBlockType[]> {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.append('category', params.category)
    if (params?.is_premium !== undefined) searchParams.append('is_premium', params.is_premium.toString())

    const url = searchParams.toString() ? `${this.baseUrl}/block-types?${searchParams}` : `${this.baseUrl}/block-types`
    const response = await axiosInstance.get(url)
    return response.data
  }

  // ===== THEMES =====

  async getThemes(params?: {
    category?: string
    is_premium?: boolean
  }): Promise<TemplateTheme[]> {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.append('category', params.category)
    if (params?.is_premium !== undefined) searchParams.append('is_premium', params.is_premium.toString())

    const url = searchParams.toString() ? `${this.baseUrl}/themes?${searchParams}` : `${this.baseUrl}/themes`
    const response = await axiosInstance.get(url)
    return response.data
  }

  // ===== BUILDER SESSIONS =====

  async createBuilderSession(params: {
    session_id: string
    template_id?: string
    layout_id?: string
    session_name?: string
  }): Promise<TemplateBuilderSession> {
    const searchParams = new URLSearchParams({ session_id: params.session_id })
    if (params.template_id) searchParams.append('template_id', params.template_id)
    if (params.layout_id) searchParams.append('layout_id', params.layout_id)
    if (params.session_name) searchParams.append('session_name', params.session_name)

    const response = await axiosInstance.post(`${this.baseUrl}/sessions?${searchParams}`)
    return response.data
  }

  async updateBuilderState(builderSessionId: string, sessionId: string, state: BuilderStateUpdate): Promise<{ message: string }> {
    const response = await axiosInstance.put(`${this.baseUrl}/sessions/${builderSessionId}/state?session_id=${sessionId}`, state)
    return response.data
  }

  // ===== TEMPLATE GENERATION =====

  async generateTemplate(layoutId: string, sessionId: string, request: GenerateTemplateRequest): Promise<GenerateTemplateResponse> {
    const searchParams = new URLSearchParams({
      session_id: sessionId,
      template_name: request.template_name,
      template_subject: request.template_subject
    })

    const response = await axiosInstance.post(`${this.baseUrl}/layouts/${layoutId}/generate-template?${searchParams}`)
    return response.data
  }

  // ===== BULK OPERATIONS =====

  async reorderBlocks(sessionId: string, blockOrders: Array<{
    block_id: string
    row_position: number
    column_position: number
    sort_order: number
  }>): Promise<{ message: string }> {
    const response = await axiosInstance.put(`${this.baseUrl}/blocks/reorder?session_id=${sessionId}`, {
      block_orders: blockOrders
    })
    return response.data
  }

  async duplicateLayout(layoutId: string, sessionId: string, newName: string): Promise<TemplateLayout> {
    const response = await axiosInstance.post(`${this.baseUrl}/layouts/${layoutId}/duplicate?session_id=${sessionId}`, {
      name: newName
    })
    return response.data
  }

  // ===== PREVIEW =====

  async previewLayout(layoutId: string, params?: {
    theme_id?: string
    device_type?: 'desktop' | 'tablet' | 'mobile'
    test_data?: Record<string, any>
  }): Promise<{
    html_content: string
    text_content: string
    css_content: string
    preview_url?: string
  }> {
    const response = await axiosInstance.post(`${this.baseUrl}/layouts/${layoutId}/preview`, params || {})
    return response.data
  }
}

export const templateBuilderApi = new TemplateBuilderApi() 
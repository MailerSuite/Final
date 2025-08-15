/**
 * Automation Management API
 * Frontend integration for automation workflows and drip campaigns
 */

import axiosInstance from '@/http/axios'

// Types
export interface AutomationWorkflow {
  id: string
  name: string
  description?: string
  trigger_type: 'email_signup' | 'form_submit' | 'date_based' | 'behavior_trigger' | 'manual'
  trigger_config: Record<string, any>
  status: 'draft' | 'active' | 'paused' | 'completed'
  is_active: boolean
  max_executions?: number
  execution_window_start?: string
  execution_window_end?: string
  timezone: string
  target_segments?: Record<string, any>[]
  exclusion_criteria?: Record<string, any>
  total_entries: number
  completed_executions: number
  failed_executions: number
  last_executed_at?: string
  next_execution_at?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface WorkflowAction {
  id: string
  workflow_id: string
  action_type: 'send_email' | 'wait' | 'condition' | 'tag_contact' | 'update_field'
  action_config: Record<string, any>
  sequence_order: number
  parent_action_id?: string
  delay_amount?: number
  delay_type?: 'minutes' | 'hours' | 'days' | 'weeks'
  conditions?: Record<string, any>
  email_template_id?: string
  subject_line?: string
  email_content?: string
  execution_count: number
  success_count: number
  failure_count: number
  is_active: boolean
  notes?: string
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  contact_email: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  current_action_id?: string
  next_action_id?: string
  started_at: string
  completed_at?: string
  next_execution_at?: string
  actions_completed: number
  total_actions: number
  completion_percentage: number
  last_error?: string
  retry_count: number
  emails_sent: number
  emails_opened: number
  emails_clicked: number
}

export interface WorkflowStatistics {
  workflow_id: string
  total_entries: number
  completed_executions: number
  failed_executions: number
  completion_rate: number
  average_completion_time: number
  emails_sent: number
  open_rate: number
  click_rate: number
  conversion_rate: number
  revenue_generated: number
}

export interface AutomationTemplate {
  id: string
  name: string
  description: string
  category: string
  workflow_config: Record<string, any>
  actions_config: Record<string, any>[]
  tags: string[]
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  estimated_setup_time: number
  usage_count: number
  rating?: number
  is_featured: boolean
}

export interface CreateWorkflowRequest {
  name: string
  description?: string
  trigger_type: string
  trigger_config: Record<string, any>
  execution_window_start?: string
  execution_window_end?: string
  timezone?: string
  target_segments?: Record<string, any>[]
  exclusion_criteria?: Record<string, any>
  tags?: string[]
}

export interface CreateActionRequest {
  action_type: string
  action_config: Record<string, any>
  sequence_order: number
  parent_action_id?: string
  delay_amount?: number
  delay_type?: string
  conditions?: Record<string, any>
  email_template_id?: string
  subject_line?: string
  email_content?: string
  notes?: string
}

export interface TriggerWorkflowRequest {
  contact_emails: string[]
  execution_context?: Record<string, any>
}

export interface AutomationStatus {
  system_status: 'operational' | 'degraded' | 'down'
  active_workflows: number
  total_executions_today: number
  pending_executions: number
  failed_executions_today: number
  last_processed_at: string
  processing_capacity: {
    max_concurrent: number
    current_load: number
    utilization_percentage: number
  }
}

export interface AutomationDashboard {
  overview: {
    total_workflows: number
    active_workflows: number
    total_executions: number
    success_rate: number
  }
  recent_activity: {
    workflow_id: string
    workflow_name: string
    action: string
    timestamp: string
    status: string
  }[]
  performance_metrics: {
    emails_sent_today: number
    open_rate_avg: number
    click_rate_avg: number
    conversion_rate_avg: number
  }
  top_performing_workflows: {
    workflow_id: string
    workflow_name: string
    completion_rate: number
    total_executions: number
  }[]
}

export const automationApi = {
  // System status
  getStatus: async (): Promise<AutomationStatus> => {
    const { data } = await axiosInstance.get<AutomationStatus>('/automation/status')
    return data
  },

  // Workflow management
  createWorkflow: async (workflow: CreateWorkflowRequest): Promise<AutomationWorkflow> => {
    const { data } = await axiosInstance.post<AutomationWorkflow>('/automation/workflow', workflow)
    return data
  },

  getWorkflows: async (): Promise<AutomationWorkflow[]> => {
    const { data } = await axiosInstance.get<AutomationWorkflow[]>('/automation/workflows')
    return data
  },

  getWorkflow: async (workflowId: string): Promise<AutomationWorkflow> => {
    const { data } = await axiosInstance.get<AutomationWorkflow>(`/automation/workflow/${workflowId}`)
    return data
  },

  updateWorkflowStatus: async (workflowId: string, status: string): Promise<AutomationWorkflow> => {
    const { data } = await axiosInstance.put<AutomationWorkflow>(
      `/automation/workflow/${workflowId}/status`,
      { status }
    )
    return data
  },

  // Workflow execution
  triggerWorkflow: async (
    workflowId: string, 
    request: TriggerWorkflowRequest
  ): Promise<{ success: boolean; execution_ids: string[] }> => {
    const { data } = await axiosInstance.post(
      `/api/v1/automation/workflow/${workflowId}/trigger`,
      request
    )
    return data
  },

  triggerWorkflowBulk: async (
    workflowId: string,
    contact_emails: string[],
    execution_context?: Record<string, any>
  ): Promise<{ success: boolean; execution_ids: string[]; failed_contacts: string[] }> => {
    const { data } = await axiosInstance.post(
      `/api/v1/automation/workflow/${workflowId}/trigger-bulk`,
      { contact_emails, execution_context }
    )
    return data
  },

  processPendingExecutions: async (): Promise<{ 
    processed: number; 
    failed: number; 
    message: string 
  }> => {
    const { data } = await axiosInstance.post('/api/v1automation/process-pending')
    return data
  },

  // Statistics and monitoring
  getWorkflowStatistics: async (workflowId: string): Promise<WorkflowStatistics> => {
    const { data } = await axiosInstance.get<WorkflowStatistics>(
      `/automation/workflow/${workflowId}/statistics`
    )
    return data
  },

  getExecutions: async (params?: {
    workflow_id?: string
    status?: string
    contact_email?: string
    limit?: number
    offset?: number
  }): Promise<{
    executions: WorkflowExecution[]
    total: number
    has_more: boolean
  }> => {
    const { data } = await axiosInstance.get('/api/v1automation/executions', { params })
    return data
  },

  getDashboard: async (): Promise<AutomationDashboard> => {
    const { data } = await axiosInstance.get<AutomationDashboard>('/automation/dashboard')
    return data
  },

  // Templates
  getTemplates: async (): Promise<AutomationTemplate[]> => {
    const { data } = await axiosInstance.get<AutomationTemplate[]>('/automation/templates')
    return data
  },

  createWorkflowFromTemplate: async (
    templateId: string,
    customization: Partial<CreateWorkflowRequest>
  ): Promise<AutomationWorkflow> => {
    const { data } = await axiosInstance.post<AutomationWorkflow>(
      `/automation/templates/${templateId}/create-workflow`,
      customization
    )
    return data
  },

  // Action management (if needed for detailed workflow builder)
  getWorkflowActions: async (workflowId: string): Promise<WorkflowAction[]> => {
    const { data } = await axiosInstance.get<WorkflowAction[]>(
      `/automation/workflow/${workflowId}/actions`
    )
    return data
  },

  createAction: async (
    workflowId: string,
    action: CreateActionRequest
  ): Promise<WorkflowAction> => {
    const { data } = await axiosInstance.post<WorkflowAction>(
      `/automation/workflow/${workflowId}/actions`,
      action
    )
    return data
  },

  updateAction: async (
    workflowId: string,
    actionId: string,
    updates: Partial<CreateActionRequest>
  ): Promise<WorkflowAction> => {
    const { data } = await axiosInstance.put<WorkflowAction>(
      `/automation/workflow/${workflowId}/actions/${actionId}`,
      updates
    )
    return data
  },

  deleteAction: async (workflowId: string, actionId: string): Promise<void> => {
    await axiosInstance.delete(`/api/v1automation/workflow/${workflowId}/actions/${actionId}`)
  },

  // Bulk operations
  pauseWorkflows: async (workflowIds: string[]): Promise<{ 
    success: number; 
    failed: number 
  }> => {
    const { data } = await axiosInstance.post('/api/v1automation/workflows/bulk/pause', {
      workflow_ids: workflowIds
    })
    return data
  },

  resumeWorkflows: async (workflowIds: string[]): Promise<{ 
    success: number; 
    failed: number 
  }> => {
    const { data } = await axiosInstance.post('/api/v1automation/workflows/bulk/resume', {
      workflow_ids: workflowIds
    })
    return data
  },

  deleteWorkflows: async (workflowIds: string[]): Promise<{ 
    success: number; 
    failed: number 
  }> => {
    const { data } = await axiosInstance.post('/api/v1automation/workflows/bulk/delete', {
      workflow_ids: workflowIds
    })
    return data
  }
}

// React Query hooks for automation
export const useAutomationStatus = () => {
  return {
    queryKey: ['automationStatus'],
    queryFn: automationApi.getStatus
  }
}

export const useWorkflows = () => {
  return {
    queryKey: ['workflows'],
    queryFn: automationApi.getWorkflows
  }
}

export const useWorkflow = (workflowId: string) => {
  return {
    queryKey: ['workflow', workflowId],
    queryFn: () => automationApi.getWorkflow(workflowId),
    enabled: !!workflowId
  }
}

export const useWorkflowStatistics = (workflowId: string) => {
  return {
    queryKey: ['workflowStatistics', workflowId],
    queryFn: () => automationApi.getWorkflowStatistics(workflowId),
    enabled: !!workflowId
  }
}

export const useAutomationDashboard = () => {
  return {
    queryKey: ['automationDashboard'],
    queryFn: automationApi.getDashboard
  }
} 
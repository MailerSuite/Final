import axios from '@/http/axios'
import type { components } from '@/types/openapi.d'

export type Plan = components['schemas']['Plan']
export type User = components['schemas']['User'] & {
  expiry_date: string | null
}
export type Ticket = components['schemas']['SupportTicket']
export type Stats = components['schemas']['AdminStats']
export type SystemOverview = components['schemas']['SystemOverview']
export type UserAdminView = components['schemas']['UserAdminView']
export type PlanDetails = components['schemas']['PlanDetails']
export type SupportTicketAdmin = components['schemas']['SupportTicketAdmin']

// Enhanced admin API with all endpoints
export const adminApi = {
  // User Management
  listUsers: async (params?: {
    skip?: number
    limit?: number
    search?: string
    status_filter?: string
    role_filter?: string
    plan_filter?: string
    sort_by?: string
    sort_order?: string
  }) => {
    const { data } = await axios.get<UserAdminView[]>('/api/v1/admin/users', { params })
    return data
  },

  getUser: async (userId: string) => {
    const { data } = await axios.get<UserAdminView>(`/api/v1/admin/users/${userId}`)
    return data
  },

  updateUser: async (userId: string, payload: Partial<User>) => {
    const { data } = await axios.put<UserAdminView>(`/api/v1/admin/users/${userId}`, payload)
    return data
  },

  deleteUser: async (userId: string, permanent: boolean = false) => {
    const { data } = await axios.delete(`/api/v1/admin/users/${userId}`, {
      params: { permanent }
    })
    return data
  },

  updateUserPlan: async (userId: string, plan: string) => {
    const { data } = await axios.put(`/api/v1/admin/users/${userId}/plan`, null, {
      params: { plan }
    })
    return data
  },

  // Plan Management
  listPlans: async (includeInactive: boolean = false) => {
    const { data } = await axios.get<PlanDetails[]>('/api/v1/admin/plans', {
      params: { include_inactive: includeInactive }
    })
    return data
  },

  createPlan: async (planData: unknown) => {
    const { data } = await axios.post<PlanDetails>('/api/v1/admin/plans', planData)
    return data
  },

  updatePlan: async (planId: string, planData: unknown) => {
    const { data } = await axios.put<PlanDetails>(`/api/v1/admin/plans/${planId}`, planData)
    return data
  },

  // Support Ticket Management
  listSupportTickets: async (params?: {
    skip?: number
    limit?: number
    status_filter?: string
    priority_filter?: string
    assigned_to?: string
    user_id?: string
    search?: string
  }) => {
    const { data } = await axios.get<SupportTicketAdmin[]>('/api/v1/admin/support-tickets', { params })
    return data
  },

  updateTicketStatus: async (ticketId: string, statusUpdate: unknown) => {
    const { data } = await axios.put(`/api/v1/admin/support-tickets/${ticketId}/status`, statusUpdate)
    return data
  },

  // Statistics and System Overview
  getAdminStats: async (timeRange: string = '30d') => {
    const { data } = await axios.get<Stats>('/api/v1/admin/stats', {
      params: { time_range: timeRange }
    })
    return data
  },

  getSystemOverview: async () => {
    const { data } = await axios.get<SystemOverview>('/api/v1/admin/system-overview')
    return data
  },

  // Admin Actions
  broadcastMessage: async (message: { subject: string; content: string }, targetUsers: string = 'all') => {
    const { data } = await axios.post('/api/v1/admin/actions/broadcast-message', message, {
      params: { target_users: targetUsers }
    })
    return data
  }
}

// Legacy functions for backward compatibility
/** List available plans */
export const listPlans = async () => {
  const { data } = await axios.get<Plan[]>('/api/v1/admin/plans')
  return data
}

/** List users */
export const listUsers = async () => {
  const { data } = await axios.get<User[]>('/api/v1/admin/users')
  return data
}

/** Update user */
export const updateUser = async (id: string, payload: Partial<User>) => {
  const { data } = await axios.put<User>(`/api/v1/admin/users/${id}`, payload)
  return data
}

/** List support tickets */
export const listTickets = async () => {
  const { data } = await axios.get<Ticket[]>('/api/v1/admin/support-tickets')
  return data
}

/** Get admin stats */
export const getStats = async () => {
  const { data } = await axios.get<Stats>('/api/v1/admin/stats')
  return data
}

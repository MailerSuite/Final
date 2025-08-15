import axios from './axios'
import type {
  components,
  operations,
} from '../types/openapi'
import { getSessionId } from '@/utils/getSessionId'
import type {
  Session,
  IMAPAccount,
  ProxyServer,
  EmailTemplate,
  Campaign,
  JobLog,
  Domain,
  DomainPayload,
} from '../types'

export type TokenResponse = components['schemas']['Token']
export type RegisterRequest = components['schemas']['UserCreate']
export type LoginRequest = components['schemas']['UserLogin']
export type User = components['schemas']['User']
export type HealthResponse = components['schemas']['HealthResponse']

export const authApi = {
  register: (data: RegisterRequest) =>
    axios.post<TokenResponse>('/api/v1/auth/register', data),
  login: (data: LoginRequest) =>
    axios.post<TokenResponse>('/api/v1/auth/login', data),
  me: () => axios.get<User>('/api/v1/auth/me'),
  updateProfile: (data: {
    username: string
    email: string
  }) => axios.put<User>('/api/v1/auth/me', data),
  changePassword: (data: { password: string }) =>
    axios.put('/api/v1/auth/password', data),
  verify: () => axios.post<string>('/api/v1/auth/verify-token'),
}

export const healthApi = {
  health: () => axios.get<HealthResponse>('/health/'),
  ready: () => axios.get<string>('/health/ready'),
  live: () => axios.get<string>('/health/live'),
}



export type SMTPAccountPayload = components['schemas']['SMTPAccountCreate']
export type SMTPAccountResponse = components['schemas']['SMTPAccount']

export const smtpApi = {
  list: (sessionId: number) =>
    axios.get<SMTPAccountResponse[]>(`/smtp/${sessionId}/accounts`),
  bulkUpload: (sessionId: number, data: string) =>
    axios.post(`/smtp/${sessionId}/bulk-upload`, { data }),
  testConnection: (data: SMTPAccountPayload) =>
    axios.post<SMTPAccountResponse>('/smtp/test', data),
  testAccountsFromFile: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return axios.post('/smtp/test-file', form);
  },
}

export const sessionApi = {
  list: () => axios.get<Session[]>('/api/v1/sessions/'),
  create: (name: string) => axios.post<Session>('/api/v1/sessions/', { name }),
  remove: (id: string) => axios.delete(`/api/v1/sessions/${id}`),
}

export const imapApi = {
  list: (sessionId: string) =>
    axios.get<IMAPAccount[]>(`/imap/${sessionId}/accounts`),
  bulkUpload: (sessionId: string, data: string) =>
    axios.post(`/imap/${sessionId}/bulk-upload-from-email`, null, {
      params: { email_data: data },
    }),
  delete: (sessionId: string, id: string) =>
    axios.delete(`/imap/${sessionId}/accounts/${id}`),
}

export const proxyApi = {
  list: (sessionId: string) =>
    axios
      .get<unknown[]>(`/proxies/${sessionId}/proxies`)
      .then((res) => ({
        ...res,
        data: res.data.map((p) => ({
          id: p.id,
          ip_address: p.ip_address || p.host,
          port: p.port,
          is_firewall_enabled: p.is_firewall_enabled,
          is_custom_proxy: p.is_custom_proxy,
          last_checked_at: p.last_checked_at,
          response_time: p.response_time,
          country: p.country,
          is_valid: p.is_valid,
        })) as ProxyServer[],
      })),
  create: (
    sessionId: string,
    payload: {
      ip_address: string
      port: number
      username?: string
      password?: string
      proxy_type?: string
    }
  ) =>
    axios
      .post<unknown>(`/proxies/${sessionId}/proxies`, {
        proxy_type: 'socks5',
        ...payload,
      })
      .then((res) => ({
        ...res,
        data: {
          id: res.data.id,
          ip_address: res.data.ip_address || res.data.host,
          port: res.data.port,
          is_firewall_enabled: res.data.is_firewall_enabled,
          is_custom_proxy: res.data.is_custom_proxy,
          last_checked_at: res.data.last_checked_at,
          response_time: res.data.response_time,
          country: res.data.country,
          is_valid: res.data.is_valid,
        } as ProxyServer,
      })),
  bulkUpload: (sessionId: string, data: string) =>
    axios.post(`/proxies/${sessionId}/bulk-upload`, null, {
      params: { proxy_data: data },
    }),
  delete: (sessionId: string, id: string) =>
    axios.delete(`/proxies/${sessionId}/proxies/${id}`),
  toggleFirewall: (sessionId: string, id: string, enabled: boolean) =>
    axios
      .patch<unknown>(`/proxies/${sessionId}/proxies/${id}`, {
        is_firewall_enabled: enabled,
      })
      .then((res) => ({
        ...res,
        data: {
          id: res.data.id,
          ip_address: res.data.ip_address || res.data.host,
          port: res.data.port,
          is_firewall_enabled: res.data.is_firewall_enabled,
          is_custom_proxy: res.data.is_custom_proxy,
          last_checked_at: res.data.last_checked_at,
          response_time: res.data.response_time,
          country: res.data.country,
          is_valid: res.data.is_valid,
        } as ProxyServer,
      })),
  updateTags: (sessionId: string, id: string, tags: string[]) =>
    axios.patch<unknown>(`/proxies/${sessionId}/proxies/${id}`, { tags }),
  updatePool: (sessionId: string, id: string, pool: string) =>
    axios.patch<unknown>(`/proxies/${sessionId}/proxies/${id}`, { pool }),
  getTags: (sessionId: string) =>
    axios.get<string[]>(`/proxies/${sessionId}/tags`),
  getPools: (sessionId: string) =>
    axios.get<string[]>(`/proxies/${sessionId}/pools`),
  createPool: (sessionId: string, name: string) =>
    axios.post(`/proxies/${sessionId}/pools`, { name }),
  deletePool: (sessionId: string, name: string) =>
    axios.delete(`/proxies/${sessionId}/pools/${name}`),
}

export interface LeadBasePayload {
  name: string
  country: string
  comment: string
}

export interface LeadBaseResponse {
  id: number
  name: string
  country: string
  comment: string
  status: string
  leads_count: number
  created_at: string
  updated_at: string
}

export const leadBaseApi = {
  list: (query: string) => axios.get<LeadBaseResponse[]>(`/lead-bases/?${query}`),
  create: (data: LeadBasePayload) => axios.post<LeadBaseResponse>('/lead-bases/', data),
  update: (id: number, data: LeadBasePayload) => axios.put<LeadBaseResponse>(`/lead-bases/${id}`, data),
  upload: (id: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return axios.post(`/lead-bases/${id}/upload`, form)
  },
  remove: (id: number) => axios.delete(`/lead-bases/${id}`),
}

export const domainApi = {
  list: (sessionId: number) =>
    axios.get<Domain[]>(`/sessions/${sessionId}/domains`),
  create: (sessionId: number, data: DomainPayload) =>
    axios.post<Domain>(`/sessions/${sessionId}/domains`, data),
  check: (sessionId: number, id: number | string) =>
    axios.post(`/api/v1/domains/${sessionId}/domains/${id}/check`),
  bulkUpload: (sessionId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return axios.post<Domain[]>(
      `/sessions/${sessionId}/domains/bulk-upload`,
      form,
    )
  },
  remove: (sessionId: number, id: number) =>
    axios.delete(`/sessions/${sessionId}/domains/${id}`),
}

export const dashboardApi = {
  overview: () => axios.get('/dashboard/overview'),
  analytics: () => {
    const sessionId = getSessionId()
    if (!sessionId) {
      console.error('❌ session_id not found')
      return Promise.reject(new Error('session_id not found'))
    }
    return axios.get('/dashboard/analytics', {
      params: { session_id: sessionId },
    })
  },
}


export type EmailTemplateCreate = components['schemas']['EmailTemplateCreate']
export type EmailTemplateUpdate = components['schemas']['EmailTemplateUpdate']

export const templateApi = {
  list: (params?: Record<string, unknown>) =>
    axios.get<EmailTemplate[]>('/templates', { params }),
  get: (id: string) => axios.get<EmailTemplate>(`/templates/${id}`),
  create: (data: EmailTemplateCreate) => axios.post('/templates', data),
  update: (id: string, data: EmailTemplateUpdate) =>
    axios.put(`/templates/${id}`, data),
  remove: (id: string) => axios.delete(`/templates/${id}`),
  uploadAttachment: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return axios.post(`/templates/${id}/attachments`, form)
  },
  preview: (id: string, data: Record<string, unknown>) =>
    axios.post(`/templates/${id}/preview`, data),
  duplicate: (id: string, newName: string) =>
    axios.post(`/templates/${id}/duplicate`, { new_name: newName }),
  importFromFile: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return axios.post('/templates/import/file', form)
  },
  importFromUrl: (url: string) => axios.post('/templates/import/url', { url }),
  randomize: (data: components['schemas']['HTMLRandomizeRequest']) =>
    axios.post<components['schemas']['HTMLRandomizeResponse']>(
      '/templates/randomize',
      data,
    ),
}

export const campaignsApi = {
  list: (sessionId: string) =>
    axios.get<Campaign[]>(`/sessions/${sessionId}/campaigns`),
  create: (sessionId: string, data: Partial<Campaign>) =>
    axios.post<Campaign>(`/sessions/${sessionId}/campaigns`, data),
  get: (sessionId: string, id: string) =>
    axios.get<Campaign>(`/sessions/${sessionId}/campaigns/${id}`),
  remove: (sessionId: string, id: string) =>
    axios.delete(`/sessions/${sessionId}/campaigns/${id}`),
  start: (sessionId: string, id: string) =>
    axios.post(`/sessions/${sessionId}/campaigns/${id}/start`),
  pause: (sessionId: string, id: string) =>
    axios.post(`/sessions/${sessionId}/campaigns/${id}/pause`),
  stop: (sessionId: string, id: string) =>
    axios.post(`/sessions/${sessionId}/campaigns/${id}/stop`),
  progress: (sessionId: string, id: string) =>
    axios.get<JobLog[]>(`/sessions/${sessionId}/campaigns/${id}/analytics`),
}

export interface ComposeEmailPayload {
  email_data: string
  file?: File | null
  smtpMode?: string
  smtpIds?: string[]
  count?: number
  templates?: string[]
}

export const composeApi = {
  send: (payload: ComposeEmailPayload) => {
    const form = new FormData()
    form.append('email_data', payload.email_data)
    if (payload.file) {
      form.append('file', payload.file)
    }
    if (payload.smtpMode) form.append('smtp_mode', payload.smtpMode)
    if (payload.smtpIds) payload.smtpIds.forEach((id) => form.append('smtp_ids', id))
    if (payload.count !== undefined) form.append('count', String(payload.count))
    if (payload.templates) payload.templates.forEach((t) => form.append('templates', t))
    return axios.post('/compose/compose/send', form)
  },
  sendTest: (payload: Record<string, unknown>) =>
    axios.post('/emails/test', payload),
}


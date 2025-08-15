import axios from '@/http/axios'
import type { EmailTemplate } from '@/types'

/** List templates */
export const listTemplates = async (params?: Record<string, unknown>) => {
  const { data } = await axios.get<EmailTemplate[]>('/templates', { params })
  return data
}

/** Get template by id */
export const getTemplate = async (id: string) => {
  const { data } = await axios.get<EmailTemplate>(`/templates/${id}`)
  return data
}

/** Create template */
export const createTemplate = async (payload: Partial<EmailTemplate>) => {
  const { data } = await axios.post<EmailTemplate>('/templates', payload)
  return data
}

/** Update template */
export const updateTemplate = async (
  id: string,
  payload: Partial<EmailTemplate>
) => {
  const { data } = await axios.put<EmailTemplate>(`/templates/${id}`, payload)
  return data
}

/** Delete template */
export const deleteTemplate = async (id: string) => {
  await axios.delete(`/templates/${id}`)
}

/** Upload attachment */
export const uploadAttachment = async (id: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await axios.post(`/templates/${id}/attachments`, form)
  return data
}

/** Preview template with macros */
export const previewTemplate = async (
  id: string,
  payload: Record<string, unknown>
) => {
  const { data } = await axios.post(`/templates/${id}/preview`, payload)
  return data
}

/** Duplicate template with new name */
export const duplicateTemplate = async (id: string, newName: string) => {
  const { data } = await axios.post(`/templates/${id}/duplicate`, {
    new_name: newName,
  })
  return data
}

export const fetchTemplates = (workspaceId: string) =>
  axios.get(`/api/v1/templates/`, { params: { session_id: workspaceId } })

/** Fetch available randomization options */
export const fetchTemplateOptions = async () => {
  const { data } = await axios.get<Record<string, boolean>>('/templates/options')
  return data
}

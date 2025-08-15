import axios from '@/http/axios'
import type { LeadBase, CreateLeadBaseData } from '@/types/leads'

/** List lead bases */
export const listLeadBases = async (query = '') => {
  const { data } = await axios.get<LeadBase[]>(`/lead-bases/?${query}`)
  return data
}

/** Create a new lead base */
export const createLeadBase = async (payload: CreateLeadBaseData) => {
  const { data } = await axios.post<LeadBase>('/lead-bases/', payload)
  return data
}

/** Update lead base */
export const updateLeadBase = async (
  id: string,
  payload: Partial<CreateLeadBaseData>
) => {
  const { data } = await axios.put<LeadBase>(`/lead-bases/${id}`, payload)
  return data
}

/** Upload leads to base */
export const uploadLeads = async (id: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await axios.post(`/lead-bases/${id}/upload`, form)
  return data
}

/** Remove lead base */
export const deleteLeadBase = async (id: string) => {
  await axios.delete(`/lead-bases/${id}`)
}

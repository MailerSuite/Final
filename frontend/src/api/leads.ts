import axios from '@/http/axios'
import type { LeadEntryList, LeadEntry, LeadEntryUpdate, ValidateEmailResult } from '@/types/leads'

export const listLeads = async (baseId: string, query = ''): Promise<LeadEntryList> => {
  const { data } = await axios.get(`/lead-bases/${baseId}/leads/?${query}`)
  return data as LeadEntryList
}

export const getLead = async (id: string): Promise<LeadEntry> => {
  const { data } = await axios.get(`/leads/${id}`)
  return data as LeadEntry
}

export const updateLead = async (id: string, payload: LeadEntryUpdate): Promise<LeadEntry> => {
  const { data } = await axios.put(`/leads/${id}`, payload)
  return data as LeadEntry
}

export const deleteLead = async (id: string): Promise<void> => {
  await axios.delete(`/leads/${id}`)
}

export const validateLead = async (id: string): Promise<ValidateEmailResult> => {
  const { data } = await axios.post(`/leads/${id}/validate-email`)
  return data as ValidateEmailResult
}

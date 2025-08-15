export interface LeadBase {
  id: string
  name: string
  country: string
  upload_date: string
  comment: string
  status: "new" | "processing" | "completed" | "failed"
  leads_count: number
  valid_count: number
  invalid_count: number
  duplicate_count: number
  bounced_count: number
  junk_count: number
  created_at: string
  updated_at: string
}

export interface CreateLeadBaseData {
  id: string
  name: string
  country: string
  comment: string
  session_id?: string
}

export interface LeadEntry {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  status: 'new' | 'valid' | 'invalid' | 'bounced' | 'duplicate' | 'junk'
  lead_base_id: string
  validation_error: string | null
  last_validated: string | null
  is_blacklisted: boolean
  created_at: string
  updated_at: string
}

export interface LeadEntryList {
  leads: LeadEntry[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface ValidateEmailResult {
  message: string
  lead_id: string
  email_verified: boolean
  error: string | null
}

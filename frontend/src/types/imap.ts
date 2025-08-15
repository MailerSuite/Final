export interface IMAPAccount {
  id: string
  session_id?: string | null
  imap_server: string
  imap_port: number
  email: string
  password: string
  use_oauth: boolean | null
  status?: string | null
  last_check?: string | null
  inbox_count: number | null
  response_time?: number | null
  error_message?: string | null
  created_at?: string | null
}

export interface IMAPMessage {
  id: string
  uid: string
  subject?: string | null
  sender?: string | null
  date?: string | null
  body_preview?: string | null
  is_read: boolean
  has_attachments: boolean
  folder: string
  account_id: string
}

export interface IMAPRetrieveResponse {
  status?: string
  messages?: {
    uid: number
    subject?: string
    sender?: string
    received_at?: string
    preview?: string
  }[]
  /** Error string returned by the backend when status is omitted */
  error?: string
  /** Detailed error information from the backend */
  detail?: string
}

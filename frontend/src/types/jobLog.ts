export interface EmailJob {
  id: string
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  mode: string
  total_emails: number
  sent_emails: number
  failed_emails: number
  progress: number
  created_at: string
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  config: Record<string, unknown>
}

export interface JobLog {
  id: string
  job_id: string
  level: string
  message: string
  details: Record<string, unknown>
  created_at: string
}

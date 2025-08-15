export interface Campaign {
  id: string;
  session_id: number;
  name: string;
  template_id: string;
  status: string;
  sent_count: number;
  success_count: number;
  error_count: number;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface CampaignCreate {
  name: string
  template_id: string
  subject?: string
  lead_base_ids: string[]
  batch_size: number
  delay_between_batches: number
  threads_count: number
  autostart: boolean
  proxy_type: 'none' | 'http' | 'https' | 'socks'
  proxy_host?: string
  proxy_port?: number
  proxy_username?: string
  proxy_password?: string
  retry_limit: number
  smtps: string[]
  proxies: string[]
  subjects: string[]
  templates: string[]
  content_blocks: Record<string, unknown>[]
}

// Define the full API response structure for a single campaign's details
export interface FullCampaignDetailsResponse {
  campaign: {
    id: string
    name: string
    template_id: string // UUID
    subject: string
    status: "draft" | "running" | "paused" | "stopped" | "completed" | "failed"
    total_recipients: number
    sent_count: number
    delivered_count: number
    opened_count: number
    clicked_count: number
    bounced_count: number
    batch_size: number
    delay_between_batches: number
    threads_count: number // API uses threads_count
    proxy_type: string
    proxy_host: string
    proxy_port: number
    proxy_username: string
    proxy_password: string
    created_at: string
    started_at: string | null
    completed_at: string | null
  }
  template: {
    name: string
    subject: string
    html_content: string
    text_content: string
    macros: Record<string, any>
    id: string // UUID
    attachments: Array<{
      filename: string
      content_type: string
      size: number
      path: string
    }>
    created_at: string
    updated_at: string
  }
  smtp_accounts: Array<{
    server: string
    port: number
    email: string
    password: string
    country: string
    id: string // UUID
    session_id: string
    status: "pending" | "active" | "failed"
    discovery_status: "pending" | "completed" | "failed"
    last_checked: string
    response_time: number
    error_message: string
    created_at: string
  }>
  proxies: Array<{
    host: string
    port: number
    username: string
    password: string
    proxy_type: "socks5" | "http" | "https"
    id: string // UUID
    status: "pending" | "active" | "failed"
    last_checked: string
    response_time: number
    error_message: string
    created_at: string
  }>
  domains: Array<{
    url: string
    domain_type: string
    country: string
    id: string // UUID
    status: "none" | "active" | "inactive"
    auth_status: boolean
    last_checked: string
    response_time: number
    error_message: string
    created_at: string
    updated_at: string
  }>
}

export interface EmailData {
    to: string
    from: string
    subject: string
    html_content?: string
    text_content?: string
    cc?: string
    bcc?: string
    reply_to?: string
    priority?: "high" | "normal" | "low"
    headers?: Record<string, string>
}

export interface ComposeEmailRequest {
    email_data: EmailData
    attachments?: File[]
    smtp_id?: string
    proxy_id?: string
    smtpMode?: 'all' | 'specific'
    smtpIds?: string[]
    count?: number
    templates?: string[]
}

export interface SMTPAccount {
    id: string
    server: string
    email: string
    status: string
    sender_name?: string
}

export interface ProxyAccount {
    id: string
    ip_address: string
    port: number
    status: string
}

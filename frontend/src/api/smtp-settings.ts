import { apiClient } from '@/http/stable-api-client'

export interface SmtpSettingsResponse {
    SMTP_DEFAULT_TIMEOUT: number
    SMTP_RATE_LIMIT_PER_HOUR: number
    SMTP_MAX_RETRIES: number
    SMTP_MAX_DELAY: number
}

export interface SmtpSettingsUpdate {
    SMTP_DEFAULT_TIMEOUT?: number
    SMTP_RATE_LIMIT_PER_HOUR?: number
    SMTP_MAX_RETRIES?: number
    SMTP_MAX_DELAY?: number
}

export async function getSmtpSettings(): Promise<SmtpSettingsResponse> {
    return apiClient.get<SmtpSettingsResponse>('/api/v1/smtp-settings/settings')
}

export async function updateSmtpSettings(payload: SmtpSettingsUpdate): Promise<SmtpSettingsResponse> {
    return apiClient.put<SmtpSettingsResponse>('/api/v1/smtp-settings/settings', payload)
}


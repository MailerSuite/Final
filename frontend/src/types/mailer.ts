export interface ComposeDraft {
  smtpAccountId?: string
  templateId?: string
  subject?: string
  body?: string
  testEmailCount: number
  smtpMode?: 'all' | 'specific'
  smtpIds: string[]
  count: number
  templates: string[]
}

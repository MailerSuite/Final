export type CheckStatus = 'inbox' | 'junk' | 'not_arrived'

export interface CheckResult {
  id: string
  ranAt: string
  summary?: string
  status?: CheckStatus
  lastResponse?: string | null
  lastError?: string | null
}

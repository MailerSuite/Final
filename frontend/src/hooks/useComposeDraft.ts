import { useState, useEffect } from 'react'
import type { ComposeDraft } from '@/types/mailer'

const STORAGE_KEY = 'composeDraft'

const DEFAULT_DRAFT: ComposeDraft = {
  testEmailCount: 1,
  smtpMode: 'all',
  smtpIds: [],
  count: 1,
  templates: [],
}

export default function useComposeDraft() {
  const [draft, setDraft] = useState<ComposeDraft>(() => {
    if (typeof window === 'undefined') return DEFAULT_DRAFT
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? { ...DEFAULT_DRAFT, ...JSON.parse(stored) } : DEFAULT_DRAFT
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  }, [draft])

  return [draft, setDraft] as const
}

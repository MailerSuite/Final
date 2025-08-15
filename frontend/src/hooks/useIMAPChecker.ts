import { useState, useCallback, useRef, useEffect } from 'react'
import imapService, { IMAPTestResult } from '@/services/imapService'

export default function useIMAPChecker(accountId?: string) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IMAPTestResult | null>(null)
  const mounted = useRef(true)

  const runTest = useCallback(async () => {
    if (!accountId) return
    setLoading(true)
    const res = await imapService.test(accountId)
    if (mounted.current) {
      setResult(res)
      setLoading(false)
    }
  }, [accountId])

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return { loading, result, runTest }
}

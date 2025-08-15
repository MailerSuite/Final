import { useState } from 'react'
import { checkBlacklist, BlacklistResult } from '@/api/proxy'
import { toast } from '@/hooks/smtp-checker/use-toast'

export function useBlacklistCheck() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Record<string, BlacklistResult>>({})
  const [error, setError] = useState<string | null>(null)

  const runCheck = async (addresses: string[], providers?: string[]) => {
    setLoading(true)
    setError(null)
    try {
      const data = await checkBlacklist(addresses, providers)
      setResults((prev) => {
        const updated = { ...prev }
        data.forEach((r) => {
          updated[r.address] = r
        })
        return updated
      })
    } catch (err: unknown) {
      setError(err?.message || 'Failed to check blacklist')
      toast({ description: 'Blacklist check failed', severity: 'critical' })
    } finally {
      setLoading(false)
    }
  }

  return { loading, results, error, runCheck }
}

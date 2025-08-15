import { useState } from 'react'
import axios from '@/http/axios'
import type { ProxyCheckResults } from '@/components/ProxyCheckResults'

/** Hook to activate proxy for a session and retrieve connectivity results */
export function useActivateProxy() {
  const [results, setResults] = useState<ProxyCheckResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activate = async (sessionId: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.patch<ProxyCheckResults>(
        `/sessions/${sessionId}/active`,
      )
      setResults(data)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Activation failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return { results, loading, error, activate }
}
export default useActivateProxy

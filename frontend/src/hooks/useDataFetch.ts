import { useEffect, useState } from 'react'

export function useDataFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    fetcher()
      .then((res) => {
        if (isMounted) setData(res)
      })
      .catch((err) => {
        if (isMounted) setError(err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, deps)

  return { data, loading, error }
}

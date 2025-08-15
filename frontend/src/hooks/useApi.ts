import { useState } from 'react'
import { apiClient } from '@/http/stable-api-client'
import { toast as showToast } from 'sonner'

export default function useApi(method: string, url: string, body?: any) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const call = async () => {
    setLoading(true)
    try {
      const res = await apiClient[method.toLowerCase() as 'get'|'post'|'put'|'patch'|'delete'](url, body)
      setData(res)
      if (method.toLowerCase() !== 'get') {
        showToast((res as any)?.message || 'Operation successful', {
          type: 'success',
        })
      }
      return res
    } catch (e: any) {
      setError(e)
      showToast(e.response?.data?.message || e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, call }
}

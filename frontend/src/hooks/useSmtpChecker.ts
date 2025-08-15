import { useCallback, useEffect, useRef, useState } from 'react'
import { request } from '@/http/apiClient'
import { discoverSmtpHosts } from '@/api/discovery'
import type { components } from '@/types/openapi'

export type SmtpMode = 'auto' | 'starttls' | 'ssl'

type SMTPAccountCreate = components['schemas']['SMTPAccountCreate']
type SMTPBulkTestResponse = components['schemas']['SMTPBulkTestResponse']

export type SmtpConfig = SMTPAccountCreate

export interface SmtpCheckResult {
  status: 'pending' | 'success' | 'error'
  message: string
  data?: SmtpBulkTestResponse['results'][number]
}

export function useSmtpChecker(initial: SmtpConfig[] = []) {
  const [configs, setConfigs] = useState<SmtpConfig[]>(initial)
  const [results, setResults] = useState<Record<number, SmtpCheckResult>>({})
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController>()

  const runCheck = useCallback(
    async (mode: SmtpMode = 'auto') => {
      if (isLoading) return {}
      setIsLoading(true)
      const controller = new AbortController()
      abortRef.current = controller
      const resMap: Record<number, SmtpCheckResult> = {}
      const list = [...configs]
      for (let i = 0; i < list.length; i++) {
        const cfg = list[i]
        let server = cfg.server
        if (!server) {
          const discovery = await discoverSmtpHosts({ email: cfg.email })
          server = discovery.results[0]?.hostname || ''
        }
        if (controller.signal.aborted) break
        try {
          const payload = {
            accounts: [
              {
                server,
                port: cfg.port,
                email: cfg.email,
                password: cfg.password ?? '',
                timeout: undefined,
              },
            ],
            timeout: undefined,
            max_concurrent: 5,
          }
          const data = await request<SMTPBulkTestResponse>({
            url: '/api/v1/smtp/test-batch',
            method: 'POST',
            data: payload,
            signal: controller.signal,
          })
          resMap[i] = {
            status: 'success',
            message: data.results[0]?.status || 'ok',
            data: data.results[0],
          }
        } catch (e: unknown) {
          if (controller.signal.aborted) break
          resMap[i] = { status: 'error', message: e.message }
        }
        setResults({ ...resMap })
      }
      setResults(resMap)
      setIsLoading(false)
      return resMap
    },
    [configs, isLoading],
  )

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  return { configs, setConfigs, results, isLoading, runCheck }
}

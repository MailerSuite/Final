import React from 'react'
import { checkBackendHealth, type HealthCheckResult } from '@/utils/api-health'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ApiHealthBanner() {
  const [visible, setVisible] = React.useState(false)
  const [checking, setChecking] = React.useState(false)
  const [result, setResult] = React.useState<HealthCheckResult | null>(null)

  const runCheck = React.useCallback(async () => {
    try {
      setChecking(true)
      const r = await checkBackendHealth()
      setResult(r)
      setVisible(r.status !== 'online')
    } finally {
      setChecking(false)
    }
  }, [])

  React.useEffect(() => {
    runCheck()
  }, [runCheck])

  if (!visible) return null

  return (
    <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 px-3 py-2 flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 mt-0.5" />
      <div className="text-xs leading-relaxed">
        <div className="font-medium">Backend unreachable or unhealthy</div>
        <div>
          {result?.error || 'The API health check failed. Ensure the backend on port 8000 is running.'}
        </div>
      </div>
      <button
        className="ml-auto inline-flex items-center gap-1 text-amber-100 hover:text-white text-xs px-2 py-1 rounded-md border border-amber-400/30 hover:bg-amber-400/10"
        onClick={runCheck}
        disabled={checking}
        title="Retry health check"
      >
        <RefreshCw className={"w-3 h-3 " + (checking ? 'animate-spin' : '')} />
        Retry
      </button>
      <button
        className="ml-2 text-amber-200/80 hover:text-amber-100 text-xs"
        onClick={() => setVisible(false)}
        title="Dismiss"
      >
        Dismiss
      </button>
    </div>
  )
}

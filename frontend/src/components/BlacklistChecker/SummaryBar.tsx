import { useMemo } from 'react'
import { ProviderCheck } from '@/api/blacklist'
import { mapStatus } from './status'

interface Props {
  results: ProviderCheck[]
}

export default function SummaryBar({ results }: Props) {
  const counts = useMemo(() => {
    return results.reduce(
      (acc, r) => {
        const s = mapStatus(r.status as any)
        acc[s]++
        return acc
      },
      { clear: 0, listed: 0, error: 0 }
    )
  }, [results])

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-md p-8">
      <div className="flex gap-4 text-sm font-medium text-foreground">
        <span>✅ {counts.clear} clear</span>
        <span>❌ {counts.listed} listed</span>
        <span>⚠️ {counts.error} error</span>
      </div>
    </div>
  )
}

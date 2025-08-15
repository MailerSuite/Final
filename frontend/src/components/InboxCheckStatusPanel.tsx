import React from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { cn } from '@/lib/utils'
import { StepResult } from '@/api/inboxCheckService'

interface Props {
  results?: StepResult[] | null
  loading?: boolean
}

const STEPS = ['Domain', 'Template', 'Proxy', 'SMTP', 'IMAP']

export default function InboxCheckStatusPanel({ results, loading }: Props) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      {loading && (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      )}
      <ul className="space-y-2">
        {STEPS.map((step) => {
          const res = results?.find((r) => r.step === step)
          const status = res?.status
          return (
            <li key={step} className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={cn('font-medium flex-1', status === 'fail' && 'text-destructive')}>
                  {step}
                </span>
                {status && (
                  <span className={cn('text-green-600', status === 'fail' && 'text-red-500')}>
                    {status === 'pass' ? '✓' : '✗'}
                  </span>
                )}
                {res?.timestamp && (
                  <span className="text-xs text-muted-foreground">{res.timestamp}</span>
                )}
              </div>
              {res?.error && (
                <p className="text-xs text-red-500 ml-4">{res.error}</p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

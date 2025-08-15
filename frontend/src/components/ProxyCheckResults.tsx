import React from 'react'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from './LoadingSpinner'
import { Alert, AlertDescription } from './ui/alert'

/** Result of a single host connectivity check */
export interface HostCheck {
  port: 25 | 587 | 465
  host: string
  status: 'success' | 'failure'
}

/** Array of connectivity results */
export type ProxyCheckResults = HostCheck[]

interface Props {
  /** List of host check results */
  results?: ProxyCheckResults | null
  /** Loading indicator */
  loading?: boolean
  /** Optional error message */
  error?: string | null
}

export default function ProxyCheckResults({ results, loading, error }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-6" data-testid="loading">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4" role="alert">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!results || results.length === 0) return null

  const grouped: Record<number, HostCheck[]> = {}
  for (const res of results) {
    if (!grouped[res.port]) grouped[res.port] = []
    grouped[res.port].push(res)
  }

  const ports = Object.keys(grouped).map(Number).sort((a, b) => a - b)

  return (
    <div className="space-y-6">
      {ports.map((port) => (
        <div key={port} className="space-y-2">
          <h3 className="font-medium text-sm">Port {port}</h3>
          <table className="w-full text-sm" role="table">
            <thead>
              <tr>
                <th className="text-left p-2">Host</th>
                <th className="text-center p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {grouped[port].map((h) => (
                <tr key={h.host} className="border-t border-border dark:border-border">
                  <td className="p-2 break-all">{h.host}</td>
                  <td className="p-2 text-center">
                    {h.status === 'success' ? (
                      <CheckCircleIcon
                        aria-label="success"
                        className="w-5 h-5 text-green-500 inline"
                      />
                    ) : (
                      <XCircleIcon
                        aria-label="failure"
                        className="w-5 h-5 text-red-500 inline"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

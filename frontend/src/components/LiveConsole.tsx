import { useEffect, useRef } from 'react'

import ProgressBar from './ProgressBar'

interface Props {
  /** Array of preformatted log objects */
  logs?: { timestamp: string; message: string }[]
  /** Raw log lines, each will be timestamped when rendered */
  lines?: string[]
  isRunning?: boolean
  progress?: number
}

export default function LiveConsole({ logs = [], lines = [], isRunning, progress }: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, lines])

  const entries = logs.length > 0
    ? logs
    : lines.map((m) => ({ timestamp: new Date().toLocaleTimeString(), message: m }))

  return (
    <div
      className="border bg-card rounded-md p-3 text-green-400 font-mono text-sm h-64 overflow-y-auto"
      role="log"
      aria-live="polite"
    >
      <ProgressBar progress={progress} active={isRunning} />
      {entries.map((l, i) => (
        <div key={i}>
          <span className="text-muted-foreground mr-2">[{l.timestamp}]</span>
          {l.message}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  )
}

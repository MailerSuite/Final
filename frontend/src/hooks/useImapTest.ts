import { useEffect, useRef, useState } from 'react'
import { startImapTest, stopImapTest, subscribeImapLogs } from '@/lib/api/imap'

interface LogEntry {
  timestamp: string
  message: string
}

export function useImapTest(accountId: string) {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const sourceRef = useRef<EventSource | null>(null)

  const startTest = async () => {
    if (isRunning) return
    try {
      await startImapTest(accountId)
      setIsRunning(true)
      sourceRef.current = subscribeImapLogs(accountId, (line) => {
        setLogs((prev) => [
          ...prev,
          { timestamp: new Date().toLocaleTimeString(), message: line },
        ])
      })
    } catch (error: any) {
      const detail = error?.response?.data?.detail || error?.response?.data?.error
      console.error('Failed to start IMAP test:', detail || error)
    }
  }

  const stopTest = async () => {
    if (!isRunning) return
    try {
      await stopImapTest()
    } catch (error: any) {
      const detail = error?.response?.data?.detail || error?.response?.data?.error
      console.error('Failed to stop IMAP test:', detail || error)
    }
    setIsRunning(false)
    sourceRef.current?.close()
    sourceRef.current = null
  }

  const clearLogs = () => setLogs([])

  useEffect(() => {
    return () => {
      sourceRef.current?.close()
    }
  }, [])

  return { isRunning, logs, startTest, stopTest, clearLogs }
}

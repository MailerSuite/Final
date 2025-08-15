import { useState, useRef, useEffect } from 'react'
import { chunkList } from '@/utils/emailList'
import type { ComposeEmailPayload, BulkJobStatus } from '@/services/emailService'
import { sendEmail, getJobStatus } from '@/services/emailService'

interface Options {
  concurrency?: number
}

export function useBulkMailer(options?: Options) {
  const { concurrency = 5 } = options || {}
  const [progress, setProgress] = useState(0)
  const controllerRef = useRef<AbortController>(new AbortController())

  useEffect(() => {
    return () => controllerRef.current.abort()
  }, [])

  const sendBulk = async (list: ComposeEmailPayload[]) => {
    const controller = new AbortController()
    controllerRef.current = controller
    const chunks = chunkList(list, concurrency)
    let sent = 0
    for (const chunk of chunks) {
      if (controller.signal.aborted) break
      await Promise.all(
        chunk.map((p) => sendEmail(p, controller.signal).catch(() => {}))
      )
      sent += chunk.length
      setProgress(Math.round((sent / list.length) * 100))
    }
  }

  const checkStatus = async (
    id: string,
  ): Promise<Pick<BulkJobStatus, 'sent' | 'failed' | 'total' | 'status'>> => {
    const { sent, failed, total, status } = await getJobStatus(
      id,
      controllerRef.current.signal,
    )
    return { sent, failed, total, status }
  }

  const cancel = () => {
    controllerRef.current.abort()
    controllerRef.current = new AbortController()
  }

  return { sendBulk, progress, cancel, checkStatus }
}

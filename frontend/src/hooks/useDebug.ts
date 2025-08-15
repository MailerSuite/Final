import { useCallback } from 'react'
import { debugSystem } from '@/utils/debug'

/**
 * React hook that provides access to the debug system
 * Returns helpers: logInfo, logWarn, logError, logPerf
 */
export function useDebug() {
  const logInfo = useCallback((message: string, data?: any) => {
    debugSystem.logInfo(message, data)
  }, [])

  const logWarn = useCallback((message: string, data?: any) => {
    debugSystem.logWarn(message, data)
  }, [])

  const logError = useCallback((message: string, data?: any) => {
    debugSystem.logError(message, data)
  }, [])

  const logPerf = useCallback(<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> => {
    return debugSystem.logPerf(label, fn)
  }, [])

  const getSummary = useCallback(() => {
    return debugSystem.getSummary()
  }, [])

  const exportLogs = useCallback(() => {
    debugSystem.exportLogs()
  }, [])

  return {
    logInfo,
    logWarn, 
    logError,
    logPerf,
    getSummary,
    exportLogs
  }
} 
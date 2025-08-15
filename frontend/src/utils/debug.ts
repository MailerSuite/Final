import type { AxiosInstance, AxiosError } from 'axios'

// Extend InternalAxiosRequestConfig to include metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime?: number
    }
  }
}

// 🔍 Enhanced Debug System - TypeScript Edition
// Features: Axios interceptors, CORS detection, remote logging, React integration

interface DebugLogEntry {
  timestamp: string
  level: 'LOG' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'PERF' | 'NETWORK'
  runtime: string
  message: string
  data?: any
  traceId?: string
}

interface NetworkEvent {
  method: string
  url: string
  status?: number
  elapsedMs: number
  error?: string
  isCorsError?: boolean
  requestBody?: any
  responseBody?: any
}

interface PerformanceEntry {
  label: string
  duration: number
  startTime: number
  endTime: number
}

class ExtendedDebugSystem {
  private startTime: number = Date.now()
  private logs: DebugLogEntry[] = []
  private maxLogs: number = 1000
  private isEnabled: boolean
  private remoteLoggingEnabled: boolean
  private originalConsole: any = {}
  private performance: {
    renders: number
    apiCalls: number
    errors: number
    startTime: number
  }

  constructor() {
    this.isEnabled = import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true'
    this.remoteLoggingEnabled = import.meta.env.VITE_ENABLE_REMOTE_DEBUG === 'true'
    
    if (!this.isEnabled) {
      return this.createNoOpLogger()
    }

    this.performance = {
      renders: 0,
      apiCalls: 0,
      errors: 0,
      startTime: Date.now()
    }

    this.setupGlobalErrorHandling()
    this.interceptConsole()
    this.setupKeyboardShortcuts()
    this.logInfo('🚀 Extended Debug System initialized', {
      remoteLogging: this.remoteLoggingEnabled,
      shortcuts: 'Ctrl+Shift+D (summary), Ctrl+Shift+E (export)'
    })
  }

  // AXIOS INTERCEPTOR SETUP
  setupAxiosInterceptors(axiosInstance: AxiosInstance): void {
    if (!this.isEnabled) return

    // Request interceptor
    axiosInstance.interceptors.request.use(
      (config) => {
        const startTime = performance.now()
        config.metadata = { startTime }
        
        this.logNetwork('REQUEST', {
          method: config.method?.toUpperCase() || 'GET',
          url: config.url || '',
          baseURL: config.baseURL,
          fullURL: `${config.baseURL || ''}${config.url || ''}`,
          requestBody: this.trimRequestBody(config.data)
        })
        
        return config
      },
      (error) => {
        this.handleAxiosError(error, 'request')
        return Promise.reject(error)
      }
    )

    // Response interceptor
    axiosInstance.interceptors.response.use(
      (response) => {
        const endTime = performance.now()
        const startTime = response.config.metadata?.startTime || endTime
        const elapsedMs = endTime - startTime
        
        this.performance.apiCalls++
        
        const networkEvent: NetworkEvent = {
          method: response.config.method?.toUpperCase() || 'GET',
          url: response.config.url || '',
          status: response.status,
          elapsedMs: Math.round(elapsedMs),
          responseBody: this.trimResponseBody(response.data)
        }
        
        this.logNetwork('RESPONSE', networkEvent)
        this.sendRemoteLog('network_success', networkEvent)
        
        return response
      },
      (error) => {
        const endTime = performance.now()
        const startTime = error.config?.metadata?.startTime || endTime
        const elapsedMs = endTime - startTime
        
        this.handleAxiosError(error, 'response', elapsedMs)
        return Promise.reject(error)
      }
    )
  }

  private handleAxiosError(error: AxiosError, phase: string, elapsedMs?: number): void {
    const isCorsError = this.detectCorsError(error)
    
    const networkEvent: NetworkEvent = {
      method: error.config?.method?.toUpperCase() || 'UNKNOWN',
      url: error.config?.url || '',
      status: error.response?.status,
      elapsedMs: Math.round(elapsedMs || 0),
      error: error.message,
      isCorsError
    }

    if (isCorsError) {
      console.groupCollapsed('%c⚠️ NETWORK ERROR - CORS Detected', 'color:#ff6b6b; font-weight:bold')
      console.error('CORS Error Details:', {
        url: networkEvent.url,
        method: networkEvent.method,
        error: error.message,
        suggestions: [
          'Check if the API server is running',
          'Verify CORS configuration on the server',
          'Ensure the request origin is allowed',
          'Check if the request method is supported'
        ]
      })
      console.groupEnd()
    } else {
      this.logError('🚫 Network Error', networkEvent)
    }

    this.sendRemoteLog('network_error', networkEvent)
    this.performance.errors++
  }

  private detectCorsError(error: AxiosError): boolean {
    // CORS errors often have no response and specific error messages
    if (!error.response && error.request) {
      const message = error.message.toLowerCase()
      return message.includes('network error') || 
             message.includes('cors') || 
             message.includes('access-control') ||
             error.code === 'ERR_NETWORK'
    }
    return false
  }

  private trimRequestBody(data: any): any {
    if (!data) return null
    const str = JSON.stringify(data)
    return str.length > 500 ? str.substring(0, 500) + '... (trimmed)' : data
  }

  private trimResponseBody(data: any): any {
    if (!data) return null
    const str = JSON.stringify(data)
    return str.length > 1000 ? str.substring(0, 1000) + '... (trimmed)' : data
  }

  // CONSOLE INTERCEPTION
  private interceptConsole(): void {
    this.originalConsole = {
      log: console.log,
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error
    }

    console.log = (...args) => this.log('LOG', ...args)
    console.debug = (...args) => this.log('DEBUG', ...args) 
    console.info = (...args) => this.log('INFO', ...args)
    console.warn = (...args) => this.log('WARN', ...args)
    console.error = (...args) => this.log('ERROR', ...args)
  }

  // GLOBAL ERROR HANDLING
  private setupGlobalErrorHandling(): void {
    window.addEventListener('error', (event) => {
      const errorData = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }
      
      this.logError('💥 Unhandled Error', errorData)
      this.sendRemoteLog('unhandled_error', errorData)
    })

    window.addEventListener('unhandledrejection', (event) => {
      const errorData = {
        reason: event.reason,
        stack: event.reason?.stack
      }
      
      this.logError('🚫 Unhandled Promise Rejection', errorData)
      this.sendRemoteLog('unhandled_rejection', errorData)
    })
  }

  // KEYBOARD SHORTCUTS
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault()
        const summary = this.getSummary()
        console.log('🔍 Debug Summary:', summary)
        this.sendRemoteLog('debug_summary', summary)
      }
      
      if (event.ctrlKey && event.shiftKey && event.key === 'E') {
        event.preventDefault()
        this.exportLogs()
      }
    })
  }

  // LOGGING METHODS
  log(level: DebugLogEntry['level'], ...args: any[]): void {
    const timestamp = this.formatTimestamp()
    const runtime = Date.now() - this.startTime
    const traceId = this.generateTraceId()

    const logEntry: DebugLogEntry = {
      timestamp,
      level,
      runtime: `${runtime}ms`,
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '),
      data: args.length > 1 ? args.slice(1) : undefined,
      traceId
    }

    this.logs.push(logEntry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    const emoji = {
      LOG: '📝',
      DEBUG: '🔍',
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌',
      PERF: '⚡',
      NETWORK: '🌐'
    }[level] || '📝'

    const color = {
      LOG: 'color: #888',
      DEBUG: 'color: #0066cc',
      INFO: 'color: #00aa00',
      WARN: 'color: #ff8800',
      ERROR: 'color: #cc0000',
      PERF: 'color: #9933cc',
      NETWORK: 'color: #0099cc'
    }[level] || 'color: #888'

    // Prefix with CURSOR:DEBUG: for Cursor memory
    const cursorPrefix = `CURSOR:DEBUG: ${emoji} [${timestamp}] ${level}`
    
    this.originalConsole.log(
      `%c${cursorPrefix}`,
      color,
      ...args
    )

    // Send to remote logging if enabled
    if (level === 'ERROR' || level === 'WARN') {
      this.sendRemoteLog('console_log', logEntry)
    }
  }

  logInfo(message: string, data?: any): void {
    this.log('INFO', message, data)
  }

  logWarn(message: string, data?: any): void {
    this.log('WARN', message, data)
  }

  logError(message: string, data?: any): void {
    this.log('ERROR', message, data)
    this.performance.errors++
  }

  logPerf<T>(label: string, fn: () => T): T
  logPerf<T>(label: string, fn: () => Promise<T>): Promise<T>
  logPerf<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = fn()
      
      if (result instanceof Promise) {
        return result.finally(() => {
          const endTime = performance.now()
          const duration = endTime - startTime
          this.logPerfResult(label, duration, startTime, endTime)
        })
      } else {
        const endTime = performance.now()
        const duration = endTime - startTime
        this.logPerfResult(label, duration, startTime, endTime)
        return result
      }
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      this.logError(`Performance test failed: ${label}`, { duration: `${duration.toFixed(2)}ms`, error })
      throw error
    }
  }

  private logPerfResult(label: string, duration: number, startTime: number, endTime: number): void {
    const perfEntry: PerformanceEntry = {
      label,
      duration: Math.round(duration * 100) / 100,
      startTime,
      endTime
    }
    
    this.log('PERF', `${label}: ${perfEntry.duration}ms`, perfEntry)
    this.sendRemoteLog('performance', perfEntry)
  }

  private logNetwork(type: 'REQUEST' | 'RESPONSE', data: any): void {
    this.log('NETWORK', `${type}: ${data.method} ${data.url}`, data)
  }

  // REMOTE LOGGING
  private async sendRemoteLog(eventType: string, data: any): Promise<void> {
    if (!this.remoteLoggingEnabled) return

    try {
      const payload = {
        event_type: eventType,
        timestamp: new Date().toISOString(),
        data,
        user_agent: navigator.userAgent,
        url: window.location.href,
        trace_id: this.generateTraceId()
      }

      // Use fetch to avoid circular dependency with axios
              await fetch('/debug/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      })
    } catch (error) {
      // Silently fail remote logging to avoid infinite loops
      this.originalConsole.warn('Remote logging failed:', error)
    }
  }

  // UTILITY METHODS
  private formatTimestamp(): string {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`
  }

  private generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  getSummary() {
    const runtime = Date.now() - this.startTime
    return {
      runtime: `${(runtime / 1000).toFixed(1)}s`,
      totalLogs: this.logs.length,
      errorCount: this.performance.errors,
      apiCalls: this.performance.apiCalls,
      renders: this.performance.renders,
      logsByLevel: this.logs.reduce((acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  exportLogs(): void {
    const dataStr = JSON.stringify({
      summary: this.getSummary(),
      logs: this.logs
    }, null, 2)
    
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    this.logInfo('📥 Debug logs exported')
  }

  // React integration method
  captureRenderError(error: Error, errorInfo: any): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
    
    this.logError('⚛️ React Render Error', errorData)
    this.sendRemoteLog('react_error', errorData)
    this.performance.errors++
  }

  // No-op fallback
  private createNoOpLogger(): ExtendedDebugSystem {
    const noop = () => {}
    const noopReturn = () => this
    
    const methods = [
      'setupAxiosInterceptors', 'log', 'logInfo', 'logWarn', 'logError', 
      'logPerf', 'getSummary', 'exportLogs', 'captureRenderError'
    ]
    
    methods.forEach(method => {
      (this as any)[method] = method === 'logPerf' ? (label: string, fn: any) => fn() : 
                             method === 'getSummary' ? () => ({}) : noop
    })
    
    return this
  }
}

// Export singleton instance
export const debugSystem = new ExtendedDebugSystem()

// Export types for TypeScript consumers
export type { DebugLogEntry, NetworkEvent, PerformanceEntry }

// Make it available globally for console access
declare global {
  interface Window {
    DebugSystem: ExtendedDebugSystem
  }
}

window.DebugSystem = debugSystem 
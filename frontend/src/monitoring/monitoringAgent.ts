import { useConsoleMonitorStore } from '@/store/consoleMonitor'

export interface MonitoringAgentOptions {
  enabled?: boolean
  captureLevels?: Array<'error' | 'warn' | 'info' | 'debug'>
  componentName?: string
}

interface MonitoringAgentAPI {
  enable: () => void
  disable: () => void
  isEnabled: () => boolean
  toggleOverlay: () => void
  addNote: (message: string, level?: 'info' | 'debug' | 'warn' | 'error') => void
}

let isInitialized = false
let agentEnabled = false
const originalConsole: Partial<Record<'error' | 'warn' | 'info' | 'debug', (...args: unknown[]) => void>> = {}

export function initMonitoringAgent(options: MonitoringAgentOptions = {}): MonitoringAgentAPI {
  if (isInitialized) return (window as any).MonitoringAgent

  const captureLevels = options.captureLevels || ['error', 'warn']
  const component = options.componentName || 'frontend'

  const store = useConsoleMonitorStore.getState()

  const addLog = (
    level: 'error' | 'warn' | 'info' | 'debug',
    message: string,
    data?: any
  ) => {
    useConsoleMonitorStore.getState().addLog({
      level: level === 'error' ? 'error' : level === 'warn' ? 'warn' : level === 'info' ? 'info' : 'debug',
      component,
      message,
      data,
    })
  }

  const wrapConsole = () => {
    ;(['error', 'warn', 'info', 'debug'] as const).forEach((level) => {
      originalConsole[level] = console[level]
      console[level] = (...args: unknown[]) => {
        try {
          if (agentEnabled && captureLevels.includes(level)) {
            const message = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
            addLog(level, message, args.length > 1 ? args.slice(1) : undefined)
          }
        } catch {}
        // always forward to original
        originalConsole[level]?.(...args as any)
      }
    })
  }

  const unwrapConsole = () => {
    ;(['error', 'warn', 'info', 'debug'] as const).forEach((level) => {
      if (originalConsole[level]) {
        console[level] = originalConsole[level] as any
      }
    })
  }

  const onWindowError = (event: ErrorEvent) => {
    if (!agentEnabled) return
    addLog('error', event.message || 'Unhandled Error', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: (event as any).error?.stack,
    })
  }

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (!agentEnabled) return
    const reason: unknown = event.reason
    const message = typeof reason === 'string' ? reason : reason?.message || 'Unhandled Promise Rejection'
    addLog('error', message, { reason })
  }

  // Keyboard toggle: Ctrl+Shift+L
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.shiftKey && (event.key === 'L' || event.key === 'l')) {
      event.preventDefault()
      useConsoleMonitorStore.getState().toggle()
    }
  }

  const enable = () => {
    if (agentEnabled) return
    agentEnabled = true
  }

  const disable = () => {
    agentEnabled = false
  }

  // Initialize hooks
  wrapConsole()
  window.addEventListener('error', onWindowError)
  window.addEventListener('unhandledrejection', onUnhandledRejection as any)
  window.addEventListener('keydown', onKeyDown)

  isInitialized = true
  agentEnabled = Boolean(options.enabled)

  const api: MonitoringAgentAPI = {
    enable,
    disable,
    isEnabled: () => agentEnabled,
    toggleOverlay: () => useConsoleMonitorStore.getState().toggle(),
    addNote: (message: string, level = 'info') => addLog(level, message),
  }

  ;(window as any).MonitoringAgent = api
  return api
}

// Ambient declaration for global access
declare global {
  interface Window {
    MonitoringAgent: MonitoringAgentAPI
  }
}

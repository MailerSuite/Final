import { create } from 'zustand'

export type ConsoleLogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success'

export interface ConsoleLogEntry {
  id: string
  timestamp: Date
  level: ConsoleLogLevel
  component: string
  message: string
  data?: any
}

interface ConsoleMonitorState {
  logs: ConsoleLogEntry[]
  visible: boolean
  maxLogs: number
  addLog: (entry: Omit<ConsoleLogEntry, 'id' | 'timestamp'> & Partial<Pick<ConsoleLogEntry, 'timestamp' | 'id'>>) => void
  clear: () => void
  toggle: () => void
  show: () => void
  hide: () => void
}

export const useConsoleMonitorStore = create<ConsoleMonitorState>((set, get) => ({
  logs: [],
  visible: false,
  maxLogs: 1000,
  addLog: (entry) => {
    const newEntry: ConsoleLogEntry = {
      id: entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: entry.timestamp || new Date(),
      level: entry.level as ConsoleLogLevel,
      component: entry.component || 'monitor',
      message: entry.message || '',
      data: entry.data,
    }

    const updated = [...get().logs, newEntry]
    const { maxLogs } = get()
    set({ logs: updated.slice(-maxLogs) })
  },
  clear: () => set({ logs: [] }),
  toggle: () => set({ visible: !get().visible }),
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}))

import React, { useMemo } from 'react'
import { useConsoleMonitorStore } from '@/store/consoleMonitor'
import { LiveConsole } from '@/components/ui/live-console'

export const ConsoleMonitorOverlay: React.FC = () => {
  const logs = useConsoleMonitorStore((s) => s.logs)
  const visible = useConsoleMonitorStore((s) => s.visible)

  const mappedLogs = useMemo(() => logs.map((l) => ({
    id: l.id,
    timestamp: l.timestamp,
    level: l.level,
    component: l.component,
    message: l.message,
    data: l.data,
  })), [logs])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        right: 12,
        bottom: 12,
        zIndex: 10000,
        width: 'min(720px, 92vw)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
      }}
    >
      <LiveConsole
        title="Monitoring Console (Ctrl+Shift+L)"
        logs={mappedLogs as any}
        autoScroll
        showComponentFilter
        showLevelFilter
        enableSearch
        enableExport
        collapsible
        height={320}
      />
    </div>
  )
}

export default ConsoleMonitorOverlay

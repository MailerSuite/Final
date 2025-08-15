import { useEffect, useRef, useState } from 'react'
import UniversalModal from '@/components/modals/UniversalModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ProxyStatusBadge from '@/components/ProxyStatusBadge'
import { listProxies } from '@/api/proxies'
import LoadingSpinner from '@/components/LoadingSpinner'
import MailLoader from '@/components/ui/MailLoader'
import { testProxy } from '@/api/proxy'
import type { ProxyServer } from '@/types/proxy'

interface ProxySelectModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string | null
  onSelect: (proxy: ProxyServer, firewallEnabled: boolean) => void
}

export default function ProxySelectModal({
  isOpen,
  onClose,
  sessionId,
  onSelect,
}: ProxySelectModalProps) {
  const [loading, setLoading] = useState(false)
  const [proxies, setProxies] = useState<ProxyServer[]>([])
  const [testingId, setTestingId] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const cleanupRef = useRef<() => void>()
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !sessionId) return
      try {
        setLoading(true)
        const data = await listProxies(sessionId)
        const map = new Map<string, ProxyServer>()
        data.forEach((p) => {
          const key = `${p.ip_address}:${p.port}`
          if (!map.has(key)) map.set(key, p)
        })
        setProxies(Array.from(map.values()))
      } catch {
        setProxies([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isOpen])

  useEffect(() => {
    return () => {
      cleanupRef.current?.()
    }
  }, [])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  const handleSelect = async (p: ProxyServer) => {
    setTestingId(p.id)
    setLogs([])
    try {
      const res = await testProxy(p.id)
      if (res.status === 'valid') {
        setSuccessId(p.id)
        onSelect(p, p.firewall_on ?? p.is_firewall_enabled)
      } else {
        setLogs((l) => [...l, res.error_message || 'Proxy test failed'])
      }
    } catch (e: any) {
      setLogs((l) => [...l, 'Proxy test error'])
    } finally {
      setTestingId(null)
    }
  }

  return (
    <UniversalModal title="Select Proxy" isOpen={isOpen} onClose={onClose}>
      {loading ? (
        <div className="py-4"><MailLoader size="sm" /></div>
      ) : proxies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No proxies available.</p>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {proxies.map((p) => (
              <li
                key={p.id}
                className={`flex items-center justify-between py-2 ${
                  successId === p.id ? 'bg-green-900/20' : ''
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm">
                    {p.ip_address}:{p.port}
                  </span>
                  <ProxyStatusBadge
                    isActive={p.is_active}
                    firewallOn={p.firewall_on}
                  />
                  {p.is_custom_proxy && <Badge>Custom Proxy</Badge>}
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSelect(p)}
                  disabled={!!testingId}
                >
                  {testingId === p.id ? (
                    <LoadingSpinner size="h-4 w-4" />
                  ) : (
                    'Select'
                  )}
                </Button>
              </li>
            ))}
          </ul>
          {logs.length > 0 && (
            <div
              className="mt-4 h-40 overflow-auto border rounded p-2 text-sm font-mono"
              ref={logRef}
            >
              {logs.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          )}
        </>
      )}
    </UniversalModal>
  )
}

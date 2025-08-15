import React from 'react'
import { ProxyServer } from '@/types/proxy'

interface ProxyDetails extends ProxyServer {
  proxy_type: string
  is_valid: boolean
  last_checked_at?: string | null
}
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import BlacklistIcon from '@/components/Icon/BlacklistIcon'
import { useBlacklistCheck } from '@/hooks/useBlacklistCheck'
import { cn } from '@/lib/utils'

interface ProxyListProps {
  proxies: ProxyDetails[]
}

export default function ProxyList({ proxies }: ProxyListProps) {
  const { runCheck, results, loading } = useBlacklistCheck()

  const checkAll = () => {
    runCheck(proxies.map((p) => `${p.ip_address}:${p.port}`))
  }

  const renderStatus = (address: string) => {
    const res = results[address]
    if (!res) return <span className="text-muted-foreground">unchecked</span>
    return res.is_blacklisted ? (
      <span className="text-destructive flex gap-1 items-center">
        ❌ {res.sources.join(', ')}
      </span>
    ) : (
      <span className="text-green-500 flex gap-1 items-center">✅ clean</span>
    )
  }

  const renderValidation = (proxy: ProxyDetails) => {
    if (!proxy.last_checked_at) {
      return <span className="text-muted-foreground">untested</span>
    }
    return proxy.is_valid ? (
      <span className="text-green-500 flex gap-1 items-center">✅ validated</span>
    ) : (
      <span className="text-destructive flex gap-1 items-center">❌ error</span>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-64">Address</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Validation</TableHead>
          <TableHead>Blacklist</TableHead>
          <TableHead className="w-10 text-right">
            <Button
              size="sm"
              variant="secondary"
              onClick={checkAll}
              disabled={loading}
              aria-label="Check all proxies"
            >
              Check All
            </Button>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {proxies.map((p) => {
          const address = `${p.ip_address}:${p.port}`
          return (
            <TableRow key={p.id}>
              <TableCell className="font-mono flex items-center gap-2">
                {address}
              </TableCell>
              <TableCell>{p.proxy_type.toUpperCase()}</TableCell>
              <TableCell>{renderValidation(p)}</TableCell>
              <TableCell>{renderStatus(address)}</TableCell>
              <TableCell>
                <button
                  onClick={() => runCheck([address])}
                  aria-label="Check blacklist"
                  className="text-muted-foreground hover:text-primary"
                >
                  <BlacklistIcon className="text-orange-500" />
                </button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

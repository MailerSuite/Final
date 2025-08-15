import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, FlaskConical, ChevronDown } from 'lucide-react'
import { useProxy, ProxyProvider } from '@/hooks/use-proxy'
import ProxyTestsModal from './ProxyTestsModal'
import LoadingSpinner from '@/components/LoadingSpinner'
import { toast } from '@/hooks/useToast'

function ProxyDropdownInner() {
  const { proxies, activeProxy, selectProxy, checkProxy } = useProxy()
  const [open, setOpen] = useState(false)
  const [testsOpen, setTestsOpen] = useState(false)
  const [checkingId, setCheckingId] = useState<string | null>(null)

  const selectedLabel = activeProxy
    ? `${activeProxy.ip_address}:${activeProxy.port}`
    : 'No Proxy Selected'

  const handleCheck = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setCheckingId(id)
    try {
      const res = await checkProxy(id)
      if (!res.status) {
        toast({ description: 'Proxy failed', severity: 'critical' })
      }
    } catch {
      toast({ description: 'Check failed', severity: 'critical' })
    } finally {
      setCheckingId(null)
    }
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="bg-black/20 text-white rounded-full px-3 py-1 flex items-center cursor-pointer"
          >
            <span className="truncate mr-2">{selectedLabel}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="origin-top-right right-0 w-60">
          <DropdownMenuItem onSelect={() => selectProxy(null)}>
            No Proxy
          </DropdownMenuItem>
          {proxies.map((p) => (
            <DropdownMenuItem
              key={p.id}
              onSelect={() => selectProxy(p)}
              className="justify-between gap-2"
            >
              <div className="flex flex-col text-left">
                <span className="font-medium">{(p as any).name ?? p.id}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {p.ip_address}:{p.port}
                </span>
              </div>
              <Badge
                variant={p.is_active ? 'success' : 'destructive'}
                className="ml-auto"
              >
                {p.is_active ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
              </Badge>
              <button
                aria-label="Check proxy"
                onClick={(e) => handleCheck(e, p.id)}
                className="ml-2 text-muted-foreground hover:text-foreground"
              >
                {checkingId === p.id ? (
                  <LoadingSpinner size="h-3 w-3" />
                ) : (
                  <FlaskConical className="w-3 h-3" />
                )}
              </button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setTestsOpen(true)}>
            Run full tests …
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ProxyTestsModal isOpen={testsOpen} onClose={() => setTestsOpen(false)} />
    </>
  )
}

export default function ProxyDropdown() {
  return (
    <ProxyProvider>
      <ProxyDropdownInner />
    </ProxyProvider>
  )
}

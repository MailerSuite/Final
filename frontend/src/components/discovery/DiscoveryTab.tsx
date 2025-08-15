import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { AnimatePresence, motion } from 'framer-motion'
import { Globe, Search, RefreshCw, CheckCircle, Plus, Info } from 'lucide-react'

export interface DiscoveredHost {
  host: string
  port: number
  security: 'ssl' | 'tls' | 'starttls'
  priority: number
  status: 'success' | 'error'
  responseTime?: number
}

interface DiscoveryResult {
  id: string
  domain: string
  discoveredHosts: DiscoveredHost[]
  status: 'discovering' | 'completed'
}

interface DiscoveryTabProps {
  onApply?: (host: DiscoveredHost) => void
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
}

export default function DiscoveryTab({ onApply }: DiscoveryTabProps) {
  const [discoveryDomain, setDiscoveryDomain] = useState('')
  const [discoveryResults, setDiscoveryResults] = useState<DiscoveryResult[]>([])
  const [isDiscovering, setIsDiscovering] = useState(false)

  const handleDiscovery = async () => {
    if (!discoveryDomain.trim()) return
    setIsDiscovering(true)
    const domain = discoveryDomain.trim()
    const newResult: DiscoveryResult = {
      id: `discovery-${Date.now()}`,
      domain,
      discoveredHosts: [],
      status: 'discovering',
    }
    setDiscoveryResults((prev) => [...prev, newResult])

    const commonHosts = [
      { prefix: 'smtp', port: 587, security: 'starttls' as const },
      { prefix: 'smtp', port: 465, security: 'ssl' as const },
      { prefix: 'mail', port: 587, security: 'starttls' as const },
      { prefix: 'mail', port: 465, security: 'ssl' as const },
      { prefix: '', port: 25, security: 'tls' as const },
    ]

    const discoveredHosts: DiscoveredHost[] = []
    for (const [index, hostConfig] of commonHosts.entries()) {
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200))
      const host = hostConfig.prefix ? `${hostConfig.prefix}.${domain}` : domain
      const success = Math.random() > 0.4
      const responseTime = success ? Math.floor(50 + Math.random() * 300) : undefined
      if (success) {
        discoveredHosts.push({
          host,
          port: hostConfig.port,
          security: hostConfig.security,
          priority: index + 1,
          status: 'success',
          responseTime,
        })
      }
    }
    setDiscoveryResults((prev) =>
      prev.map((r) =>
        r.id === newResult.id ? { ...r, discoveredHosts, status: 'completed' } : r
      )
    )
    setIsDiscovering(false)
  }

  return (
    <div className="space-y-6">
      <Card className="app-panel">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-500" />
            Automatic Hostname Discovery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground">Domain to discover</Label>
              <Input
                value={discoveryDomain}
                onChange={(e) => setDiscoveryDomain(e.target.value)}
                placeholder="example.com"
                className="bg-surface-2 border-border text-white"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleDiscovery}
                disabled={!discoveryDomain.trim() || isDiscovering}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDiscovering ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Discover
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="w-4 h-4" />
            <span>
              Automatically discovers SMTP servers for the given domain by testing
              common hostnames and ports. (Client-side simulation.)
            </span>
          </div>
        </CardContent>
      </Card>
      {discoveryResults.length > 0 && (
        <Card className="app-panel">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-yellow-500" />
              Discovery Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <AnimatePresence>
                  {discoveryResults.map((result) => (
                    <motion.div
                      key={result.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="p-4 app-panel"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-medium text-white">{result.domain}</h4>
                        {result.status === 'discovering' && (
                          <Badge
                            variant="outline"
                            className="border-yellow-500/30 text-yellow-400 bg-yellow-900/20"
                          >
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Discovering...
                          </Badge>
                        )}
                        {result.status === 'completed' && (
                          <Badge
                            variant="outline"
                            className="border-green-500/30 text-green-400 bg-green-900/20"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      {result.discoveredHosts.length > 0 && (
                        <div className="space-y-2">
                          {result.discoveredHosts.map((host, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 app-panel"
                            >
                              <div className="flex-1">
                                <div className="text-sm font-medium text-white">
                                  {host.host}:{host.port}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {host.security.toUpperCase()}
                                  {host.responseTime && ` • ${host.responseTime}ms`}
                                  {` • Priority ${host.priority}`}
                                </div>
                              </div>
                              {onApply && (
                                <Button
                                  size="sm"
                                  onClick={() => onApply(host)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Apply
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {result.status === 'completed' &&
                        result.discoveredHosts.length === 0 && (
                          <div className="text-center py-4 text-muted-foreground">
                            No SMTP servers discovered for this domain.
                          </div>
                        )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

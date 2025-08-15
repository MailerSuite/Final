import UniversalModal from '@/components/modals/UniversalModal'

export interface ProxyCheckerDetails {
  proxyHost: string
  port: number
  username?: string
  password?: string
  protocol: string
  retries: number
  retryDelay: number
  connectionTimeout: number
  operationTimeout: number
  status?: string
  lastTested?: string
  source?: string
}

interface ProxyCheckerDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  config: ProxyCheckerDetails | null
}

export default function ProxyCheckerDetailsDialog({
  isOpen,
  onClose,
  config,
}: ProxyCheckerDetailsDialogProps) {
  if (!config) return null
  return (
    <UniversalModal
      title="Proxy Checker Details"
      description={`Detailed information for ${config.proxyHost}`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Proxy Host</p>
          <p className="text-white break-all">{config.proxyHost}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Port</p>
          <p className="text-white">{config.port}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Username</p>
          <p className="text-white break-all">{config.username || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Password</p>
          <p className="text-white break-all">{config.password ? '•••••' : 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Protocol</p>
          <p className="text-white">{config.protocol}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Retries</p>
          <p className="text-white">{config.retries}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Retry Delay (ms)</p>
          <p className="text-white">{config.retryDelay}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Connection Timeout (s)</p>
          <p className="text-white">{config.connectionTimeout}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Operation Timeout (s)</p>
          <p className="text-white">{config.operationTimeout}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-white">{config.status || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Last Tested</p>
          <p className="text-white">{config.lastTested || 'Never'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Source</p>
          <p className="text-white">{config.source || 'N/A'}</p>
        </div>
      </div>
    </UniversalModal>
  )
}


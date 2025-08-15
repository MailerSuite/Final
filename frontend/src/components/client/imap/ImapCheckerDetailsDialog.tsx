import UniversalModal from '@/components/modals/UniversalModal'

export interface ImapCheckerDetails {
  server: string
  port: number
  username: string
  security: string
  useSsl: boolean
  retries: number
  retryDelay: number
  connectionTimeout: number
  operationTimeout: number
  proxyEnabled: boolean
  source?: string
  status?: string
  lastTested?: string
  autoDiscovered?: boolean
}

interface ImapCheckerDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  config: ImapCheckerDetails | null
}

export default function ImapCheckerDetailsDialog({
  isOpen,
  onClose,
  config,
}: ImapCheckerDetailsDialogProps) {
  if (!config) return null
  return (
    <UniversalModal
      title="IMAP Configuration Details"
      description={`Detailed information for ${config.server}`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">IMAP Server</p>
          <p className="text-white break-all">{config.server}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Port</p>
          <p className="text-white">{config.port}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Username</p>
          <p className="text-white break-all">{config.username}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Security</p>
          <p className="text-white">{config.security}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Use SSL</p>
          <p className="text-white">{config.useSsl ? 'Yes' : 'No'}</p>
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
          <p className="text-sm text-muted-foreground">Proxy Enabled</p>
          <p className="text-white">{config.proxyEnabled ? 'Yes' : 'No'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Source</p>
          <p className="text-white">{config.source || 'N/A'}</p>
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
          <p className="text-sm text-muted-foreground">Auto Discovered</p>
          <p className="text-white">{config.autoDiscovered ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </UniversalModal>
  )
}


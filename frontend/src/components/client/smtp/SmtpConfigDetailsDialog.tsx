import UniversalModal from '@/components/modals/UniversalModal'

export interface SmtpConfigDetails {
  host: string
  port: number
  username: string
  security: string
  retries: number
  retryDelay: number
  connectionTimeout: number
  operationTimeout: number
  proxyEnabled: boolean
  source?: string
  status?: string
  lastTested?: string
  autoDiscovered?: boolean
  audit?: {
    encryption?: string
    spf?: boolean
    dkim?: boolean
    dmarc?: boolean
    mx?: boolean
    authMethods?: string[]
    banner?: string
    recommended?: string
  }
}

interface SmtpConfigDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  config: SmtpConfigDetails | null
}

export default function SmtpConfigDetailsDialog({
  isOpen,
  onClose,
  config,
}: SmtpConfigDetailsDialogProps) {
  if (!config) return null
  return (
    <UniversalModal
      title="SMTP Configuration Details"
      description={`Detailed information for ${config.host}`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Host</p>
          <p className="text-white break-all">{config.host}</p>
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
      {config.audit && (
        <div className="mt-6 space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Auto-detected Encryption</p>
            <p className="text-white">{config.audit.encryption || 'Unknown'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">DNS Validation</p>
            <ul className="text-white text-sm ml-4 list-disc">
              <li className={config.audit.mx ? 'text-green-400' : 'text-red-400'}>
                MX Records {config.audit.mx ? 'valid' : 'invalid'}
              </li>
              <li className={config.audit.spf ? 'text-green-400' : 'text-red-400'}>
                SPF {config.audit.spf ? 'valid' : 'invalid'}
              </li>
              <li className={config.audit.dkim ? 'text-green-400' : 'text-red-400'}>
                DKIM {config.audit.dkim ? 'valid' : 'invalid'}
              </li>
              <li className={config.audit.dmarc ? 'text-green-400' : 'text-red-400'}>
                DMARC {config.audit.dmarc ? 'valid' : 'invalid'}
              </li>
            </ul>
          </div>
          {config.audit.authMethods && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Supported Auth Methods</p>
              <p className="text-white">
                {config.audit.authMethods.join(', ')}
              </p>
            </div>
          )}
          {config.audit.banner && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">SMTP Banner</p>
              <p className="text-white break-all">{config.audit.banner}</p>
            </div>
          )}
          {config.audit.recommended && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Recommended Configuration</p>
              <pre className="bg-zinc-950 p-2 rounded-md text-white text-xs overflow-auto">
{config.audit.recommended}
              </pre>
            </div>
          )}
        </div>
      )}
    </UniversalModal>
  )
}


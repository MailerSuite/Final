import UniversalModal from '@/components/modals/UniversalModal'

export interface BlacklistDetails {
  domainOrIp: string
  providersChecked: number
  resultSummary: string
  status: string
  message?: string
  responseTimeMs: number
  checkedAt: string
  totalBlacklisted: number
  source?: string
}

interface BlacklistDetailsDialogProps {
  detail: BlacklistDetails | null
  onClose: () => void
}

export default function BlacklistDetailsDialog({ detail, onClose }: BlacklistDetailsDialogProps) {
  if (!detail) return null
  return (
    <UniversalModal
      title="Blacklist Checker Details"
      description={`Detailed information for ${detail.domainOrIp}`}
      isOpen={!!detail}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Domain or IP</p>
          <p className="text-white break-all">{detail.domainOrIp}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Providers Checked</p>
          <p className="text-white">{detail.providersChecked}</p>
        </div>
        <div className="space-y-1 md:col-span-2">
          <p className="text-sm text-muted-foreground">Result Summary</p>
          <p className="text-white break-all">{detail.resultSummary}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-white">{detail.status}</p>
        </div>
        <div className="space-y-1 md:col-span-2">
          <p className="text-sm text-muted-foreground">Message</p>
          <p className="text-white break-all">{detail.message || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Response Time (ms)</p>
          <p className="text-white">{detail.responseTimeMs}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Checked At</p>
          <p className="text-white">{detail.checkedAt}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total Blacklisted</p>
          <p className="text-white">{detail.totalBlacklisted}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Source</p>
          <p className="text-white">{detail.source || 'N/A'}</p>
        </div>
      </div>
    </UniversalModal>
  )
}


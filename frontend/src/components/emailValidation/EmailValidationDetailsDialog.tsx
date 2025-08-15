import UniversalModal from '@/components/modals/UniversalModal'

export interface EmailValidationDetails {
  email: string
  syntaxCheck: string
  domainCheck: string
  smtpCheck: string
  disposable: boolean
  acceptAll: boolean
  status?: string
  message?: string
  checkedAt?: string
  source?: string
}

interface EmailValidationDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  details: EmailValidationDetails | null
}

export default function EmailValidationDetailsDialog({
  isOpen,
  onClose,
  details,
}: EmailValidationDetailsDialogProps) {
  if (!details) return null
  return (
    <UniversalModal
      title="Email Validation Details"
      description={`Detailed information for ${details.email}`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Email Address</p>
          <p className="text-white break-all">{details.email}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Syntax Check</p>
          <p className="text-white">{details.syntaxCheck}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Domain Check</p>
          <p className="text-white">{details.domainCheck}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">SMTP Check</p>
          <p className="text-white">{details.smtpCheck}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Disposable?</p>
          <p className="text-white">{details.disposable ? 'Yes' : 'No'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Accept All?</p>
          <p className="text-white">{details.acceptAll ? 'Yes' : 'No'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-white">{details.status || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Message</p>
          <p className="text-white break-all">{details.message || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Checked At</p>
          <p className="text-white">{details.checkedAt || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Source</p>
          <p className="text-white">{details.source || 'N/A'}</p>
        </div>
      </div>
    </UniversalModal>
  )
}


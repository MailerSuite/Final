import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { Badge } from './badge'

export type Status =
  | 'clear'
  | 'listed'
  | 'error'
  | 'valid'
  | 'invalid'
  | 'pending'

interface Props {
  status: Status
  className?: string
}

export default function StatusBadge({ status, className }: Props) {
  // Map statuses to Badge variants and icons to avoid dynamic class colors
  const variant: React.ComponentProps<typeof Badge>["variant"] =
    status === 'valid' || status === 'clear' ? 'default'
      : status === 'pending' ? 'secondary'
        : status === 'invalid' || status === 'listed' ? 'destructive'
          : 'outline'

  const label =
    status === 'valid' ? 'Valid'
      : status === 'invalid' ? 'Invalid'
        : status === 'pending' ? 'Pending'
          : status === 'listed' ? 'Listed'
            : status === 'clear' ? 'Clear' : 'Error'

  const Icon =
    status === 'listed' ? XCircleIcon
      : status === 'clear' || status === 'valid' ? CheckCircleIcon
        : ExclamationCircleIcon

  return (
    <Badge variant={variant} className={className} aria-label={`Status: ${label}`}>
      <Icon className="w-3 h-3" /> {label}
    </Badge>
  )
}

import { Badge } from '@/components/ui/badge'

interface FirewallBadgeProps {
  enabled: boolean
  className?: string
}

export default function FirewallBadge({ enabled, className }: FirewallBadgeProps) {
  return (
    <Badge
      variant={enabled ? 'default' : 'destructive'}
      className={className}
    >
      Firewall {enabled ? 'On' : 'Off'}
    </Badge>
  )
}

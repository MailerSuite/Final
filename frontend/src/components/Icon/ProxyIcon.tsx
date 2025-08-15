import React from 'react'
import { Network } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProxyIconProps extends React.ComponentProps<'svg'> {
  status?: 'valid' | 'error' | 'untested'
}

export function ProxyIcon({ status, className, ...props }: ProxyIconProps) {
  const color =
    status === 'valid'
      ? 'text-green-500'
      : status === 'error'
        ? 'text-destructive'
        : 'text-muted-foreground'
  return (
    <Network
      aria-hidden
      data-testid="proxy-icon"
      className={cn('w-4 h-4', color, className)}
      {...props}
    />
  )
}

export default ProxyIcon

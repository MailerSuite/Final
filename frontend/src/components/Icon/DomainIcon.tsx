import React from 'react'
import { Globe, CheckCircle, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DomainIconProps extends React.ComponentProps<'svg'> {
  variant?: 'default' | 'check' | 'blacklist'
}

export function DomainIcon({ variant = 'default', className, ...props }: DomainIconProps) {
  const Icon = variant === 'check' ? CheckCircle : variant === 'blacklist' ? ShieldAlert : Globe
  return <Icon aria-hidden data-testid="domain-icon" className={cn('w-4 h-4', className)} {...props} />
}

export default DomainIcon

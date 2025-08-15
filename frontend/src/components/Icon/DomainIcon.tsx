import React from 'react'
import { Globe, CheckCircle, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DomainIconProps extends React.ComponentProps<'svg'> {
  variant?: 'default' | 'check' | 'blacklist'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
}

export function DomainIcon({ variant = 'default', size = 'sm', className, ...props }: DomainIconProps) {
  const Icon = variant === 'check' ? CheckCircle : variant === 'blacklist' ? ShieldAlert : Globe

  const sizeClass = {
    xs: 'icon-xs',
    sm: 'icon-sm',
    base: 'icon-base',
    lg: 'icon-lg',
    xl: 'icon-xl',
    '2xl': 'icon-2xl',
    '3xl': 'icon-3xl'
  }[size] || 'icon-sm'

  const colorClass = variant === 'check'
    ? 'text-success'
    : variant === 'blacklist'
      ? 'text-destructive'
      : 'text-current'

  return (
    <Icon
      aria-hidden
      data-testid="domain-icon"
      className={cn(sizeClass, colorClass, className)}
      {...props}
    />
  )
}

export default DomainIcon

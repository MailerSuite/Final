import React from 'react'
import { Network } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProxyIconProps extends React.ComponentProps<'svg'> {
  status?: 'valid' | 'error' | 'untested'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
}

export function ProxyIcon({ status, size = 'sm', className, ...props }: ProxyIconProps) {
  const colorClass = status === 'valid'
    ? 'text-success'
    : status === 'error'
      ? 'text-destructive'
      : 'text-muted-foreground'

  const sizeClass = {
    xs: 'icon-xs',
    sm: 'icon-sm',
    base: 'icon-base',
    lg: 'icon-lg',
    xl: 'icon-xl',
    '2xl': 'icon-2xl',
    '3xl': 'icon-3xl'
  }[size] || 'icon-sm'

  return (
    <Network
      aria-hidden
      data-testid="proxy-icon"
      className={cn(sizeClass, colorClass, className)}
      {...props}
    />
  )
}

export default ProxyIcon

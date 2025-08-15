import React from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type InfoSeverity = 'info' | 'warning' | 'error'

interface InfoIconProps extends React.ComponentProps<'svg'> {
  severity?: InfoSeverity
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
}

export default function InfoIcon({ severity = 'info', size = 'sm', className, ...props }: InfoIconProps) {
  const colorClass = severity === 'error'
    ? 'text-destructive'
    : severity === 'warning'
      ? 'text-warning'
      : 'text-info'

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
    <Info
      data-testid="info-icon"
      aria-hidden
      className={cn(sizeClass, colorClass, className)}
      {...props}
    />
  )
}

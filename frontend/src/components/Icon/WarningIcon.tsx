import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WarningIconProps extends React.ComponentProps<'svg'> {
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
}

export default function WarningIcon({ size = 'sm', className, ...props }: WarningIconProps) {
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
    <AlertTriangle
      data-testid="warning-icon"
      aria-hidden
      className={cn(sizeClass, 'text-warning', className)}
      {...props}
    />
  )
}

import { Ban } from 'lucide-react'
import { cn } from '@/lib/utils'
import React from 'react'

interface BlacklistIconProps extends React.ComponentProps<'svg'> {
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
}

export function BlacklistIcon({ size = 'sm', className, ...props }: BlacklistIconProps) {
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
    <Ban
      data-testid="blacklist-icon"
      className={cn(sizeClass, 'text-destructive', className)}
      {...props}
    />
  )
}

export default BlacklistIcon

import React from 'react'
import { Server } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SmtpIconProps extends React.ComponentProps<'svg'> {
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
}

export function SmtpIcon({ size = 'sm', className, ...props }: SmtpIconProps) {
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
    <Server
      aria-hidden
      data-testid="smtp-icon"
      className={cn(sizeClass, 'text-current', className)}
      {...props}
    />
  )
}

export default SmtpIcon

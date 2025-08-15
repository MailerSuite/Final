import React from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InboxIconProps extends React.ComponentProps<'svg'> {
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
}

export function InboxIcon({ size = 'sm', className, ...props }: InboxIconProps) {
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
    <Inbox
      data-testid="inbox-icon"
      aria-hidden
      className={cn(sizeClass, 'text-current', className)}
      {...props}
    />
  )
}

export default InboxIcon

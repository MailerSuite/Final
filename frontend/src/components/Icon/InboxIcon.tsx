import React from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

export function InboxIcon({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <Inbox
      data-testid="inbox-icon"
      aria-hidden
      className={cn('w-4 h-4', className)}
      {...props}
    />
  )
}

export default InboxIcon

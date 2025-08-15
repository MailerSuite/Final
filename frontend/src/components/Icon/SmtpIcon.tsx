import React from 'react'
import { Server } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SmtpIcon({ className, ...props }: React.ComponentProps<'svg'>) {
  return <Server aria-hidden data-testid="smtp-icon" className={cn('w-4 h-4', className)} {...props} />
}

export default SmtpIcon

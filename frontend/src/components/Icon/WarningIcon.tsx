import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function WarningIcon({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <AlertTriangle
      data-testid="warning-icon"
      aria-hidden
      className={cn('w-4 h-4 text-yellow-400', className)}
      {...props}
    />
  )
}

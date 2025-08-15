import React from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type InfoSeverity = 'info' | 'warning' | 'error'

interface InfoIconProps extends React.ComponentProps<'svg'> {
  severity?: InfoSeverity
}

export default function InfoIcon({ severity = 'info', className, ...props }: InfoIconProps) {
  const color =
    severity === 'error'
      ? 'text-red-400'
      : severity === 'warning'
      ? 'text-yellow-400'
      : 'text-blue-400'
  return (
    <Info
      data-testid="info-icon"
      aria-hidden
      className={cn('w-4 h-4', color, className)}
      {...props}
    />
  )
}

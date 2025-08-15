import { Ban } from 'lucide-react'
import { cn } from '@/lib/utils'
import React from 'react'

export function BlacklistIcon({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <Ban
      data-testid="blacklist-icon"
      className={cn('w-4 h-4 text-orange-500', className)}
      {...props}
    />
  )
}

export default BlacklistIcon

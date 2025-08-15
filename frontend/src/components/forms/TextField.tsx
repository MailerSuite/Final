import React, { useId } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Props extends React.ComponentProps<typeof Input> {
  label: string
  error?: string
}

export default function TextField({ label, id, error, className, ...props }: Props) {
  const inputId = id || useId()
  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <Input id={inputId} aria-invalid={!!error} {...props} />
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  )
}

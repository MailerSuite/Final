import React from 'react'
import { LayoutTemplate } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TemplateIcon({ className, ...props }: React.ComponentProps<'svg'>) {
  return <LayoutTemplate aria-hidden data-testid="template-icon" className={cn('w-4 h-4', className)} {...props} />
}

export default TemplateIcon

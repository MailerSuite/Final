import React from 'react'
import { LayoutTemplate } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemplateIconProps extends React.ComponentProps<'svg'> {
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
}

export function TemplateIcon({ size = 'sm', className, ...props }: TemplateIconProps) {
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
    <LayoutTemplate
      aria-hidden
      data-testid="template-icon"
      className={cn(sizeClass, 'text-current', className)}
      {...props}
    />
  )
}

export default TemplateIcon

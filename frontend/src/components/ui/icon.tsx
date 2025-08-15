import * as React from 'react'
import * as Icons from 'lucide-react'
import { cn } from '@/lib/utils'

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  /**
   * Name of the lucide icon to render.
   */
  name: keyof typeof Icons
  /**
   * Accessible label for screen readers.
   */
  ariaLabel?: string
}

/**
 * Renders a lucide icon by name. All icons share a responsive
 * size and require an accessible label.
 */
export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, ariaLabel, className, size = 'sm', ...props }, ref) => {
    const LucideIcon = Icons[name] as React.FC<React.SVGProps<SVGSVGElement>>

    if (!LucideIcon) {
      console.warn(`Icon "${name}" does not exist in lucide-react`)
      return null
    }

    const sizeClass = {
      xs: 'icon-xs',
      sm: 'icon-sm', 
      base: 'icon-base',
      lg: 'icon-lg',
      xl: 'icon-xl'
    }[size] || 'icon-sm'

    return (
      <LucideIcon
        ref={ref}
        aria-label={ariaLabel}
        className={cn(sizeClass, className)}
        {...props}
      />
    )
  }
)
Icon.displayName = 'Icon'

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
  /**
   * Icon size variant
   */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
  /**
   * Whether to use currentColor for theme adaptation
   */
  useCurrentColor?: boolean
}

/**
 * Renders a lucide icon by name. All icons share a responsive
 * size and require an accessible label. Uses currentColor by default
 * for theme adaptation.
 */
export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, ariaLabel, className, size = 'sm', useCurrentColor = true, ...props }, ref) => {
    const LucideIcon = Icons[name] as React.FC<React.SVGProps<SVGSVGElement>>

    if (!LucideIcon) {
      console.warn(`Icon "${name}" does not exist in lucide-react`)
      return null
    }

    const sizeClass = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      base: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8',
      '2xl': 'w-10 h-10',
      '3xl': 'w-12 h-12'
    }[size] || 'w-4 h-4'

    return (
      <LucideIcon
        ref={ref}
        aria-label={ariaLabel}
        className={cn(
          sizeClass,
          useCurrentColor && 'text-current',
          className
        )}
        {...props}
      />
    )
  }
)
Icon.displayName = 'Icon'

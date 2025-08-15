import React from 'react'
import { cn } from '@/lib/utils'

interface GradientOverlayProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'card' | 'subtle' | 'hero' | 'animated'
  opacity?: number
}

/**
 * Standardized gradient overlay component matching the dashboard design
 * 
 * @example
 * ```tsx
 * <GradientOverlay variant="default">
 *   <Card>
 *     <CardContent>Your content here</CardContent>
 *   </Card>
 * </GradientOverlay>
 * ```
 */
export function GradientOverlay({
  children,
  className,
  variant = 'default',
  opacity = 0.6
}: GradientOverlayProps) {
  const variantClasses = {
    default: 'gradient-overlay',
    card: 'gradient-overlay-card',
    subtle: 'gradient-overlay-subtle',
    hero: 'gradient-overlay-hero',
    animated: 'gradient-overlay-animated'
  }

  return (
    <div 
      className={cn(
        variantClasses[variant],
        className
      )}
      style={{
        '--gradient-opacity': opacity
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

/**
 * Inline gradient overlay for existing components
 * Use this when you can't wrap the component
 * 
 * @example
 * ```tsx
 * <Card className="relative overflow-hidden">
 *   <InlineGradientOverlay />
 *   <CardContent>Your content here</CardContent>
 * </Card>
 * ```
 */
export function InlineGradientOverlay({
  variant = 'default',
  opacity = 0.6,
  className
}: Omit<GradientOverlayProps, 'children'>) {
  const gradients = {
    default: (
      <div 
        className={cn("absolute inset-0 pointer-events-none", className)}
        style={{ opacity }}
      >
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(1200px 400px at 10% -10%, rgba(59, 130, 246, 0.15), transparent),
              radial-gradient(900px 300px at 90% -20%, rgba(147, 51, 234, 0.15), transparent)
            `
          }}
        />
      </div>
    ),
    card: (
      <div 
        className={cn("absolute inset-0 pointer-events-none", className)}
        style={{ opacity }}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, transparent 50%, hsl(var(--secondary) / 0.08) 100%)`
          }}
        />
      </div>
    ),
    subtle: (
      <div 
        className={cn("absolute inset-0 pointer-events-none", className)}
        style={{ opacity }}
      >
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at top left, hsl(var(--primary) / 0.05) 0%, transparent 40%),
              radial-gradient(ellipse at bottom right, hsl(var(--secondary) / 0.05) 0%, transparent 40%)
            `
          }}
        />
      </div>
    ),
    hero: (
      <div 
        className={cn("absolute inset-0 pointer-events-none", className)}
        style={{ opacity: opacity * 0.7 }}
      >
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(1400px 500px at 15% 0%, rgba(59, 130, 246, 0.25), transparent),
              radial-gradient(1000px 400px at 85% -10%, rgba(147, 51, 234, 0.25), transparent),
              radial-gradient(800px 300px at 50% 100%, rgba(34, 197, 94, 0.15), transparent)
            `
          }}
        />
      </div>
    ),
    animated: (
      <div 
        className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}
        style={{ opacity }}
      >
        <div 
          className="absolute inset-[-50%] animate-[gradient-rotate_20s_ease_infinite]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.15), transparent 50%),
              radial-gradient(circle at 80% 50%, hsl(var(--secondary) / 0.15), transparent 50%)
            `
          }}
        />
      </div>
    )
  }

  return gradients[variant]
}

export default GradientOverlay
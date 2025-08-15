/**
 * 🎨 Streamlined Design System for SGPT
 * Clean, minimal, yet powerful design components
 * Built for maximum efficiency and visual clarity
 * @deprecated Prefer unified exports from `@/components/base-ui` for primitives and animations.
 */

import React, { forwardRef, HTMLAttributes } from 'react'
import { motion, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

/* ============================================================================ */
/* STREAMLINED ANIMATION VARIANTS */
/* ============================================================================ */

export const streamlinedAnimations: Record<string, Variants> = {
  // Subtle, clean animations
  fadeInUp: {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: [0.25, 0.25, 0, 1] }
    }
  },

  // Minimal scale for interactions
  scalePress: {
    idle: { scale: 1 },
    pressed: { scale: 0.98, transition: { duration: 0.1 } }
  },

  // Clean container animations
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  },

  // Smooth content reveals
  slideIn: {
    hidden: { opacity: 0, x: -8 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.15, ease: 'easeOut' }
    }
  },

  // Gentle hover effects
  hoverLift: {
    idle: { y: 0 },
    hover: { y: -2, transition: { duration: 0.15 } }
  }
}

/* ============================================================================ */
/* STREAMLINED CARD COMPONENT */
/* ============================================================================ */

const streamlinedCardVariants = cva(
  "relative rounded-lg border bg-card/60 backdrop-blur-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-border dark:border-border/50 hover:border-border dark:border-border/80",
        minimal: "border-border dark:border-border/30 bg-card/40",
        clean: "border-border dark:border-border/60 bg-card/70",
        console: "border-border dark:border-border/40 bg-black/20 font-mono",
        stats: "border-primary/20 bg-primary/5"
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4",
        lg: "p-6"
      },
      elevation: {
        flat: "",
        subtle: "shadow-sm hover:shadow-md",
        lifted: "shadow-md hover:shadow-lg"
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      elevation: "subtle"
    }
  }
)

interface StreamlinedCardProps
  extends HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof streamlinedCardVariants> {
  animated?: boolean
}

export const StreamlinedCard = forwardRef<HTMLDivElement, StreamlinedCardProps>(
  ({ className, variant, padding, elevation, animated = true, children, ...props }, ref) => {
    if (animated) {
      return (
        <motion.div
          ref={ref}
          className={cn(streamlinedCardVariants({ variant, padding, elevation, className }))}
          variants={streamlinedAnimations.fadeInUp}
          whileHover="hover"
          {...props}
        >
          {children}
        </motion.div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(streamlinedCardVariants({ variant, padding, elevation, className }))}
        {...props}
      >
        {children}
      </div>
    )
  }
)
StreamlinedCard.displayName = "StreamlinedCard"

/* ============================================================================ */
/* STREAMLINED CONSOLE COMPONENT */
/* ============================================================================ */

interface StreamlinedConsoleProps extends HTMLAttributes<HTMLDivElement> {
  logs: Array<{
    id: string
    level: 'info' | 'success' | 'error' | 'warning'
    message: string
    timestamp: string
  }>
  height?: string
  maxLines?: number
  animated?: boolean
}

export const StreamlinedConsole = forwardRef<HTMLDivElement, StreamlinedConsoleProps>(
  ({ className, logs, height = "300px", maxLines = 100, animated = true, ...props }, ref) => {
    const levelColors = {
      info: 'text-blue-400',
      success: 'text-green-400',
      error: 'text-red-400',
      warning: 'text-yellow-400'
    }

    const displayLogs = logs.slice(-maxLines)

    return (
      <StreamlinedCard
        ref={ref}
        variant="console"
        padding="sm"
        className={cn("overflow-hidden", className)}
        animated={false}
        {...props}
      >
        <div
          className="overflow-y-auto scrollbar-thin scrollbar-thumb-border/50"
          style={{ height }}
        >
          <div className="space-y-1 text-xs">
            {displayLogs.map((log, index) => (
              <motion.div
                key={log.id}
                className="flex gap-2 items-start"
                variants={animated ? streamlinedAnimations.slideIn : undefined}
                initial={animated ? "hidden" : undefined}
                animate={animated ? "visible" : undefined}
                transition={animated ? { delay: index * 0.02 } : undefined}
              >
                <span className="text-muted-foreground text-[10px] min-w-[60px]">
                  {log.timestamp}
                </span>
                <span className={cn("min-w-[60px]", levelColors[log.level])}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className="text-foreground/90 break-words">{log.message}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </StreamlinedCard>
    )
  }
)
StreamlinedConsole.displayName = "StreamlinedConsole"

/* ============================================================================ */
/* STREAMLINED TABLE COMPONENT */
/* ============================================================================ */

interface StreamlinedTableProps extends HTMLAttributes<HTMLDivElement> {
  headers: string[]
  data: Array<Record<string, any>>
  loading?: boolean
  animated?: boolean
  maxHeight?: string
}

export const StreamlinedTable = forwardRef<HTMLDivElement, StreamlinedTableProps>(
  ({ className, headers, data, loading = false, animated = true, maxHeight = "400px", ...props }, ref) => {
    if (loading) {
      return (
        <StreamlinedCard variant="minimal" className={className}>
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </StreamlinedCard>
      )
    }

    return (
      <StreamlinedCard
        ref={ref}
        variant="minimal"
        padding="none"
        className={cn("overflow-hidden", className)}
        animated={false}
        {...props}
      >
        <div className="overflow-x-auto" style={{ maxHeight }}>
          <table className="w-full text-sm">
            <thead className="border-b border-border dark:border-border/50 bg-muted/20">
              <tr>
                {headers.map((header, index) => (
                  <th key={index} className="text-left p-3 font-medium text-muted-foreground">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <motion.tr
                  key={rowIndex}
                  className="border-b border-border dark:border-border/30 hover:bg-muted/20 transition-colors"
                  variants={animated ? streamlinedAnimations.fadeInUp : undefined}
                  initial={animated ? "hidden" : undefined}
                  animate={animated ? "visible" : undefined}
                  transition={animated ? { delay: rowIndex * 0.03 } : undefined}
                >
                  {headers.map((header, cellIndex) => (
                    <td key={cellIndex} className="p-3 text-foreground/90">
                      {row[header.toLowerCase().replace(/\s+/g, '_')] || '-'}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </StreamlinedCard>
    )
  }
)
StreamlinedTable.displayName = "StreamlinedTable"

/* ============================================================================ */
/* STREAMLINED METRICS COMPONENT */
/* ============================================================================ */

interface StreamlinedMetricProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string
  }
  icon?: React.ReactNode
  variant?: 'default' | 'minimal' | 'accent'
  animated?: boolean
}

export const StreamlinedMetric = forwardRef<HTMLDivElement, StreamlinedMetricProps>(
  ({ className, label, value, trend, icon, variant = 'default', animated = true, ...props }, ref) => {
    const trendColors = {
      up: 'text-green-500',
      down: 'text-red-500',
      neutral: 'text-muted-foreground'
    }

    const cardVariant = variant === 'accent' ? 'stats' : 'minimal'

    return (
      <StreamlinedCard
        ref={ref}
        variant={cardVariant}
        padding="md"
        className={cn("text-center", className)}
        animated={animated}
        {...props}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          {icon && (
            <div className="text-primary/70">
              {icon}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <motion.div
            className="text-2xl font-semibold"
            initial={animated ? { opacity: 0, scale: 0.8 } : false}
            animate={animated ? { opacity: 1, scale: 1 } : false}
            transition={animated ? { delay: 0.2 } : false}
          >
            {value}
          </motion.div>

          {trend && (
            <motion.div
              className={cn("text-xs flex items-center justify-center gap-1", trendColors[trend.direction])}
              initial={animated ? { opacity: 0 } : false}
              animate={animated ? { opacity: 1 } : false}
              transition={animated ? { delay: 0.4 } : false}
            >
              {trend.direction === 'up' && '↗'}
              {trend.direction === 'down' && '↘'}
              {trend.direction === 'neutral' && '→'}
              {trend.value}
            </motion.div>
          )}
        </div>
      </StreamlinedCard>
    )
  }
)
StreamlinedMetric.displayName = "StreamlinedMetric"

/* ============================================================================ */
/* STREAMLINED LAYOUT COMPONENTS */
/* ============================================================================ */

interface StreamlinedLayoutProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  animated?: boolean
}

export const StreamlinedPageHeader = forwardRef<HTMLDivElement, StreamlinedLayoutProps>(
  ({ className, title, subtitle, actions, animated = true, children, ...props }, ref) => {
    return (
      <motion.header
        ref={ref}
        className={cn("relative border-b border-border dark:border-border/50 bg-background/80 backdrop-blur-sm", className)}
        variants={animated ? streamlinedAnimations.fadeInUp : undefined}
        initial={animated ? "hidden" : undefined}
        animate={animated ? "visible" : undefined}
        {...props}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {title && (
                <h1 className="text-2xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-3">
                {actions}
              </div>
            )}
          </div>
          {children}
        </div>
      </motion.header>
    )
  }
)
StreamlinedPageHeader.displayName = "StreamlinedPageHeader"

export const StreamlinedGrid = forwardRef<HTMLDivElement, StreamlinedLayoutProps>(
  ({ className, animated = true, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn("grid gap-6", className)}
        variants={animated ? streamlinedAnimations.staggerContainer : undefined}
        initial={animated ? "hidden" : undefined}
        animate={animated ? "visible" : undefined}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
StreamlinedGrid.displayName = "StreamlinedGrid"

/* ============================================================================ */
/* STREAMLINED BUTTON COMPONENT */
/* ============================================================================ */

const streamlinedButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        minimal: "bg-muted/50 text-foreground hover:bg-muted/70",
        ghost: "hover:bg-muted/50 hover:text-foreground",
        outline: "border border-border dark:border-border bg-transparent hover:bg-muted/30"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-10 px-6"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)

interface StreamlinedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof streamlinedButtonVariants> {
  animated?: boolean
}

export const StreamlinedButton = forwardRef<HTMLButtonElement, StreamlinedButtonProps>(
  ({ className, variant, size, animated = true, children, ...props }, ref) => {
    if (animated) {
      return (
        <motion.button
          ref={ref}
          className={cn(streamlinedButtonVariants({ variant, size, className }))}
          variants={streamlinedAnimations.scalePress}
          initial="idle"
          whileTap="pressed"
          whileHover="hover"
          {...props}
        >
          {children}
        </motion.button>
      )
    }

    return (
      <button
        ref={ref}
        className={cn(streamlinedButtonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </button>
    )
  }
)
StreamlinedButton.displayName = "StreamlinedButton"

/* ============================================================================ */
/* EXPORTS COMPLETE */
/* ============================================================================ */
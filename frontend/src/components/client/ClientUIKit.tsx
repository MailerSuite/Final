/**
 * 🎨 Enhanced SGPT ClientUI Kit
 * Modern, animated, and highly performant UI components
 * Supports dark/red/grey and orange/blue themes
 * @deprecated Use unified exports from `@/components/base-ui` for shared primitives.
 */

import React, { forwardRef, HTMLAttributes, ButtonHTMLAttributes } from 'react'
import { motion, HTMLMotionProps, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'

/* ============================================================================ */
/* ANIMATION VARIANTS */
/* ============================================================================ */

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.1
    }
  }
}

export const floatingVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 100
    }
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 200
    }
  }
}

export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 120
    }
  }
}

export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 100
    }
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 }
  }
}

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  }
}

// 🚀 Enhanced 4D Animation Variants for Premium Feel
export const hyperspaceVariants: Variants = {
  hidden: {
    opacity: 0,
    z: -1000,
    rotateX: -90,
    scale: 0.5,
    filter: "blur(20px)"
  },
  visible: {
    opacity: 1,
    z: 0,
    rotateX: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 100,
      duration: 1.2
    }
  }
}

export const morphVariants: Variants = {
  hidden: {
    opacity: 0,
    borderRadius: "50%",
    scale: 0,
    rotate: 180
  },
  visible: {
    opacity: 1,
    borderRadius: "8px",
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 200,
      duration: 0.8
    }
  },
  hover: {
    scale: 1.05,
    borderRadius: "12px",
    boxShadow: [
      "0 10px 30px rgba(239, 68, 68, 0.2)",
      "0 20px 60px rgba(239, 68, 68, 0.4)",
      "0 10px 30px rgba(239, 68, 68, 0.2)"
    ],
    transition: {
      duration: 0.3,
      boxShadow: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }
}

export const holographicVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    rotateY: -180,
    z: -500
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotateY: 0,
    z: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 150,
      duration: 1
    }
  },
  hover: {
    rotateY: [0, 5, -5, 0],
    scale: 1.05,
    z: 50,
    transition: {
      rotateY: {
        duration: 0.6,
        ease: "easeInOut"
      },
      scale: {
        duration: 0.3
      },
      z: {
        duration: 0.3
      }
    }
  }
}

export const quantumVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
    rotate: -360,
    x: -200,
    y: -200,
    filter: "blur(20px) hue-rotate(0deg)"
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    x: 0,
    y: 0,
    filter: "blur(0px) hue-rotate(360deg)",
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 100,
      duration: 1.5,
      filter: {
        duration: 2,
        ease: "easeInOut"
      }
    }
  }
}

/* ============================================================================ */
/* CLIENT CARD COMPONENT */
/* ============================================================================ */

const clientCardVariants = cva(
  "relative overflow-hidden rounded-lg border bg-card/50 backdrop-blur-md transition-all duration-300 group",
  {
    variants: {
      variant: {
        default: "border-border dark:border-border hover:border-primary/50",
        primary: "border-primary/30 bg-primary/5",
        secondary: "border-secondary/30 bg-secondary/5",
        gradient: "border-transparent bg-gradient-to-br from-card/60 to-muted/40"
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8"
      },
      glow: {
        none: "",
        subtle: "hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)]",
        strong: "hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      glow: "subtle"
    }
  }
)

interface ClientCardProps
  extends HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof clientCardVariants> {
  asChild?: boolean
  animated?: boolean
}

export const ClientCard = forwardRef<HTMLDivElement, ClientCardProps>(
  ({ className, variant, size, glow, asChild = false, animated = true, children, ...props }, ref) => {
    const Comp = asChild ? Slot : motion.div

    const cardProps = animated
      ? {
        variants: floatingVariants,
        initial: "hidden",
        animate: "visible",
        whileHover: "hover",
        ...props
      }
      : props

    return (
      <Comp
        className={cn(clientCardVariants({ variant, size, glow, className }))}
        ref={ref}
        {...cardProps}
      >
        {/* Floating orbs background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="floating-orb opacity-5" />
          <div className="floating-orb opacity-3" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </Comp>
    )
  }
)
ClientCard.displayName = "ClientCard"

/* ============================================================================ */
/* CLIENT BUTTON COMPONENT */
/* ============================================================================ */

const clientButtonVariants = cva(
  "relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      },
      glow: {
        none: "",
        subtle: "hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]",
        strong: "hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: "subtle"
    }
  }
)

interface ClientButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof clientButtonVariants> {
  asChild?: boolean
  animated?: boolean
}

export const ClientButton = forwardRef<HTMLButtonElement, ClientButtonProps>(
  ({ className, variant, size, glow, asChild = false, animated = true, children, ...props }, ref) => {
    const Comp = asChild ? Slot : motion.button

    const buttonProps = animated
      ? {
        variants: scaleVariants,
        initial: "hidden",
        animate: "visible",
        whileTap: "tap",
        whileHover: { y: -2 },
        ...props
      }
      : props

    return (
      <Comp
        className={cn(clientButtonVariants({ variant, size, glow, className }))}
        ref={ref}
        {...buttonProps}
      >
        {/* Ripple effect background */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-white to-transparent transition-opacity duration-300" />

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </Comp>
    )
  }
)
ClientButton.displayName = "ClientButton"

/* ============================================================================ */
/* CLIENT METRICS COMPONENT */
/* ============================================================================ */

interface ClientMetricsProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  animated?: boolean
}

export const ClientMetrics = forwardRef<HTMLDivElement, ClientMetricsProps>(
  ({ className, title, value, change, trend = 'neutral', icon, animated = true, ...props }, ref) => {
    const trendColors = {
      up: 'text-green-500',
      down: 'text-red-500',
      neutral: 'text-muted-foreground'
    }

    return (
      <ClientCard
        ref={ref}
        className={cn("group", className)}
        animated={animated}
        {...props}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {icon && (
            <motion.div
              variants={pulseVariants}
              animate="pulse"
              className="text-primary"
            >
              {icon}
            </motion.div>
          )}
        </div>

        <div className="space-y-1">
          <motion.div
            className="text-2xl font-bold"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          >
            {value}
          </motion.div>

          {change && (
            <motion.div
              className={cn("text-xs flex items-center gap-1", trendColors[trend])}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              {trend === 'up' && '↗'}
              {trend === 'down' && '↘'}
              {change}
            </motion.div>
          )}
        </div>
      </ClientCard>
    )
  }
)
ClientMetrics.displayName = "ClientMetrics"

/* ============================================================================ */
/* CLIENT TABLE COMPONENT */
/* ============================================================================ */

interface ClientTableProps extends HTMLAttributes<HTMLDivElement> {
  animated?: boolean
}

export const ClientTable = forwardRef<HTMLDivElement, ClientTableProps>(
  ({ className, animated = true, children, ...props }, ref) => {
    return (
      <ClientCard
        ref={ref}
        className={cn("overflow-hidden", className)}
        animated={animated}
        {...props}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            {children}
          </table>
        </div>
      </ClientCard>
    )
  }
)
ClientTable.displayName = "ClientTable"

/* ============================================================================ */
/* CLIENT NAVIGATION COMPONENT */
/* ============================================================================ */

interface ClientNavigationProps extends HTMLAttributes<HTMLElement> {
  items: Array<{
    id: string
    label: string
    icon?: React.ReactNode
    href?: string
    active?: boolean
    count?: number
  }>
  onItemClick?: (id: string) => void
  animated?: boolean
}

export const ClientNavigation = forwardRef<HTMLElement, ClientNavigationProps>(
  ({ className, items, onItemClick, animated = true, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            variants={slideUpVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.1 }}
          >
            <ClientButton
              variant={item.active ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => onItemClick?.(item.id)}
              animated={animated}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.count && (
                <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                  {item.count}
                </span>
              )}
            </ClientButton>
          </motion.div>
        ))}
      </nav>
    )
  }
)
ClientNavigation.displayName = "ClientNavigation"

/* ============================================================================ */
/* CLIENT FORM COMPONENT */
/* ============================================================================ */

interface ClientFormProps extends HTMLAttributes<HTMLFormElement> {
  animated?: boolean
}

export const ClientForm = forwardRef<HTMLFormElement, ClientFormProps>(
  ({ className, animated = true, children, ...props }, ref) => {
    return (
      <motion.form
        ref={ref}
        className={cn("space-y-6", className)}
        variants={animated ? containerVariants : undefined}
        initial={animated ? "hidden" : undefined}
        animate={animated ? "visible" : undefined}
        {...props}
      >
        {children}
      </motion.form>
    )
  }
)
ClientForm.displayName = "ClientForm"

/* ============================================================================ */
/* CLIENT SECTION COMPONENT */
/* ============================================================================ */

interface ClientSectionProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  animated?: boolean;
  collapsible?: string;
  defaultExpanded?: boolean;
}

export const ClientSection = forwardRef<HTMLDivElement, ClientSectionProps>(
  ({ className, title, description, animated = true, children, ...props }, ref) => {
    return (
      <motion.section
        ref={ref}
        className={cn("space-y-6", className)}
        variants={animated ? containerVariants : undefined}
        initial={animated ? "hidden" : undefined}
        animate={animated ? "visible" : undefined}
        {...props}
      >
        {(title || description) && (
          <div className="space-y-2">
            {title && (
              <h3 className="text-xl font-semibold text-white">{title}</h3>
            )}
            {description && (
              <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
            )}
          </div>
        )}
        <div className="space-y-4">
          {children}
        </div>
      </motion.section>
    )
  }
)
ClientSection.displayName = "ClientSection"

/* ============================================================================ */
/* EXPORTS */
/* ============================================================================ */

// Add missing components
export const ClientPageHeader = ClientSection
export const ClientMetricCard = ClientMetrics
export const ClientStatus = ClientMetrics
export const ClientGrid = ClientCard
export const ClientQuickStats = ClientMetrics
export const clientAnimations = {
  pageContainer: containerVariants,
  cardStagger: containerVariants,
  fadeIn: fadeInVariants,
  slideUp: slideUpVariants,
  scale: scaleVariants,
  pulse: pulseVariants,
  floating: floatingVariants,
  fadeInDelayed: fadeInVariants
}

/* ============================================================================ */
/* ENHANCED LEGACY COMPONENTS INTEGRATION */
/* ============================================================================ */

// Import enhanced components for ClientUI integration
import AvatarEnhanced from '../ui/avatar-enhanced'
import LoadingSpinnerEnhanced from '../ui/loading-spinner-enhanced'
import ProgressEnhanced from '../ui/progress-enhanced'
import ErrorBoundaryEnhanced from '../ui/error-boundary-enhanced'
import ModalEnhanced, { useModal } from '../ui/modal-enhanced'
import { ToastProvider, useToast } from '../ui/toast-enhanced'
import InfoModalEnhanced, { useInfoModal } from '../ui/info-modal-enhanced'
import NotificationButtonEnhanced from '../ui/notification-button-enhanced'

// Re-export enhanced components with ClientUI prefix
export { default as ClientAvatarEnhanced } from '../ui/avatar-enhanced'
export { default as ClientLoadingSpinnerEnhanced } from '../ui/loading-spinner-enhanced'
export { default as ClientProgressEnhanced } from '../ui/progress-enhanced'
export { default as ClientErrorBoundaryEnhanced } from '../ui/error-boundary-enhanced'
export { default as ClientModalEnhanced, useModal as useClientModal } from '../ui/modal-enhanced'
export { ToastProvider as ClientToastProvider, useToast as useClientToast } from '../ui/toast-enhanced'
export { default as ClientInfoModalEnhanced, useInfoModal as useClientInfoModal } from '../ui/info-modal-enhanced'
export { default as ClientNotificationButtonEnhanced } from '../ui/notification-button-enhanced'

// ClientUI-specific styled variants of enhanced components
export interface ClientUIAvatarProps {
  fullName?: string
  imageUrl?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'client' | 'gradient' | 'ring'
  showOnlineStatus?: boolean
  isOnline?: boolean
  className?: string
}

export const ClientUIAvatar = forwardRef<HTMLDivElement, ClientUIAvatarProps>(
  ({ variant = 'client', className, ...props }, ref) => {
    const clientVariant = variant === 'client' ? 'gradient' : variant

    return (
      <AvatarEnhanced
        ref={ref}
        variant={clientVariant}
        className={cn(
          'shadow-lg ring-1 ring-primary/20',
          variant === 'client' && 'bg-gradient-to-br from-red-500 to-red-600',
          className
        )}
        {...props}
      />
    )
  }
)
ClientUIAvatar.displayName = "ClientUIAvatar"

export interface ClientUIProgressProps {
  value?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'client' | 'gradient' | 'striped' | 'animated' | 'glow'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  showValue?: boolean
  showLabel?: boolean
  label?: string
  className?: string
  onComplete?: () => void
  animated?: boolean
  indeterminate?: boolean
}

export const ClientUIProgress = forwardRef<HTMLDivElement, ClientUIProgressProps>(
  ({ variant = 'client', color = 'primary', className, ...props }, ref) => {
    const clientVariant = variant === 'client' ? 'gradient' : variant

    return (
      <ProgressEnhanced
        ref={ref}
        variant={clientVariant}
        color={color}
        className={cn(
          'shadow-sm',
          variant === 'client' && '[&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-red-600',
          className
        )}
        {...props}
      />
    )
  }
)
ClientUIProgress.displayName = "ClientUIProgress"

export interface ClientUILoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'client' | 'dots' | 'pulse' | 'bounce' | 'icon' | 'gradient'
  color?: 'primary' | 'secondary' | 'accent' | 'muted'
  className?: string
  label?: string
}

export const ClientUILoadingSpinner = forwardRef<HTMLDivElement, ClientUILoadingSpinnerProps>(
  ({ variant = 'client', color = 'primary', className, ...props }, ref) => {
    const clientVariant = variant === 'client' ? 'gradient' : variant

    return (
      <LoadingSpinnerEnhanced
        ref={ref}
        variant={clientVariant}
        color={color}
        className={cn('text-primary', className)}
        {...props}
      />
    )
  }
)
ClientUILoadingSpinner.displayName = "ClientUILoadingSpinner"

// Enhanced Modal with ClientUI theming
export interface ClientUIModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'client' | 'centered' | 'drawer' | 'fullscreen'
  showCloseButton?: boolean
  showMaximize?: boolean
  closOnBackdrop?: boolean
  closOnEscape?: boolean
  className?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export const ClientUIModal = forwardRef<HTMLDivElement, ClientUIModalProps>(
  ({ variant = 'client', className, ...props }, ref) => {
    const clientVariant = variant === 'client' ? 'centered' : variant

    return (
      <ModalEnhanced
        ref={ref}
        variant={clientVariant}
        className={cn(
          'border-primary/20 shadow-2xl',
          variant === 'client' && 'bg-card/95 backdrop-blur-xl',
          className
        )}
        {...props}
      />
    )
  }
)
ClientUIModal.displayName = "ClientUIModal"

// Export all enhanced components with ClientUI prefix for organization
export const ClientUIEnhanced = {
  Avatar: ClientUIAvatar,
  Progress: ClientUIProgress,
  LoadingSpinner: ClientUILoadingSpinner,
  Modal: ClientUIModal,
  ErrorBoundary: ErrorBoundaryEnhanced,
  ToastProvider: ToastProvider,
  NotificationButton: NotificationButtonEnhanced,
  InfoModal: InfoModalEnhanced,

  // Hooks
  useModal: useModal,
  useToast: useToast,
  useInfoModal: useInfoModal
}

/* ============================================================================ */
/* CLIENTUI COMPONENT VARIANTS */
/* ============================================================================ */

// Enhanced component variants specifically for ClientUI theming
export const clientUIVariants = {
  avatar: {
    default: 'shadow-md ring-1 ring-border/50',
    client: 'shadow-lg ring-2 ring-primary/20 bg-gradient-to-br from-red-500 to-red-600',
    premium: 'shadow-xl ring-2 ring-primary/30 bg-gradient-to-br from-red-400 to-red-700 shadow-primary/25'
  },
  progress: {
    default: 'bg-muted',
    client: '[&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-red-600 [&>div]:shadow-lg',
    premium: '[&>div]:bg-gradient-to-r [&>div]:from-red-400 [&>div]:to-red-700 [&>div]:shadow-xl [&>div]:shadow-red-500/25'
  },
  modal: {
    default: 'bg-card border-border dark:border-border',
    client: 'bg-card/95 backdrop-blur-xl border-primary/20 shadow-2xl shadow-primary/10',
    premium: 'bg-gradient-to-br from-card/90 to-card/95 backdrop-blur-xl border-primary/30 shadow-2xl shadow-primary/20'
  }
}
/**
 * 🎨 Enhanced SGPT Client UI Kit - Premium Version
 * Professional, animated, and highly performant UI components
 * Mirrors Admin UI Kit with client-focused adaptations
 * Supports dark/red/grey and orange/blue themes with customizable settings
 * @deprecated Use unified exports from `@/components/base-ui` where applicable.
 */

import React, { forwardRef, HTMLAttributes, ButtonHTMLAttributes } from 'react';
import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
  Mail,
  Target,
  Users,
  BarChart3,
  DollarSign
} from 'lucide-react';

/* ============================================================================ */
/* ENHANCED ANIMATION VARIANTS */
/* ============================================================================ */

export const clientAnimations = {
  // Page-level animations
  pageContainer: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  },

  // Card animations
  cardEntrance: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 200,
        mass: 0.8
      }
    },
    hover: {
      y: -4,
      scale: 1.02,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    }
  },

  // Float animation for icons
  floatingIcon: {
    animate: {
      y: [-2, 2, -2],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Pulse animation for active elements
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Slide in from left
  slideInLeft: {
    initial: { opacity: 0, x: -30 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  },

  // Slide in from right
  slideInRight: {
    initial: { opacity: 0, x: 30 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  },

  // Fade in with delay
  fadeInDelayed: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.3, delay: 0.2 }
    }
  }
};

/* ============================================================================ */
/* PROFESSIONAL COLOR PALETTE - CLIENT THEME */
/* ============================================================================ */

export const clientColors = {
  // Status colors
  status: {
    healthy: "hsl(142 76% 36%)",      // green-600
    warning: "hsl(45 93% 47%)",       // yellow-500  
    error: "hsl(0 84% 60%)",          // red-500
    info: "hsl(217 91% 60%)",         // blue-500
    offline: "hsl(215 20% 65%)",      // gray-400
    success: "hsl(142 71% 45%)",      // green-500
  },

  // Theme colors
  theme: {
    primary: "hsl(0 72% 51%)",        // Red primary
    secondary: "hsl(240 3.7% 15.9%)", // Dark gray
    accent: "hsl(12 76% 61%)",        // Orange accent
    background: "hsl(240 10% 3.9%)",  // Dark background
    foreground: "hsl(0 0% 98%)",      // Light text
    muted: "hsl(240 3.8% 46.1%)",     // Muted text
    border: "hsl(240 3.7% 15.9%)",    // Border color
  }
};

/* ============================================================================ */
/* CLIENT PAGE HEADER COMPONENT */
/* ============================================================================ */

interface ClientPageHeaderProps {
  title: string;
  description?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  actions?: React.ReactNode;
  className?: string;
  showStats?: boolean;
  stats?: Array<{
    label: string;
    value: string | number;
    icon?: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }>;
}

export const ClientPageHeader: React.FC<ClientPageHeaderProps> = ({
  title,
  description,
  badge,
  actions,
  className,
  showStats = false,
  stats = []
}) => {
  return (
    <motion.div
      variants={clientAnimations.slideInLeft}
      initial="initial"
      animate="animate"
      className={cn(
        "space-y-6 pb-6 border-b border-border dark:border-border/10",
        className
      )}
    >
      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <motion.h1
              className="text-3xl font-bold text-foreground"
              variants={clientAnimations.fadeInDelayed}
            >
              {title}
            </motion.h1>
            {badge && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Badge variant={badge.variant || "default"} className="px-2 py-1">
                  {badge.text}
                </Badge>
              </motion.div>
            )}
          </div>
          {description && (
            <motion.p
              className="text-muted-foreground text-lg"
              variants={clientAnimations.fadeInDelayed}
            >
              {description}
            </motion.p>
          )}
        </div>

        {actions && (
          <motion.div
            variants={clientAnimations.slideInRight}
            className="flex items-center gap-2"
          >
            {actions}
          </motion.div>
        )}
      </div>

      {/* Stats Row */}
      {showStats && stats.length > 0 && (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          variants={clientAnimations.pageContainer}
        >
          {stats.map((stat, index) => (
            <ClientQuickStat key={index} {...stat} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

/* ============================================================================ */
/* CLIENT STATS CARD COMPONENT */
/* ============================================================================ */

interface ClientStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  loading?: boolean;
}

export const ClientStatsCard: React.FC<ClientStatsCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  className,
  loading = false
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Activity;
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <motion.div
      variants={clientAnimations.cardEntrance}
      whileHover="hover"
      className={cn(className)}
    >
      <Card className="bg-card/50 border-border dark:border-border/20 hover:border-primary/20 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              {loading ? (
                <div className="h-8 w-20 bg-muted/20 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-foreground">{value}</p>
              )}
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              {Icon && (
                <motion.div
                  variants={clientAnimations.floatingIcon}
                  animate="animate"
                  className="p-2 rounded-lg bg-primary/10"
                >
                  <Icon className="w-4 h-4 text-primary" />
                </motion.div>
              )}

              {trend && trendValue && (
                <div className={cn("flex items-center gap-1 text-xs", getTrendColor())}>
                  <TrendIcon className="w-3 h-3" />
                  <span>{trendValue}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/* ============================================================================ */
/* CLIENT QUICK STAT COMPONENT */
/* ============================================================================ */

interface ClientQuickStatProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export const ClientQuickStat: React.FC<ClientQuickStatProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  trendValue
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <motion.div
      variants={clientAnimations.cardEntrance}
      className="bg-card/30 border border-border dark:border-border/20 rounded-lg p-4 hover:border-primary/20 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
          {trend && trendValue && (
            <p className={cn("text-xs", getTrendColor())}>
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
            </p>
          )}
        </div>
        {Icon && (
          <Icon className="w-5 h-5 text-primary/70" />
        )}
      </div>
    </motion.div>
  );
};

/* ============================================================================ */
/* CLIENT ENHANCED CARD COMPONENT */
/* ============================================================================ */

interface ClientEnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  actions?: React.ReactNode;
  loading?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
}

export const ClientEnhancedCard: React.FC<ClientEnhancedCardProps> = ({
  title,
  description,
  icon: Icon,
  badge,
  actions,
  loading = false,
  interactive = false,
  children,
  className,
  ...props
}) => {
  return (
    <motion.div
      variants={clientAnimations.cardEntrance}
      whileHover={interactive ? "hover" : undefined}
      className={cn(
        "group",
        interactive && "cursor-pointer",
        className
      )}
      {...props}
    >
      <Card className="bg-card/50 border-border dark:border-border/20 hover:border-primary/30 transition-all duration-300 h-full">
        {(title || description || Icon || badge || actions) && (
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {Icon && (
                  <motion.div
                    variants={clientAnimations.floatingIcon}
                    animate="animate"
                    className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-primary" />
                  </motion.div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {title && (
                      <CardTitle className="text-lg text-foreground">
                        {loading ? (
                          <div className="h-5 w-32 bg-muted/20 animate-pulse rounded"></div>
                        ) : (
                          title
                        )}
                      </CardTitle>
                    )}
                    {badge && (
                      <Badge variant={badge.variant || "default"} className="text-xs">
                        {badge.text}
                      </Badge>
                    )}
                  </div>
                  {description && (
                    <p className="text-sm text-muted-foreground">
                      {loading ? (
                        <div className="h-4 w-48 bg-muted/20 animate-pulse rounded"></div>
                      ) : (
                        description
                      )}
                    </p>
                  )}
                </div>
              </div>

              {actions && (
                <div className="flex items-center gap-1">
                  {actions}
                </div>
              )}
            </div>
          </CardHeader>
        )}

        <CardContent className={cn(title || description ? "pt-0" : "")}>
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 w-full bg-muted/20 animate-pulse rounded"></div>
              <div className="h-4 w-3/4 bg-muted/20 animate-pulse rounded"></div>
              <div className="h-4 w-1/2 bg-muted/20 animate-pulse rounded"></div>
            </div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

/* ============================================================================ */
/* CLIENT METRIC GRID COMPONENT */
/* ============================================================================ */

interface ClientMetricGridProps {
  metrics: Array<{
    title: string;
    value: string | number;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }>;
  loading?: boolean;
  className?: string;
  columns?: 2 | 3 | 4;
}

export const ClientMetricGrid: React.FC<ClientMetricGridProps> = ({
  metrics,
  loading = false,
  className,
  columns = 4
}) => {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <motion.div
      variants={clientAnimations.pageContainer}
      initial="initial"
      animate="animate"
      className={cn(
        "grid gap-4",
        gridCols[columns],
        className
      )}
    >
      {metrics.map((metric, index) => (
        <ClientStatsCard
          key={index}
          loading={loading}
          {...metric}
        />
      ))}
    </motion.div>
  );
};

/* ============================================================================ */
/* CLIENT ENHANCED BUTTON COMPONENT */
/* ============================================================================ */

interface ClientEnhancedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export const ClientEnhancedButton: React.FC<ClientEnhancedButtonProps> = ({
  variant = "default",
  size = "default",
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  children,
  className,
  disabled,
  ...props
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-block"
    >
      <Button
        variant={variant === "default" ? "primary" : variant}
        size={size}
        disabled={disabled || loading}
        className={cn(
          "gap-2 transition-all duration-200",
          loading && "opacity-70 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            />
            Loading...
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
          </>
        )}
      </Button>
    </motion.div>
  );
};

/* ============================================================================ */
/* EXPORT ALL COMPONENTS */
/* ============================================================================ */

export default {
  ClientPageHeader,
  ClientStatsCard,
  ClientQuickStat,
  ClientEnhancedCard,
  ClientMetricGrid,
  ClientEnhancedButton
};
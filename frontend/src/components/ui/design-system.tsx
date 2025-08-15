/**
 * Professional Marketing Platform Design System
 * Comprehensive UI library for marketing specialists
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ==================== ANIMATION PRESETS ====================

export const animations = {
  // Page transitions
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: "easeInOut" }
  },

  // Card animations
  cardHover: {
    whileHover: {
      y: -2,
      boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
      transition: { duration: 0.2 }
    },
    whileTap: { scale: 0.98 }
  },

  // Stagger children
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" }
  },

  // Slide in from sides
  slideInLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: "easeOut" }
  },

  slideInRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

// ==================== GRADIENT BACKGROUNDS ====================

export const GradientBackground: React.FC<{
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  className?: string;
  children: React.ReactNode;
}> = ({ variant = 'primary', className, children }) => {
  const gradients = {
    primary: 'bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500',
    secondary: 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900',
    accent: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600',
    success: 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600',
    warning: 'bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500',
    error: 'bg-gradient-to-br from-red-400 via-pink-500 to-rose-600'
  };

  return (
    <div className={cn(gradients[variant], className)}>
      {children}
    </div>
  );
};

// ==================== MARKETING CARDS ====================

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  description?: string;
  trend?: number[];
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  description,
  trend,
  className
}) => {
  const changeColor = change?.type === 'increase'
    ? 'text-green-500'
    : change?.type === 'decrease'
      ? 'text-red-500'
      : 'text-muted-foreground';

  return (
    <motion.div {...animations.cardHover}>
      <Card className={cn(
        "relative overflow-hidden bg-white/5 backdrop-blur-sm border-white/10",
        "hover:bg-white/10 transition-all duration-300",
        className
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            {icon && (
              <div className="text-primary opacity-70">
                {icon}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold text-white">{value}</div>
            {change && (
              <div className={cn("text-sm flex items-center", changeColor)}>
                <span>{change.type === 'increase' ? '↗' : change.type === 'decrease' ? '↘' : '→'}</span>
                <span className="ml-1">{Math.abs(change.value)}%</span>
              </div>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </CardContent>

        {/* Subtle overlay in primary hue */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      </Card>
    </motion.div>
  );
};

// ==================== FEATURE CARDS ====================

export interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: 'default' | 'premium' | 'highlighted';
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  badge,
  badgeVariant = 'default',
  action,
  className,
  variant = 'default'
}) => {
  const variantStyles = {
    default: 'bg-card border-border',
    premium: 'bg-muted border-border',
    highlighted: 'bg-muted border-border'
  };

  return (
    <motion.div {...animations.cardHover}>
      <Card className={cn(
        "relative overflow-hidden backdrop-blur-sm",
        "hover:bg-white/10 transition-all duration-300",
        variantStyles[variant],
        className
      )}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {icon && (
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {icon}
                </div>
              )}
              <div>
                <CardTitle className="text-white">{title}</CardTitle>
                {badge && (
                  <Badge variant={badgeVariant} className="mt-1">
                    {badge}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-muted-foreground">
            {description}
          </CardDescription>
        </CardContent>
        {action && (
          <CardFooter>
            <Button
              onClick={action.onClick}
              variant="ghost"
              className="w-full bg-white/5 hover:bg-white/10 text-white"
            >
              {action.label}
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
};

// ==================== STATUS INDICATORS ====================

export interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'pending' | 'error' | 'warning';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
  showLabel = true
}) => {
  const statusConfig = {
    online: { color: 'bg-primary', label: label || 'Online' },
    offline: { color: 'bg-muted-foreground', label: label || 'Offline' },
    pending: { color: 'bg-primary/60', label: label || 'Pending' },
    error: { color: 'bg-muted-foreground', label: label || 'Error' },
    warning: { color: 'bg-muted-foreground', label: label || 'Warning' }
  };

  const sizeConfig = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <div className={cn(
          "rounded-full",
          statusConfig[status].color,
          sizeConfig[size]
        )} />
        {status === 'online' && (
          <div className={cn(
            "absolute inset-0 rounded-full animate-ping",
            statusConfig[status].color,
            "opacity-75"
          )} />
        )}
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {statusConfig[status].label}
        </span>
      )}
    </div>
  );
};

// ==================== LOADING STATES ====================

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({
  size = 'md'
}) => {
  const sizeConfig = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn(
      "animate-spin rounded-full border-2 border-border border-t-primary",
      sizeConfig[size]
    )} />
  );
};

export const LoadingCard: React.FC = () => (
  <Card className="bg-white/5 backdrop-blur-sm border-white/10">
    <CardContent className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-1/3"></div>
        <div className="h-8 bg-muted rounded w-1/2"></div>
        <div className="h-3 bg-muted rounded w-full"></div>
        <div className="h-3 bg-muted rounded w-2/3"></div>
      </div>
    </CardContent>
  </Card>
);

// ==================== RESPONSIVE CONTAINERS ====================

export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({
  children,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md',
  className
}) => {
    const gapConfig = {
      sm: 'gap-3',
      md: 'gap-6',
      lg: 'gap-8'
    };

    // Tailwind cannot parse dynamic grid col classes reliably.
    const gridMap: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    };

    return (
      <div className={cn(
        'grid',
        gridMap[cols.sm || 1] || 'grid-cols-1',
        `md:${gridMap[cols.md || 2] || 'md:grid-cols-2'}`,
        `lg:${gridMap[cols.lg || 3] || 'lg:grid-cols-3'}`,
        `xl:${gridMap[cols.xl || 4] || 'xl:grid-cols-4'}`,
        gapConfig[gap],
        className
      )}>
        {children}
      </div>
    );
  };

export const ResponsiveContainer: React.FC<{
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}> = ({ children, size = 'lg', className }) => {
  const sizeConfig = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-7xl'
  };

  return (
    <div className={cn(
      "mx-auto px-4 sm:px-6 lg:px-8",
      sizeConfig[size],
      className
    )}>
      {children}
    </div>
  );
};

// ==================== SECTION HEADERS ====================

export const SectionHeader: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, description, action, className }) => (
  <motion.div
    className={cn("flex items-center justify-between mb-6", className)}
    {...animations.slideInLeft}
  >
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground">
          {description}
        </p>
      )}
    </div>
    {action && (
      <div>
        {action}
      </div>
    )}
  </motion.div>
);

// ==================== EXPORT ALL ====================

export const DesignSystem = {
  animations,
  GradientBackground,
  MetricCard,
  FeatureCard,
  StatusIndicator,
  LoadingSpinner,
  LoadingCard,
  ResponsiveGrid,
  ResponsiveContainer,
  SectionHeader
};

export default DesignSystem;
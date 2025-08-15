/**
 * Professional Admin UI Kit - shadcn/ui Style
 * Unified design system for all admin pages
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  TrendingDown
} from 'lucide-react';

// Animation variants following shadcn/ui patterns
export const adminAnimations = {
  page: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: "easeInOut" }
  },
  card: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2, ease: "easeOut" }
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

// Professional color palette
export const adminColors = {
  status: {
    healthy: "hsl(142 76% 36%)",      // green-600
    warning: "hsl(45 93% 47%)",       // yellow-500  
    error: "hsl(0 84% 60%)",          // red-500
    info: "hsl(217 91% 60%)",         // blue-500
    offline: "hsl(215 20% 65%)",      // gray-400
  },
  text: {
    healthy: "hsl(142 76% 36%)",
    warning: "hsl(45 93% 47%)", 
    error: "hsl(0 84% 60%)",
    info: "hsl(217 91% 60%)",
    offline: "hsl(215 20% 65%)",
  },
  background: {
    primary: "hsl(240 10% 3.9%)",
    secondary: "hsl(240 4.8% 95.9%)",
    muted: "hsl(240 4.8% 95.9%)",
    accent: "hsl(240 4.8% 95.9%)",
    card: "hsl(240 10% 3.9%)",
    popover: "hsl(240 10% 3.9%)",
  },
  foreground: {
    primary: "hsl(0 0% 98%)",
    secondary: "hsl(240 5.9% 10%)",
    muted: "hsl(240 3.8% 46.1%)",
    accent: "hsl(240 5.9% 10%)",
    destructive: "hsl(0 62.8% 30.6%)",
  },
  border: {
    default: "hsl(240 3.7% 15.9%)",
    input: "hsl(240 3.7% 15.9%)",
  },
  admin: {
    primary: "hsl(0 72% 51%)", // Red primary
    secondary: "hsl(240 3.7% 15.9%)", // Dark gray
    accent: "hsl(12 76% 61%)", // Orange accent
    success: "hsl(142 71% 45%)", // Green
    warning: "hsl(38 92% 50%)", // Yellow
    danger: "hsl(0 84% 60%)", // Red
  }
};

// Professional Admin Page Header
interface AdminPageHeaderProps {
  title: string;
  description?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  actions?: React.ReactNode;
  className?: string;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  description,
  badge,
  actions,
  className
}) => (
  <motion.div
    {...adminAnimations.slideIn}
    className={cn(
      "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6 pb-4 sm:pb-6 border-b border-border dark:border-border/40",
      className
    )}
  >
    <div className="space-y-1 w-full">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {badge && (
          <Badge 
            variant={badge.variant || "secondary"}
            className="text-xs font-medium"
          >
            {badge.text}
          </Badge>
        )}
      </div>
      {description && (
        <p className="text-muted-foreground text-sm max-w-3xl">
          {description}
        </p>
      )}
    </div>
    {actions && (
      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
        {actions}
      </div>
    )}
  </motion.div>
);

// Professional Stats Card
interface AdminStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    type: "up" | "down" | "neutral";
    value: string;
  };
  icon?: React.ReactNode;
  className?: string;
}

export const AdminStatsCard: React.FC<AdminStatsCardProps> = ({
  title,
  value,
  description,
  trend,
  icon,
  className
}) => (
  <motion.div {...adminAnimations.card}>
    <Card className={cn("hover:shadow-md transition-shadow duration-200", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-4 w-4 text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            {trend && (
              <div className={cn(
                "flex items-center gap-1",
                trend.type === "up" && "text-green-500",
                trend.type === "down" && "text-red-500",
                trend.type === "neutral" && "text-muted-foreground"
              )}>
                {trend.type === "up" && <TrendingUp className="h-3 w-3" />}
                {trend.type === "down" && <TrendingDown className="h-3 w-3" />}
                <span>{trend.value}</span>
              </div>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

// Professional Status Indicator
interface AdminStatusProps {
  status: "online" | "offline" | "warning" | "error";
  label: string;
  description?: string;
  className?: string;
}

export const AdminStatus: React.FC<AdminStatusProps> = ({
  status,
  label,
  description,
  className
}) => {
  const statusConfig = {
    online: {
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20"
    },
    offline: {
      icon: AlertTriangle,
      color: "text-muted-foreground",
      bgColor: "bg-muted/10",
      borderColor: "border-border/20"
    },
    warning: {
      icon: AlertTriangle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20"
    },
    error: {
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20"
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border",
      config.bgColor,
      config.borderColor,
      className
    )}>
      <Icon className={cn("h-4 w-4", config.color)} />
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
    </div>
  );
};

// Professional Admin Grid Layout
interface AdminGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export const AdminGrid: React.FC<AdminGridProps> = ({
  children,
  columns = 3,
  gap = "md",
  className
}) => (
  <div className={cn(
    "grid w-full",
    {
      "grid-cols-1": columns === 1,
      "grid-cols-1 sm:grid-cols-2": columns === 2,
      "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3": columns === 3,
      "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4": columns === 4,
      "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5": columns === 5,
      "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6": columns === 6,
      "gap-2": gap === "sm",
      "gap-3 sm:gap-4": gap === "md",
      "gap-4 sm:gap-6": gap === "lg"
    },
    className
  )}>
    {children}
  </div>
);

// Professional Admin Section
interface AdminSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const AdminSection: React.FC<AdminSectionProps> = ({
  title,
  description,
  children,
  className
}) => (
  <motion.div
    {...adminAnimations.slideIn}
    className={cn("space-y-4 sm:space-y-6", className)}
  >
    <div className="space-y-1 sm:space-y-2">
      <h2 className="text-lg sm:text-xl font-semibold text-foreground leading-tight">{title}</h2>
      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
      )}
    </div>
    <Separator className="bg-border/40" />
    <div className="space-y-4">{children}</div>
  </motion.div>
);

// Professional Admin Card with responsive design
interface AdminCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "stats" | "alert";
}

export const AdminCard: React.FC<AdminCardProps> = ({
  title,
  description,
  children,
  className,
  variant = "default"
}) => (
  <motion.div {...adminAnimations.card}>
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200",
      variant === "stats" && "hover:shadow-lg hover:scale-[1.02]",
      variant === "alert" && "border-l-4 border-l-yellow-500",
      className
    )}>
      {(title || description) && (
        <CardHeader className="pb-2 sm:pb-3">
          {title && (
            <CardTitle className="text-base sm:text-lg font-semibold leading-tight">
              {title}
            </CardTitle>
          )}
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(
        "pt-0",
        !title && !description && "pt-4 sm:pt-6"
      )}>
        {children}
      </CardContent>
    </Card>
  </motion.div>
);

// Status utilities for consistent styling
export const getStatusColor = (status: string, type: 'bg' | 'text' | 'border' = 'text') => {
  const statusMap = {
    'healthy': adminColors.status.healthy,
    'operational': adminColors.status.healthy,
    'running': adminColors.status.healthy,
    'active': adminColors.status.healthy,
    'warning': adminColors.status.warning,
    'degraded': adminColors.status.warning,
    'error': adminColors.status.error,
    'unhealthy': adminColors.status.error,
    'stopped': adminColors.status.error,
    'failed': adminColors.status.error,
    'info': adminColors.status.info,
    'offline': adminColors.status.offline,
    'inactive': adminColors.status.offline,
  };
  
  const color = statusMap[status.toLowerCase()] || adminColors.status.offline;
  
  switch (type) {
    case 'bg':
      return `[background-color:${color}]`;
    case 'border':
      return `[border-color:${color}]`;
    default:
      return `[color:${color}]`;
  }
};

export const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status.toLowerCase()) {
    case 'healthy':
    case 'operational':
    case 'running':
    case 'active':
      return 'default';
    case 'warning':
    case 'degraded':
      return 'outline';
    case 'error':
    case 'unhealthy':
    case 'stopped':
    case 'failed':
      return 'destructive';
    default:
      return 'secondary';
  }
};

// Professional status badge component
interface AdminStatusBadgeProps {
  status: string;
  children?: React.ReactNode;
  className?: string;
}

export const AdminStatusBadge: React.FC<AdminStatusBadgeProps> = ({ 
  status, 
  children, 
  className 
}) => {
  const variant = getStatusBadgeVariant(status);
  const statusLower = status.toLowerCase();
  
  const getStatusClasses = () => {
    switch (statusLower) {
      case 'healthy':
      case 'operational':
      case 'running':
      case 'active':
        return 'bg-green-600 text-white';
      case 'warning':
      case 'degraded':
        return 'text-yellow-400 border-yellow-400';
      case 'error':
      case 'unhealthy':
      case 'stopped':
      case 'failed':
        return 'bg-red-600 text-white';
      default:
        return '';
    }
  };
  
  return (
    <Badge 
      variant={variant} 
      className={cn(getStatusClasses(), className)}
    >
      {children || status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

// Export professional theme CSS variables
export const adminThemeCSS = `
  :root {
    --admin-background: ${adminColors.background.primary};
    --admin-foreground: ${adminColors.foreground.primary};
    --admin-primary: ${adminColors.admin.primary};
    --admin-secondary: ${adminColors.admin.secondary};
    --admin-accent: ${adminColors.admin.accent};
    --admin-border: ${adminColors.border.default};
    --admin-muted: ${adminColors.foreground.muted};
    --admin-success: ${adminColors.admin.success};
    --admin-warning: ${adminColors.admin.warning};
    --admin-danger: ${adminColors.admin.danger};
  }
`;
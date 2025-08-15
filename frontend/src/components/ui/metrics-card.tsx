import React from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Eye, 
  MoreHorizontal,
  Mail,
  Users,
  Activity,
  DollarSign,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export interface MetricData {
  label: string
  value: string | number
  previousValue?: string | number
  target?: number
  unit?: string
  format?: 'number' | 'currency' | 'percentage' | 'duration'
}

export interface MetricsCardProps {
  title: string
  metric: MetricData
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: number
  trendLabel?: string
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  showProgress?: boolean
  progressValue?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'gradient' | 'outline' | 'filled'
  interactive?: boolean
  loading?: boolean
  actions?: Array<{
    label: string
    onClick: () => void
    icon?: React.ComponentType<{ className?: string }>
  }>
  onClick?: () => void
  className?: string
}

const statusConfig = {
  success: {
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/20',
  },
  warning: {
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
  },
  error: {
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
  },
  info: {
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/20',
  },
  neutral: {
    color: 'text-muted-foreground',
    bg: 'bg-muted/20',
    border: 'border-muted/20',
  },
}

const variantConfig = {
  default: 'bg-card border-border',
  gradient: 'bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20',
  outline: 'bg-transparent border-2 border-border',
  filled: 'bg-muted/30 border-muted',
}

const formatValue = (value: string | number, format?: string, unit?: string): string => {
  if (typeof value !== 'number') return String(value)
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value)
    case 'percentage':
      return `${value.toFixed(1)}%`
    case 'duration':
      if (value < 60) return `${Math.round(value)}s`
      if (value < 3600) return `${Math.round(value / 60)}m`
      return `${Math.round(value / 3600)}h`
    case 'number':
    default:
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(value)
      return unit ? `${formatted} ${unit}` : formatted
  }
}

const calculateTrend = (current: number, previous: number): { value: number; direction: 'up' | 'down' | 'neutral' } => {
  if (previous === 0) return { value: 0, direction: 'neutral' }
  
  const change = ((current - previous) / previous) * 100
  return {
    value: Math.abs(change),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
  }
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  metric,
  description,
  icon: Icon,
  trend,
  trendValue,
  trendLabel,
  status = 'neutral',
  showProgress = false,
  progressValue,
  size = 'md',
  variant = 'default',
  interactive = false,
  loading = false,
  actions,
  onClick,
  className,
}) => {
  // Auto-calculate trend if not provided
  const autoTrend = React.useMemo(() => {
    if (trend || !metric.previousValue || typeof metric.value !== 'number' || typeof metric.previousValue !== 'number') {
      return { direction: trend || 'neutral', value: trendValue || 0 }
    }
    return calculateTrend(metric.value, metric.previousValue)
  }, [trend, trendValue, metric.value, metric.previousValue])

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const TrendIcon = autoTrend.direction === 'up' ? TrendingUp : 
                   autoTrend.direction === 'down' ? TrendingDown : Minus

  const trendColor = autoTrend.direction === 'up' ? 'text-success' :
                     autoTrend.direction === 'down' ? 'text-destructive' :
                     'text-muted-foreground'

  const formattedValue = formatValue(metric.value, metric.format, metric.unit)
  const config = statusConfig[status]

  if (loading) {
    return (
      <Card className={cn(variantConfig[variant], className)}>
        <CardContent className={sizeClasses[size]}>
          <div className="animate-pulse space-y-4">
            <div className="flex justify-between">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-8 w-8 bg-muted rounded" />
            </div>
            <div className="h-8 bg-muted rounded w-2/3" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      whileHover={interactive ? { scale: 1.02 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          variantConfig[variant],
          config.border,
          interactive && 'cursor-pointer hover:shadow-lg transition-all duration-200',
          className
        )}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className={cn('p-2 rounded-lg', config.bg)}>
                <Icon className={cn('h-4 w-4', config.color)} />
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
          
          {actions && actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, index) => (
                  <DropdownMenuItem key={index} onClick={action.onClick}>
                    {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>

        <CardContent className={cn(sizeClasses[size], 'pt-0')}>
          <div className="space-y-3">
            {/* Main Metric */}
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {formattedValue}
                </p>
                {metric.label && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.label}
                  </p>
                )}
              </div>
              
              {/* Trend Indicator */}
              {(autoTrend.value > 0 || trendLabel) && (
                <div className="flex items-center gap-1">
                  <TrendIcon className={cn('h-4 w-4', trendColor)} />
                  <span className={cn('text-sm font-medium', trendColor)}>
                    {trendLabel || `${autoTrend.value.toFixed(1)}%`}
                  </span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {showProgress && typeof progressValue === 'number' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{progressValue}%</span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>
            )}

            {/* Target Progress */}
            {metric.target && typeof metric.value === 'number' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Target</span>
                  <span>{formatValue(metric.target, metric.format, metric.unit)}</span>
                </div>
                <Progress 
                  value={(metric.value / metric.target) * 100} 
                  className="h-2" 
                />
              </div>
            )}

            {/* Status Badge */}
            {status !== 'neutral' && (
              <Badge 
                variant="secondary" 
                className={cn('text-xs', config.color, config.bg)}
              >
                {status === 'success' && <CheckCircle className="h-3 w-3 mr-1" />}
                {status === 'warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
                {status === 'error' && <AlertTriangle className="h-3 w-3 mr-1" />}
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Preset metric cards for common email marketing KPIs
export const EmailMetricsCard: React.FC<Omit<MetricsCardProps, 'icon'>> = (props) => (
  <MetricsCard {...props} icon={Mail} />
)

export const UsersMetricsCard: React.FC<Omit<MetricsCardProps, 'icon'>> = (props) => (
  <MetricsCard {...props} icon={Users} />
)

export const EngagementMetricsCard: React.FC<Omit<MetricsCardProps, 'icon'>> = (props) => (
  <MetricsCard {...props} icon={Activity} />
)

export const RevenueMetricsCard: React.FC<Omit<MetricsCardProps, 'icon'>> = (props) => (
  <MetricsCard {...props} icon={DollarSign} />
)

export const ConversionMetricsCard: React.FC<Omit<MetricsCardProps, 'icon'>> = (props) => (
  <MetricsCard {...props} icon={Target} />
)

// Grid layout for multiple metrics
interface MetricsGridProps {
  metrics: MetricsCardProps[]
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  columns = 3,
  gap = 'md',
  className,
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  }

  return (
    <div className={cn('grid', gridClasses[columns], gapClasses[gap], className)}>
      {metrics.map((metric, index) => (
        <MetricsCard key={index} {...metric} />
      ))}
    </div>
  )
}

export default MetricsCard
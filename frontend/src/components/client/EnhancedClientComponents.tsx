/**
 * Enhanced Client Components with Real-time Features
 * Advanced animations, live data updates, and interactive elements
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  Mail,
  Target,
  BarChart3,
  Users,
  Globe,
  Clock,
  Star,
  Heart,
  Send,
  Eye,
  Download,
  Settings,
  Plus,
  ArrowRight,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Loader2,
  ExternalLink,
  Calendar,
  DollarSign,
  TrendingUp as TrendUp,
  Filter,
  Search,
  MoreHorizontal
} from 'lucide-react';
import { clientAnimations } from './ClientUIKitEnhanced';

// ==================== REAL-TIME CAMPAIGN CARD ====================

interface RealTimeCampaignCardProps {
  title: string;
  campaignId: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
  progress: number;
  estimatedCompletion?: string;
  updateInterval?: number;
  onStatusChange?: (newStatus: string) => void;
  className?: string;
}

export const RealTimeCampaignCard: React.FC<RealTimeCampaignCardProps> = ({
  title,
  campaignId,
  status,
  metrics,
  progress,
  estimatedCompletion,
  updateInterval = 5000,
  onStatusChange,
  className
}) => {
  const defaultMetrics = {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0
  };
  const [currentMetrics, setCurrentMetrics] = useState(metrics || defaultMetrics);
  const [isLive, setIsLive] = useState(status === 'running');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const intervalRef = useRef<NodeJS.Timeout>();

  // Simulate real-time updates for running campaigns
  const updateMetrics = useCallback(() => {
    if (status === 'running') {
      setCurrentMetrics(prev => {
        const safePrev = prev || defaultMetrics;
        return {
          sent: safePrev.sent + Math.floor(Math.random() * 10),
          delivered: safePrev.delivered + Math.floor(Math.random() * 8),
          opened: safePrev.opened + Math.floor(Math.random() * 3),
          clicked: safePrev.clicked + Math.floor(Math.random() * 1),
          bounced: safePrev.bounced + Math.floor(Math.random() * 1),
        };
      });
      setLastUpdate(new Date());
    }
  }, [status]);

  useEffect(() => {
    if (isLive && status === 'running') {
      intervalRef.current = setInterval(updateMetrics, updateInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLive, status, updateInterval, updateMetrics]);

  const statusConfig = {
    draft: { color: 'text-muted-foreground', bg: 'bg-muted/10', border: 'border-border/20' },
    running: { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    paused: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    completed: { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    failed: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  };

  const config = statusConfig[status];
  const safeMetrics = currentMetrics || defaultMetrics;
  const deliveryRate = safeMetrics.sent > 0 ? (safeMetrics.delivered / safeMetrics.sent) * 100 : 0;
  const openRate = safeMetrics.delivered > 0 ? (safeMetrics.opened / safeMetrics.delivered) * 100 : 0;
  const clickRate = safeMetrics.opened > 0 ? (safeMetrics.clicked / safeMetrics.opened) * 100 : 0;

  return (
    <motion.div
      {...clientAnimations.cardEntrance}
      className={className}
    >
      <Card className="relative overflow-hidden border-border dark:border-border/40 hover:border-primary/50 transition-all duration-300">
        {/* Status indicator bar */}
        <div className={cn("absolute top-0 left-0 w-full h-1", config.bg)} />
        
        {/* Live indicator */}
        {status === 'running' && isLive && (
          <motion.div
            className="absolute top-3 right-3 flex items-center gap-1 text-xs text-green-500"
            {...clientAnimations.pulse}
          >
            <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
            LIVE
          </motion.div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={status === 'failed' ? 'destructive' : status === 'running' || status === 'completed' ? 'default' : 'secondary'} aria-label={`Status: ${status}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
                <span className="text-xs text-muted-foreground">#{campaignId}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {status === 'running' && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onStatusChange?.('paused')}
                    className="h-8 w-8 p-0"
                  >
                    <PauseCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onStatusChange?.('stopped')}
                    className="h-8 w-8 p-0"
                  >
                    <StopCircle className="h-4 w-4" />
                  </Button>
                </>
              )}
              {status === 'paused' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onStatusChange?.('running')}
                  className="h-8 w-8 p-0"
                >
                  <PlayCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress */}
          {status === 'running' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {estimatedCompletion && (
                <p className="text-xs text-muted-foreground">
                  Estimated completion: {estimatedCompletion}
                </p>
              )}
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Sent</p>
              <motion.p 
                key={currentMetrics.sent}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-lg font-semibold text-red-400"
              >
                {currentMetrics.sent.toLocaleString()}
              </motion.p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Delivered</p>
              <motion.p 
                key={currentMetrics.delivered}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-lg font-semibold text-green-400"
              >
                {currentMetrics.delivered.toLocaleString()}
              </motion.p>
              <p className="text-xs text-green-500">{deliveryRate.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Opened</p>
              <motion.p 
                key={currentMetrics.opened}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-lg font-semibold text-blue-400"
              >
                {currentMetrics.opened.toLocaleString()}
              </motion.p>
              <p className="text-xs text-blue-500">{openRate.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Clicked</p>
              <motion.p 
                key={currentMetrics.clicked}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-lg font-semibold text-yellow-400"
              >
                {currentMetrics.clicked.toLocaleString()}
              </motion.p>
              <p className="text-xs text-yellow-500">{clickRate.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Bounced</p>
              <p className="text-lg font-semibold">{currentMetrics.bounced.toLocaleString()}</p>
              <p className="text-xs text-red-500">
                {currentMetrics.sent > 0 ? ((currentMetrics.bounced / currentMetrics.sent) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>

          {/* Last updated */}
          {isLive && (
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ==================== ANALYTICS OVERVIEW CARD ====================

interface AnalyticsOverviewCardProps {
  title: string;
  timeRange: '24h' | '7d' | '30d' | '90d';
  data: {
    current: number;
    previous: number;
    label: string;
    format?: 'number' | 'currency' | 'percentage';
  }[];
  chartData?: Array<{ date: string; value: number }>;
  onTimeRangeChange?: (range: string) => void;
  className?: string;
}

export const AnalyticsOverviewCard: React.FC<AnalyticsOverviewCardProps> = ({
  title,
  timeRange,
  data,
  chartData,
  onTimeRangeChange,
  className
}) => {
  const [selectedMetric, setSelectedMetric] = useState(0);

  const formatValue = (value: number, format: string = 'number') => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { type: 'neutral' as const, value: '0%' };
    const change = ((current - previous) / previous) * 100;
    return {
      type: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const,
      value: `${Math.abs(change).toFixed(1)}%`
    };
  };

  return (
    <motion.div
      {...clientAnimations.cardEntrance}
      className={className}
    >
      <Card className="border-border dark:border-border/40 hover:border-primary/50 transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <div className="flex items-center gap-1">
              {['24h', '7d', '30d', '90d'].map((range) => (
                <Button
                  key={range}
                  size="sm"
                  variant={timeRange === range ? "primary" : "ghost"}
                  onClick={() => onTimeRangeChange?.(range)}
                  className="h-7 px-2 text-xs"
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(data || []).map((metric, index) => {
              const trend = calculateTrend(metric.current, metric.previous);
              const isSelected = selectedMetric === index;

              return (
                <motion.div
                  key={index}
                  className={cn(
                    "relative p-3 rounded-lg border cursor-pointer transition-all duration-200",
                    isSelected 
                      ? "border-primary/50 bg-primary/5" 
                      : "border-border dark:border-border/40 hover:border-border dark:border-border/60"
                  )}
                  onClick={() => setSelectedMetric(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <p className="text-xl font-bold">
                      {formatValue(metric.current, metric.format)}
                    </p>
                    <div className={cn(
                      "flex items-center gap-1 text-xs",
                      trend.type === "up" && "text-green-500",
                      trend.type === "down" && "text-red-500",
                      trend.type === "neutral" && "text-muted-foreground"
                    )}>
                      {trend.type === "up" && <TrendingUp className="h-3 w-3" />}
                      {trend.type === "down" && <TrendingDown className="h-3 w-3" />}
                      <span>{trend.value}</span>
                      <span className="text-muted-foreground">vs prev</span>
                    </div>
                  </div>
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 border-2 border-primary/50 rounded-lg pointer-events-none"
                      layoutId="selectedMetric"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Mini Chart Placeholder */}
          {chartData && (
            <div className="h-32 bg-muted/20 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Chart for {data[selectedMetric]?.label}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ==================== CLIENT QUICK ACTIONS ====================

interface ClientQuickActionsProps {
  actions: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    badge?: string;
    disabled?: boolean;
    loading?: boolean;
  }>;
  className?: string;
}

export const ClientQuickActions: React.FC<ClientQuickActionsProps> = ({
  actions,
  className
}) => (
  <motion.div
    className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}
    variants={clientAnimations.pageContainer}
    initial="initial"
    animate="animate"
  >
    {actions.map((action, index) => (
      <motion.div
        key={index}
        variants={clientAnimations.cardEntrance}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card 
          className={cn(
            "relative cursor-pointer transition-all duration-300 group",
            "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50",
            action.disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={action.disabled ? undefined : action.onClick}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <motion.div 
                  className="text-primary group-hover:text-primary/80 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  {action.loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    action.icon
                  )}
                </motion.div>
                {action.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {action.badge}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {action.description}
                </p>
              </div>
              <div className="flex items-center justify-end">
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    ))}
  </motion.div>
);

// ==================== CLIENT NOTIFICATION CENTER ====================

interface ClientNotificationCenterProps {
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    actionLabel?: string;
    onAction?: () => void;
  }>;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  className?: string;
}

export const ClientNotificationCenter: React.FC<ClientNotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  className
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <motion.div
      {...clientAnimations.cardEntrance}
      className={className}
    >
      <Card className="border-border dark:border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onMarkAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 max-h-80 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </motion.div>
            ) : (
              notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "relative p-3 rounded-lg border transition-all duration-200 cursor-pointer",
                    notification.read 
                      ? "border-border dark:border-border/40 bg-background/50" 
                      : "border-primary/20 bg-primary/5"
                  )}
                  onClick={() => onMarkAsRead?.(notification.id)}
                >
                  {!notification.read && (
                    <div className="absolute top-2 left-2 h-2 w-2 bg-primary rounded-full" />
                  )}
                  
                  <div className="flex items-start gap-3 ml-4">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-medium">{notification.title}</h4>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {notification.timestamp.toLocaleTimeString()}
                        </span>
                        {notification.actionLabel && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              notification.onAction?.();
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            {notification.actionLabel}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ==================== CLIENT PERFORMANCE MONITOR ====================

interface ClientPerformanceMonitorProps {
  metrics: {
    emailsSentToday: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    activeConnections: number;
    systemLoad: number;
  };
  updateInterval?: number;
  className?: string;
}

export const ClientPerformanceMonitor: React.FC<ClientPerformanceMonitorProps> = ({
  metrics,
  updateInterval = 10000,
  className
}) => {
  const [currentMetrics, setCurrentMetrics] = useState(metrics);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // Simulate metric updates
      setCurrentMetrics(prev => ({
        emailsSentToday: prev.emailsSentToday + Math.floor(Math.random() * 5),
        deliveryRate: Math.max(80, Math.min(100, prev.deliveryRate + (Math.random() - 0.5) * 2)),
        openRate: Math.max(10, Math.min(50, prev.openRate + (Math.random() - 0.5) * 1)),
        clickRate: Math.max(1, Math.min(15, prev.clickRate + (Math.random() - 0.5) * 0.5)),
        activeConnections: Math.max(0, prev.activeConnections + Math.floor((Math.random() - 0.5) * 4)),
        systemLoad: Math.max(0, Math.min(100, prev.systemLoad + (Math.random() - 0.5) * 5)),
      }));
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isLive, updateInterval]);

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-500';
    if (value >= thresholds.warning) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <motion.div
      {...clientAnimations.cardEntrance}
      className={className}
    >
      <Card className="border-border dark:border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Performance Monitor</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsLive(!isLive)}
                className="h-7 px-2 text-xs"
              >
                {isLive ? (
                  <>
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-1" />
                    LIVE
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 bg-muted rounded-full mr-1" />
                    PAUSED
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Emails Sent Today</p>
              <motion.p 
                key={currentMetrics.emailsSentToday}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-xl font-bold text-red-400"
              >
                {currentMetrics.emailsSentToday.toLocaleString()}
              </motion.p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Delivery Rate</p>
              <motion.p 
                key={Math.round(currentMetrics.deliveryRate)}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className={cn("text-xl font-bold", getStatusColor(currentMetrics.deliveryRate, { good: 95, warning: 85 }))}
              >
                {currentMetrics.deliveryRate.toFixed(1)}%
              </motion.p>
              <Progress value={currentMetrics.deliveryRate} className="h-1" />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Open Rate</p>
              <motion.p 
                key={Math.round(currentMetrics.openRate)}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className={cn("text-xl font-bold", getStatusColor(currentMetrics.openRate, { good: 25, warning: 15 }))}
              >
                {currentMetrics.openRate.toFixed(1)}%
              </motion.p>
              <Progress value={currentMetrics.openRate} className="h-1" />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Click Rate</p>
              <motion.p 
                key={Math.round(currentMetrics.clickRate)}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className={cn("text-xl font-bold", getStatusColor(currentMetrics.clickRate, { good: 5, warning: 2 }))}
              >
                {currentMetrics.clickRate.toFixed(1)}%
              </motion.p>
              <Progress value={currentMetrics.clickRate} className="h-1" />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Active Connections</p>
              <motion.p 
                key={currentMetrics.activeConnections}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-xl font-bold"
              >
                {currentMetrics.activeConnections}
              </motion.p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">System Load</p>
              <motion.p 
                key={Math.round(currentMetrics.systemLoad)}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className={cn("text-xl font-bold", getStatusColor(100 - currentMetrics.systemLoad, { good: 70, warning: 30 }))}
              >
                {currentMetrics.systemLoad.toFixed(0)}%
              </motion.p>
              <Progress value={currentMetrics.systemLoad} className="h-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ==================== EXPORT ====================
// All components are already exported individually above
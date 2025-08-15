/**
 * Enhanced Admin Components with Advanced Animations and Statistics
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminAPI, SystemHealth, SystemMetrics, SystemAlert } from '@/api/admin-services';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  Users,
  Server,
  Database,
  Mail,
  Shield,
  Bell,
  Eye,
  Download,
  Settings,
  MoreHorizontal
} from 'lucide-react';

// Enhanced animation variants
export const enhancedAnimations = {
  pageContainer: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1
      }
    },
    exit: { opacity: 0 }
  },
  cardStagger: {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  },
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  slideUp: {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  },
  bounceIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.4, 
        type: "spring",
        bounce: 0.3
      }
    }
  }
};

// Real-time Statistics Card with Live Updates
interface RealTimeStatsCardProps {
  title: string;
  value: number;
  previousValue?: number;
  unit?: string;
  updateInterval?: number;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const RealTimeStatsCard: React.FC<RealTimeStatsCardProps> = ({
  title,
  value,
  previousValue,
  unit = '',
  updateInterval = 5000,
  icon,
  color = 'primary',
  className
}) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  useEffect(() => {
    const interval = setInterval(() => {
      setIsUpdating(true);
      
      // Simulate real-time data with slight variations
      const variation = (Math.random() - 0.5) * 0.1;
      const newValue = Math.max(0, value + (value * variation));
      
      setTimeout(() => {
        const oldValue = currentValue;
        setCurrentValue(newValue);
        
        // Calculate trend
        if (newValue > oldValue) setTrend('up');
        else if (newValue < oldValue) setTrend('down');
        else setTrend('stable');
        
        setIsUpdating(false);
      }, 300);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [value, currentValue, updateInterval]);

  const colorClasses = {
    primary: 'text-primary border-primary/20 bg-primary/5',
    success: 'text-green-500 border-green-500/20 bg-green-500/5',
    warning: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5',
    danger: 'text-red-500 border-red-500/20 bg-red-500/5'
  };

  const changePercent = previousValue ? 
    ((currentValue - previousValue) / previousValue * 100).toFixed(1) : 0;

  return (
    <motion.div 
      variants={enhancedAnimations.cardStagger}
      className={className}
    >
      <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isUpdating && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="h-3 w-3 text-muted-foreground" />
              </motion.div>
            )}
            {icon && (
              <div className={cn("h-4 w-4", colorClasses[color])}>
                {icon}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <motion.div 
              className="text-2xl font-bold"
              key={currentValue}
              initial={{ scale: 1.1, color: color === 'primary' ? '#ef4444' : undefined }}
              animate={{ scale: 1, color: undefined }}
              transition={{ duration: 0.3 }}
            >
              {currentValue.toLocaleString()}{unit}
            </motion.div>
            
            {previousValue && (
              <div className="flex items-center gap-1 text-xs">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-center gap-1",
                    trend === 'up' && "text-green-500",
                    trend === 'down' && "text-red-500",
                    trend === 'stable' && "text-muted-foreground"
                  )}
                >
                  {trend === 'up' && <TrendingUp className="h-3 w-3" />}
                  {trend === 'down' && <TrendingDown className="h-3 w-3" />}
                  <span>{changePercent}%</span>
                </motion.div>
              </div>
            )}
          </div>
        </CardContent>
        
        {/* Animated background pulse for updates */}
        <AnimatePresence>
          {isUpdating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className={cn(
                "absolute inset-0 pointer-events-none",
                colorClasses[color]
              )}
            />
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// Advanced System Health Monitor
interface SystemHealthMonitorProps {
  className?: string;
}

export const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({ className }) => {
  const [healthData, setHealthData] = useState({
    cpu: { usage: 68, status: 'normal' as 'normal' | 'warning' | 'critical' },
    memory: { usage: 72, status: 'normal' as 'normal' | 'warning' | 'critical' },
    disk: { usage: 45, status: 'normal' as 'normal' | 'warning' | 'critical' },
    network: { status: 'online' as 'online' | 'offline' | 'limited' }
  });

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const fetchSystemHealth = async () => {
    setIsLoading(true);
    try {
      const systemHealth = await AdminAPI.dashboard.getSystemHealth();
      
      // Add null checks and default values to prevent undefined errors
      const cpuUsage = systemHealth?.cpu_usage ?? 0;
      const memoryUsage = systemHealth?.memory_usage ?? 0;
      const diskUsage = systemHealth?.disk_usage ?? 0;
      const networkStatus = systemHealth?.network_status ?? 'limited';
      
      setHealthData({
        cpu: {
          usage: cpuUsage,
          status: cpuUsage > 80 ? 'critical' : cpuUsage > 60 ? 'warning' : 'normal'
        },
        memory: {
          usage: memoryUsage,
          status: memoryUsage > 85 ? 'critical' : memoryUsage > 70 ? 'warning' : 'normal'
        },
        disk: {
          usage: diskUsage,
          status: diskUsage > 90 ? 'critical' : diskUsage > 75 ? 'warning' : 'normal'
        },
        network: { status: networkStatus }
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      // Keep existing data on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchSystemHealth();

    // Set up periodic updates
    const interval = setInterval(fetchSystemHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'limited': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  const getProgressColor = (usage: number) => {
    if (usage > 80) return 'bg-red-500';
    if (usage > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <motion.div 
      variants={enhancedAnimations.slideUp}
      className={className}
    >
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <motion.div variants={enhancedAnimations.pulse}>
                <Activity className="h-5 w-5 text-primary" />
              </motion.div>
              System Health Monitor
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              Updated {lastUpdate.toLocaleTimeString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CPU Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Server className="h-4 w-4" />
                CPU Usage
              </span>
              <span className={cn("text-sm font-bold", getStatusColor(healthData.cpu?.status || 'normal'))}>
                {(healthData.cpu?.usage ?? 0).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div
                className={cn("h-2 rounded-full transition-all duration-500", getProgressColor(healthData.cpu?.usage ?? 0))}
                initial={{ width: 0 }}
                animate={{ width: `${healthData.cpu?.usage ?? 0}%` }}
              />
            </div>
          </div>

          {/* Memory Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Memory Usage
              </span>
              <span className={cn("text-sm font-bold", getStatusColor(healthData.memory?.status || 'normal'))}>
                {(healthData.memory?.usage ?? 0).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div
                className={cn("h-2 rounded-full transition-all duration-500", getProgressColor(healthData.memory?.usage ?? 0))}
                initial={{ width: 0 }}
                animate={{ width: `${healthData.memory?.usage ?? 0}%` }}
              />
            </div>
          </div>

          {/* Disk Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Disk Usage
              </span>
              <span className={cn("text-sm font-bold", getStatusColor(healthData.disk?.status || 'normal'))}>
                {(healthData.disk?.usage ?? 0).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div
                className={cn("h-2 rounded-full transition-all duration-500", getProgressColor(healthData.disk?.usage ?? 0))}
                initial={{ width: 0 }}
                animate={{ width: `${healthData.disk?.usage ?? 0}%` }}
              />
            </div>
          </div>

          {/* Network Status */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Network Status
            </span>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ 
                  scale: (healthData.network?.status || 'limited') === 'online' ? [1, 1.2, 1] : 1,
                  opacity: (healthData.network?.status || 'limited') === 'offline' ? [1, 0.5, 1] : 1
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn("w-2 h-2 rounded-full", {
                  'bg-green-500': (healthData.network?.status || 'limited') === 'online',
                  'bg-yellow-500': (healthData.network?.status || 'limited') === 'limited',
                  'bg-red-500': (healthData.network?.status || 'limited') === 'offline'
                })}
              />
              <span className={cn("text-sm font-medium capitalize", getStatusColor(healthData.network?.status || 'limited'))}>
                {healthData.network?.status || 'limited'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Action Button with Loading States
interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  loading?: boolean;
  variant?: 'default' | 'destructive' | 'outline';
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  description,
  onClick,
  loading = false,
  variant = 'default',
  className
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Button
        variant={variant}
        size="lg"
        onClick={onClick}
        disabled={loading}
        className="w-full h-auto p-4 flex flex-col gap-2 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3 w-full">
          <motion.div
            animate={loading ? { rotate: 360 } : {}}
            transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          >
            {loading ? <RefreshCw className="h-5 w-5" /> : icon}
          </motion.div>
          <div className="flex-1 text-left">
            <div className="font-medium">{label}</div>
            {description && (
              <div className="text-xs text-muted-foreground">{description}</div>
            )}
          </div>
        </div>
      </Button>
    </motion.div>
  );
};

// Quick Actions Panel
export const QuickActionsPanel: React.FC<{ className?: string }> = ({ className }) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const handleAction = async (actionId: string, action: () => Promise<void> | void) => {
    setLoadingStates(prev => ({ ...prev, [actionId]: true }));
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      await action();
    } finally {
      setLoadingStates(prev => ({ ...prev, [actionId]: false }));
    }
  };

  const quickActions = [
    {
      id: 'backup',
      icon: <Download className="h-5 w-5" />,
      label: 'Create Backup',
      description: 'Full system backup',
      action: () => console.log('Backup created')
    },
    {
      id: 'maintenance',
      icon: <Settings className="h-5 w-5" />,
      label: 'Maintenance Mode',
      description: 'Toggle maintenance',
      action: () => console.log('Maintenance toggled')
    },
    {
      id: 'alerts',
      icon: <Bell className="h-5 w-5" />,
      label: 'View Alerts',
      description: '3 new notifications',
      action: () => console.log('Alerts opened')
    },
    {
      id: 'logs',
      icon: <Eye className="h-5 w-5" />,
      label: 'System Logs',
      description: 'View recent activity',
      action: () => console.log('Logs opened')
    }
  ];

  return (
    <motion.div 
      variants={enhancedAnimations.slideUp}
      className={className}
    >
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <ActionButton
                key={action.id}
                icon={action.icon}
                label={action.label}
                description={action.description}
                loading={loadingStates[action.id]}
                onClick={() => handleAction(action.id, action.action)}
                variant="outline"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Alert Center
export const AlertCenter: React.FC<{ className?: string }> = ({ className }) => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const systemAlerts = await AdminAPI.dashboard.getSystemAlerts();
      setAlerts(systemAlerts);
    } catch (error) {
      console.error('Failed to fetch system alerts:', error);
      // Set fallback data
      setAlerts([
        {
          id: '1',
          type: 'warning',
          title: 'High Memory Usage',
          message: 'System memory usage is above 75%',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          is_read: false,
          actions: ['View Details', 'Dismiss']
        },
        {
          id: '2',
          type: 'info',
          title: 'Backup Completed',
          message: 'Daily backup completed successfully',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          is_read: false,
          actions: ['View Report']
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <CheckCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: string): "default" | "destructive" => {
    return type === 'error' ? 'destructive' : 'default';
  };

  return (
    <motion.div 
      variants={enhancedAnimations.slideUp}
      className={className}
    >
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Alert Center
            </div>
            <Badge variant="secondary">{alerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </motion.div>
              <span className="ml-2 text-sm text-muted-foreground">Loading alerts...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active alerts</p>
            </div>
          ) : (
            alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Alert variant={getAlertVariant(alert.type)} className="p-3">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-sm">{alert.title}</div>
                      <div className="text-xs text-muted-foreground">{alert.message}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </Alert>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
/**
 * Real-Time Admin Dashboard with Live Monitoring
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import {
  Activity,
  Users,
  Mail,
  Server,
  Database,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

// Real-time data simulation
const generateMetricData = (baseValue: number, variance: number = 0.1) => {
  const time = new Date();
  const variation = (Math.random() - 0.5) * variance * baseValue;
  return {
    timestamp: time.toISOString(),
    value: Math.max(0, Math.round(baseValue + variation)),
    time: time.toLocaleTimeString('en-US', { 
      hour12: false,
      minute: '2-digit',
      second: '2-digit'
    })
  };
};

interface MetricCardProps {
  title: string;
  value: number;
  unit?: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'stable';
  icon: React.ReactNode;
  data: any[];
  color?: string;
  target?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '',
  change,
  changeType = 'stable',
  icon,
  data,
  color = '#8884d8',
  target
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'increase': return 'text-green-500';
      case 'decrease': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase': return <TrendingUp className="h-3 w-3" />;
      case 'decrease': return <TrendingDown className="h-3 w-3" />;
      default: return null;
    }
  };

  const progressValue = target ? Math.min((value / target) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <div className="text-muted-foreground">
              {icon}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Main Value */}
            <div className="flex items-baseline justify-between">
              <motion.div 
                className="text-2xl font-bold"
                key={value}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {value.toLocaleString()}{unit}
              </motion.div>
              
              {change !== undefined && (
                <div className={cn("flex items-center gap-1 text-sm", getChangeColor())}>
                  {getChangeIcon()}
                  <span>{(Math.abs(change) ?? 0).toFixed(1)}%</span>
                </div>
              )}
            </div>

            {/* Progress bar for targets */}
            {target && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress to target</span>
                  <span>{(progressValue ?? 0).toFixed(1)}%</span>
                </div>
                <Progress value={progressValue ?? 0} className="h-2" />
              </div>
            )}

            {/* Mini Chart */}
            <div className="h-16 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.slice(-20)}>
                  <defs>
                    <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#gradient-${title})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Last update */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last update</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {data[data.length - 1]?.time || 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface SystemAlertProps {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  autoExpire?: boolean;
}

const SystemAlert: React.FC<SystemAlertProps> = ({
  type,
  title,
  message,
  timestamp,
  autoExpire = true
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoExpire) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000); // Auto-hide after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [autoExpire]);

  const getAlertStyles = () => {
    switch (type) {
      case 'error': return 'border-red-500 bg-red-50 text-red-900';
      case 'warning': return 'border-yellow-500 bg-yellow-50 text-yellow-900';
      case 'success': return 'border-green-500 bg-green-50 text-green-900';
      default: return 'border-blue-500 bg-blue-50 text-blue-900';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "p-3 rounded-lg border-l-4 space-y-1",
        getAlertStyles()
      )}
    >
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="font-medium text-sm">{title}</span>
        <span className="ml-auto text-xs opacity-70">
          {timestamp.toLocaleTimeString()}
        </span>
      </div>
      <p className="text-sm opacity-80">{message}</p>
    </motion.div>
  );
};

export const RealTimeDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    users: [] as any[],
    emails: [] as any[],
    servers: [] as any[],
    database: [] as any[],
    revenue: [] as any[]
  });

  const [alerts, setAlerts] = useState<SystemAlertProps[]>([]);
  const [isLive, setIsLive] = useState(true);

  // Initialize with some historical data
  useEffect(() => {
    const initData = Array.from({ length: 20 }, (_, i) => ({
      users: generateMetricData(1247 - (19 - i) * 5),
      emails: generateMetricData(15420 - (19 - i) * 100),
      servers: generateMetricData(68 - (19 - i) * 2),
      database: generateMetricData(89 - (19 - i) * 1),
      revenue: generateMetricData(28540 - (19 - i) * 200)
    }));

    setMetrics({
      users: initData.map(d => d.users),
      emails: initData.map(d => d.emails),
      servers: initData.map(d => d.servers),
      database: initData.map(d => d.database),
      revenue: initData.map(d => d.revenue)
    });
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMetrics(prev => ({
        users: [...prev.users.slice(-19), generateMetricData(1247)],
        emails: [...prev.emails.slice(-19), generateMetricData(15420, 0.05)],
        servers: [...prev.servers.slice(-19), generateMetricData(68, 0.15)],
        database: [...prev.database.slice(-19), generateMetricData(89, 0.08)],
        revenue: [...prev.revenue.slice(-19), generateMetricData(28540, 0.02)]
      }));

      // Occasionally add system alerts
      if (Math.random() < 0.1) {
        const alertTypes = [
          {
            type: 'info' as const,
            title: 'System Update',
            message: 'Background maintenance completed successfully'
          },
          {
            type: 'success' as const,
            title: 'Backup Complete',
            message: 'Daily backup finished without errors'
          },
          {
            type: 'warning' as const,
            title: 'High CPU Usage',
            message: 'Server CPU usage above 80% for 5 minutes'
          }
        ];

        const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        setAlerts(prev => [
          ...prev.slice(-4), // Keep only last 5 alerts
          {
            ...randomAlert,
            timestamp: new Date()
          }
        ]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  const toggleLiveUpdates = () => {
    setIsLive(!isLive);
  };

  const currentMetrics = {
    users: metrics.users[metrics.users.length - 1]?.value || 0,
    emails: metrics.emails[metrics.emails.length - 1]?.value || 0,
    servers: metrics.servers[metrics.servers.length - 1]?.value || 0,
    database: metrics.database[metrics.database.length - 1]?.value || 0,
    revenue: metrics.revenue[metrics.revenue.length - 1]?.value || 0
  };

  // Calculate changes
  const getChange = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const changes = {
    users: getChange(currentMetrics.users, metrics.users[metrics.users.length - 2]?.value),
    emails: getChange(currentMetrics.emails, metrics.emails[metrics.emails.length - 2]?.value),
    servers: getChange(currentMetrics.servers, metrics.servers[metrics.servers.length - 2]?.value),
    database: getChange(currentMetrics.database, metrics.database[metrics.database.length - 2]?.value),
    revenue: getChange(currentMetrics.revenue, metrics.revenue[metrics.revenue.length - 2]?.value)
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Real-Time Dashboard</h2>
          <p className="text-muted-foreground">Live system monitoring and analytics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={isLive ? "default" : "secondary"} className="text-xs">
            <motion.div
              animate={isLive ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              className={cn("w-2 h-2 rounded-full mr-2", isLive ? "bg-green-500" : "bg-gray-400")}
            />
            {isLive ? 'LIVE' : 'PAUSED'}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLiveUpdates}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={isLive ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="h-4 w-4" />
            </motion.div>
            {isLive ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Active Users"
          value={currentMetrics.users}
          change={changes.users}
          changeType={changes.users > 0 ? 'increase' : changes.users < 0 ? 'decrease' : 'stable'}
          icon={<Users className="h-4 w-4" />}
          data={metrics.users}
          color="#3b82f6"
          target={1500}
        />
        
        <MetricCard
          title="Emails Sent"
          value={currentMetrics.emails}
          change={changes.emails}
          changeType={changes.emails > 0 ? 'increase' : changes.emails < 0 ? 'decrease' : 'stable'}
          icon={<Mail className="h-4 w-4" />}
          data={metrics.emails}
          color="#10b981"
          target={20000}
        />
        
        <MetricCard
          title="Server Load"
          value={currentMetrics.servers}
          unit="%"
          change={changes.servers}
          changeType={changes.servers > 0 ? 'decrease' : changes.servers < 0 ? 'increase' : 'stable'}
          icon={<Server className="h-4 w-4" />}
          data={metrics.servers}
          color="#f59e0b"
          target={100}
        />
        
        <MetricCard
          title="DB Performance"
          value={currentMetrics.database}
          unit="%"
          change={changes.database}
          changeType={changes.database > 0 ? 'increase' : changes.database < 0 ? 'decrease' : 'stable'}
          icon={<Database className="h-4 w-4" />}
          data={metrics.database}
          color="#8b5cf6"
          target={100}
        />
        
        <MetricCard
          title="Revenue"
          value={currentMetrics.revenue}
          unit="$"
          change={changes.revenue}
          changeType={changes.revenue > 0 ? 'increase' : changes.revenue < 0 ? 'decrease' : 'stable'}
          icon={<Zap className="h-4 w-4" />}
          data={metrics.revenue}
          color="#ef4444"
          target={50000}
        />
      </div>

      {/* System Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">System Alerts</h3>
          <div className="space-y-2">
            <AnimatePresence>
              {alerts.map((alert, index) => (
                <SystemAlert
                  key={index}
                  type={alert.type}
                  title={alert.title}
                  message={alert.message}
                  timestamp={alert.timestamp}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
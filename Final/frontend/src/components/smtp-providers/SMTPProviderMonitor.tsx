import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Clock,
  Mail,
  XCircle,
  RefreshCw,
  Bell,
  BellOff
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { smtpProviderApi, ProviderConfig, ProviderUsageStats } from '@/api/smtp-providers';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { formatNumber, formatDuration } from '@/utils/format';

interface ProviderMetrics {
  configId: string;
  timestamp: number;
  quotaUsagePercent: number;
  sendRate: number;
  errorRate: number;
  avgResponseTime: number;
}

interface ProviderAlert {
  id: string;
  configId: string;
  type: 'quota_warning' | 'quota_critical' | 'rate_limit' | 'error_spike' | 'health_degraded';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

export const SMTPProviderMonitor: React.FC = () => {
  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Record<string, ProviderMetrics[]>>({});
  const [alerts, setAlerts] = useState<ProviderAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const metricsBufferRef = useRef<Record<string, ProviderMetrics[]>>({});
  const { toast } = useToast();

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useWebSocket('/ws/provider-metrics', {
    onMessage: (data) => {
      if (data.type === 'provider_metrics') {
        handleMetricsUpdate(data.payload);
      } else if (data.type === 'provider_alert') {
        handleNewAlert(data.payload);
      }
    },
  });

  useEffect(() => {
    loadConfigs();
    const interval = autoRefresh ? setInterval(refreshMetrics, 30000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await smtpProviderApi.getConfigs();
      setConfigs(data);
      if (data.length > 0 && !selectedConfig) {
        setSelectedConfig(data[0].id);
      }
      // Initialize metrics for each config
      data.forEach(config => {
        if (!metrics[config.id]) {
          metricsBufferRef.current[config.id] = [];
        }
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load provider configurations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshMetrics = async () => {
    for (const config of configs) {
      try {
        const stats = await smtpProviderApi.getUsageStats(config.id);
        const quotaCheck = await smtpProviderApi.checkQuota(config.id);
        
        const metric: ProviderMetrics = {
          configId: config.id,
          timestamp: Date.now(),
          quotaUsagePercent: (config.limits.daily.used / config.limits.daily.limit) * 100,
          sendRate: stats.total_sent / (stats.period_hours * 3600), // per second
          errorRate: stats.total_errors / Math.max(stats.total_sent, 1),
          avgResponseTime: stats.average_send_time_ms || 0,
        };
        
        handleMetricsUpdate(metric);
        
        // Check for alerts
        checkForAlerts(config, metric, quotaCheck);
      } catch (error) {
        console.error(`Failed to refresh metrics for ${config.id}:`, error);
      }
    }
  };

  const handleMetricsUpdate = (metric: ProviderMetrics) => {
    const buffer = metricsBufferRef.current[metric.configId] || [];
    buffer.push(metric);
    
    // Keep last 100 data points
    if (buffer.length > 100) {
      buffer.shift();
    }
    
    metricsBufferRef.current[metric.configId] = buffer;
    
    // Update state every 5 updates to avoid too many re-renders
    if (buffer.length % 5 === 0) {
      setMetrics({ ...metricsBufferRef.current });
    }
  };

  const handleNewAlert = (alert: ProviderAlert) => {
    setAlerts(prev => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts
    
    // Show toast for critical alerts
    if (alert.severity === 'critical') {
      toast({
        title: 'Critical Alert',
        description: alert.message,
        variant: 'destructive',
      });
    }
  };

  const checkForAlerts = (
    config: ProviderConfig, 
    metric: ProviderMetrics, 
    quotaCheck: any
  ) => {
    const alertId = () => `${config.id}-${Date.now()}-${Math.random()}`;
    
    // Quota warnings
    if (metric.quotaUsagePercent > 90) {
      handleNewAlert({
        id: alertId(),
        configId: config.id,
        type: 'quota_critical',
        severity: 'critical',
        message: `${config.name} has used ${metric.quotaUsagePercent.toFixed(1)}% of daily quota`,
        timestamp: Date.now(),
        acknowledged: false,
      });
    } else if (metric.quotaUsagePercent > 75) {
      handleNewAlert({
        id: alertId(),
        configId: config.id,
        type: 'quota_warning',
        severity: 'warning',
        message: `${config.name} approaching daily quota limit (${metric.quotaUsagePercent.toFixed(1)}%)`,
        timestamp: Date.now(),
        acknowledged: false,
      });
    }
    
    // Error rate alerts
    if (metric.errorRate > 0.1) { // More than 10% errors
      handleNewAlert({
        id: alertId(),
        configId: config.id,
        type: 'error_spike',
        severity: 'critical',
        message: `High error rate detected for ${config.name}: ${(metric.errorRate * 100).toFixed(1)}%`,
        timestamp: Date.now(),
        acknowledged: false,
      });
    }
    
    // Health degradation
    if (config.health_status !== 'healthy') {
      handleNewAlert({
        id: alertId(),
        configId: config.id,
        type: 'health_degraded',
        severity: 'warning',
        message: `${config.name} health status: ${config.health_status}`,
        timestamp: Date.now(),
        acknowledged: false,
      });
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'quota_warning':
      case 'quota_critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'rate_limit':
        return <Clock className="h-4 w-4" />;
      case 'error_spike':
        return <XCircle className="h-4 w-4" />;
      case 'health_degraded':
        return <Activity className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const selectedMetrics = selectedConfig ? metrics[selectedConfig] || [] : [];
  const selectedConfigData = configs.find(c => c.id === selectedConfig);
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Provider Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of SMTP provider quotas and performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Auto-refresh ON
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Auto-refresh OFF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {unacknowledgedAlerts.length > 0 && (
        <div className="space-y-2">
          {unacknowledgedAlerts.slice(0, 3).map(alert => (
            <Alert 
              key={alert.id} 
              variant={alert.severity === 'critical' ? 'destructive' : 'default'}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getAlertIcon(alert.type)}
                  <div>
                    <AlertTitle className="text-sm">
                      {alert.severity === 'critical' ? 'Critical' : 'Warning'}
                    </AlertTitle>
                    <AlertDescription className="text-sm">
                      {alert.message}
                    </AlertDescription>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => acknowledgeAlert(alert.id)}
                >
                  Dismiss
                </Button>
              </div>
            </Alert>
          ))}
          {unacknowledgedAlerts.length > 3 && (
            <p className="text-sm text-muted-foreground text-center">
              +{unacknowledgedAlerts.length - 3} more alerts
            </p>
          )}
        </div>
      )}

      {/* Provider Selector */}
      <div className="flex gap-2 flex-wrap">
        {configs.map(config => (
          <Button
            key={config.id}
            variant={selectedConfig === config.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedConfig(config.id)}
            className="relative"
          >
            {config.name}
            {unacknowledgedAlerts.some(a => a.configId === config.id) && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </Button>
        ))}
      </div>

      {/* Metrics Dashboard */}
      {selectedConfigData && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Quota Usage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Daily Quota Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">
                    {((selectedConfigData.limits.daily.used / selectedConfigData.limits.daily.limit) * 100).toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatNumber(selectedConfigData.limits.daily.remaining)} left
                  </span>
                </div>
                <Progress 
                  value={(selectedConfigData.limits.daily.used / selectedConfigData.limits.daily.limit) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Send Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Send Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">
                  {selectedMetrics.length > 0 
                    ? selectedMetrics[selectedMetrics.length - 1].sendRate.toFixed(2)
                    : '0.00'
                  }
                </span>
                <span className="text-sm text-muted-foreground">emails/sec</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Zap className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Limit: {selectedConfigData.limits.per_second}/s
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Error Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">
                  {selectedMetrics.length > 0 
                    ? (selectedMetrics[selectedMetrics.length - 1].errorRate * 100).toFixed(1)
                    : '0.0'
                  }%
                </span>
                {selectedMetrics.length > 1 && (
                  <span className="text-sm">
                    {selectedMetrics[selectedMetrics.length - 1].errorRate > 
                     selectedMetrics[selectedMetrics.length - 2].errorRate ? (
                      <TrendingUp className="h-4 w-4 text-red-500 inline" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500 inline" />
                    )}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">
                  {selectedMetrics.length > 0 
                    ? selectedMetrics[selectedMetrics.length - 1].avgResponseTime.toFixed(0)
                    : '0'
                  }
                </span>
                <span className="text-sm text-muted-foreground">ms</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {selectedMetrics.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quota Usage Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quota Usage Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={selectedMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(t) => new Date(t).toLocaleString()}
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="quotaUsagePercent" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={selectedMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    labelFormatter={(t) => new Date(t).toLocaleString()}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="sendRate" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    dot={false}
                    name="Send Rate (emails/s)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="avgResponseTime" 
                    stroke="#ffc658" 
                    strokeWidth={2}
                    dot={false}
                    name="Response Time (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
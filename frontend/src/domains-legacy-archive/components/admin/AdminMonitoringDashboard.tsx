import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  DollarSign,
  HardDrive,
  Mail,
  RefreshCw,
  Server,
  Shield,
  Users,
  Zap,
  TrendingUp,
  TrendingDown,
  Cpu,
  MemoryStick
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminDashboard, useSystemHealth } from '@/hooks/useMetricsData';
import { formatNumber } from '@/utils/numberFormat';
import RealtimeMetricsWidget from '@/components/metrics/RealtimeMetricsWidget';

interface ServiceStatusCardProps {
  name: string;
  status: string;
  metric: number;
  metricLabel: string;
  icon: React.ReactNode;
  loading?: boolean;
}

function ServiceStatusCard({ name, status, metric, metricLabel, icon, loading }: ServiceStatusCardProps) {
  const isHealthy = status === 'healthy';

  if (loading) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="flex-1">
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/70 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isHealthy ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              {icon}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-white">{name}</h4>
              <p className="text-sm text-zinc-400">{metricLabel}: {formatNumber(metric)}</p>
            </div>
            <Badge
              variant="outline"
              className={isHealthy ? 'border-green-500/20 text-green-500 bg-green-500/10' : 'border-red-500/20 text-red-500 bg-red-500/10'}
            >
              {isHealthy ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertTriangle className="h-3 w-3 mr-1" />
              )}
              {status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  loading?: boolean;
}

function StatCard({ title, value, trend, icon, color = 'blue', loading }: StatCardProps) {
  const colors = {
    blue: 'text-blue-500 bg-blue-500/10',
    green: 'text-green-500 bg-green-500/10',
    yellow: 'text-yellow-500 bg-yellow-500/10',
    red: 'text-red-500 bg-red-500/10'
  };

  if (loading) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/70 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400 mb-2">{title}</p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-2xl font-bold text-white">
                  {typeof value === 'number' ? formatNumber(value) : value}
                </h3>
                {trend !== undefined && (
                  <div className="flex items-center space-x-1">
                    {trend > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(trend)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${colors[color]}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function AdminMonitoringDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const { overview, loading, error, refetch } = useAdminDashboard();
  const { health, isHealthy } = useSystemHealth();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load admin dashboard: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Monitoring</h1>
          <p className="text-zinc-400">Comprehensive system and business overview</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={isHealthy ? "default" : "destructive"} className="text-sm">
            {isHealthy ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <AlertTriangle className="h-3 w-3 mr-1" />
            )}
            {isHealthy ? 'System Healthy' : 'System Issues'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-zinc-900/50 border border-zinc-800">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="business">Business Metrics</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="api-health">API Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Overview Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="System Uptime"
              value={overview?.system_overview.uptime || 'N/A'}
              icon={<Clock className="h-5 w-5" />}
              color="green"
              loading={loading}
            />
            <StatCard
              title="CPU Usage"
              value={`${overview?.system_overview.cpu_usage || 0}%`}
              icon={<Cpu className="h-5 w-5" />}
              color={overview?.system_overview.cpu_usage > 80 ? 'red' : 'blue'}
              loading={loading}
            />
            <StatCard
              title="Memory Usage"
              value={`${overview?.system_overview.memory_usage || 0}%`}
              icon={<MemoryStick className="h-5 w-5" />}
              color={overview?.system_overview.memory_usage > 80 ? 'red' : 'blue'}
              loading={loading}
            />
            <StatCard
              title="Disk Usage"
              value={`${overview?.system_overview.disk_usage || 0}%`}
              icon={<HardDrive className="h-5 w-5" />}
              color={overview?.system_overview.disk_usage > 80 ? 'red' : 'blue'}
              loading={loading}
            />
          </div>

          {/* User Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard
              title="Active Users"
              value={overview?.system_overview.active_users || 0}
              icon={<Users className="h-5 w-5" />}
              color="blue"
              loading={loading}
            />
            <StatCard
              title="Total Users"
              value={overview?.system_overview.total_users || 0}
              icon={<Users className="h-5 w-5" />}
              color="green"
              loading={loading}
            />
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {overview?.service_status && Object.entries(overview.service_status).map(([service, status]) => {
              const getIcon = (serviceName: string) => {
                switch (serviceName) {
                  case 'api_server': return <Server className="h-4 w-4" />;
                  case 'database': return <Database className="h-4 w-4" />;
                  case 'redis': return <Zap className="h-4 w-4" />;
                  case 'celery_workers': return <Activity className="h-4 w-4" />;
                  case 'nginx': return <Server className="h-4 w-4" />;
                  default: return <Server className="h-4 w-4" />;
                }
              };

              const getMetricValue = (serviceName: string) => {
                switch (serviceName) {
                  case 'api_server': return status.response_time || 0;
                  case 'database': return status.connections || 0;
                  case 'redis': return status.memory_usage || 0;
                  case 'celery_workers': return status.active_tasks || 0;
                  case 'nginx': return status.requests_per_min || 0;
                  default: return 0;
                }
              };

              const getMetricLabel = (serviceName: string) => {
                switch (serviceName) {
                  case 'api_server': return 'Response Time (ms)';
                  case 'database': return 'Connections';
                  case 'redis': return 'Memory (MB)';
                  case 'celery_workers': return 'Active Tasks';
                  case 'nginx': return 'Requests/min';
                  default: return 'Metric';
                }
              };

              return (
                <ServiceStatusCard
                  key={service}
                  name={service.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  status={status.status}
                  metric={getMetricValue(service)}
                  metricLabel={getMetricLabel(service)}
                  icon={getIcon(service)}
                  loading={loading}
                />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Failed Logins (24h)"
              value={overview?.security.failed_logins_24h || 0}
              icon={<Shield className="h-5 w-5" />}
              color={overview?.security.failed_logins_24h > 50 ? 'red' : 'green'}
              loading={loading}
            />
            <StatCard
              title="Blocked IPs"
              value={overview?.security.blocked_ips || 0}
              icon={<Shield className="h-5 w-5" />}
              color="yellow"
              loading={loading}
            />
            <StatCard
              title="Active Sessions"
              value={overview?.security.active_sessions || 0}
              icon={<Users className="h-5 w-5" />}
              color="blue"
              loading={loading}
            />
            <StatCard
              title="Security Events"
              value={overview?.security.security_events?.length || 0}
              icon={<AlertTriangle className="h-5 w-5" />}
              color={overview?.security.security_events?.length > 0 ? 'red' : 'green'}
              loading={loading}
            />
          </div>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Campaigns Today"
              value={overview?.business_metrics.campaigns_today || 0}
              icon={<Mail className="h-5 w-5" />}
              color="blue"
              loading={loading}
            />
            <StatCard
              title="Emails Sent Today"
              value={overview?.business_metrics.emails_sent_today || 0}
              icon={<Mail className="h-5 w-5" />}
              color="green"
              loading={loading}
            />
            <StatCard
              title="Revenue Today"
              value={`$${formatNumber(overview?.business_metrics.revenue_today || 0, 2)}`}
              icon={<DollarSign className="h-5 w-5" />}
              color="green"
              loading={loading}
            />
            <StatCard
              title="Active Subscriptions"
              value={overview?.business_metrics.active_subscriptions || 0}
              icon={<Users className="h-5 w-5" />}
              color="blue"
              loading={loading}
            />
          </div>

          {/* Performance Metrics */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Performance Metrics</CardTitle>
              <CardDescription>Application performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <p className="text-sm text-zinc-400">Avg Response Time</p>
                  <p className="text-2xl font-bold text-white">{overview?.performance.avg_response_time || 0}ms</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-zinc-400">Requests/Hour</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(overview?.performance.requests_per_hour || 0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-zinc-400">Error Rate</p>
                  <p className="text-2xl font-bold text-white">{overview?.performance.error_rate || 0}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-zinc-400">Cache Hit Rate</p>
                  <p className="text-2xl font-bold text-white">{overview?.performance.cache_hit_rate || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <RealtimeMetricsWidget />
        </TabsContent>

        <TabsContent value="api-health" className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">API Health Checks</CardTitle>
              <CardDescription>Live status of critical backend endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(
                  [
                    { name: 'Auth: /api/v1/auth/login', key: 'auth_login' },
                    { name: 'Users: /api/v1/admin/users', key: 'admin_users' },
                    { name: 'Monitoring: /api/v1/admin/monitoring/metrics', key: 'monitor_metrics' },
                    { name: 'Campaigns: /api/v1/client/campaigns', key: 'client_campaigns' },
                    { name: 'Deliverability: /api/v1/tools/deliverability', key: 'deliverability' },
                    { name: 'Status: /health', key: 'health' },
                  ] as const
                ).map((api) => {
                  const status = overview?.api_health?.[api.key as keyof typeof overview.api_health]
                  const isUp = status?.status === 'up' || status === 'up'
                  return (
                    <div key={api.key} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
                      <div>
                        <div className="text-sm text-white">{api.name}</div>
                        <div className="text-xs text-zinc-400">key: {api.key}</div>
                      </div>
                      <Badge variant={isUp ? 'default' : 'destructive'}>
                        {isUp ? 'UP' : 'DOWN'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminMonitoringDashboard; 
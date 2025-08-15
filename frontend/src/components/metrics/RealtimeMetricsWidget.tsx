import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Cpu, 
  Database, 
  MemoryStick, 
  Users, 
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useRealtimeMetrics } from '@/hooks/useMetricsData';
import { formatNumber } from '@/utils/numberFormat';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  status?: 'healthy' | 'warning' | 'error';
  unit?: string;
  loading?: boolean;
}

function MetricCard({ title, value, icon, trend, status = 'healthy', unit, loading }: MetricCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadgeColor = () => {
    switch (status) {
      case 'healthy': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'warning': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'error': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted/10 text-muted-foreground border-border/20';
    }
  };

  if (loading) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-16" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-20" />
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
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={getStatusColor()}>{icon}</div>
              <CardDescription className="text-zinc-400 text-sm">{title}</CardDescription>
            </div>
            <Badge variant="outline" className={getStatusBadgeColor()}>
              {status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold text-white">
              {typeof value === 'number' ? formatNumber(value) : value}
            </div>
            {unit && <span className="text-sm text-zinc-400">{unit}</span>}
          </div>
          {trend !== undefined && (
            <div className="flex items-center mt-1 space-x-1">
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
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface RealtimeMetricsWidgetProps {
  className?: string;
  compact?: boolean;
}

export function RealtimeMetricsWidget({ className, compact = false }: RealtimeMetricsWidgetProps) {
  const { metrics, loading, error, refetch } = useRealtimeMetrics({
    refreshInterval: 5000,
    autoRefresh: true
  });

  const getResourceStatus = (usage: number) => {
    if (usage > 90) return 'error';
    if (usage > 70) return 'warning';
    return 'healthy';
  };

  const lastUpdated = (metrics as any)?.timestamp ? new Date((metrics as any).timestamp) : null;

  if (error) {
    return (
      <Card className={`bg-zinc-900/50 border-zinc-800 ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-red-500 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Metrics Error</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-400">Failed to load metrics. Click refresh to retry.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Real-time Metrics</h3>
          <p className="text-sm text-zinc-400">Live system performance data</p>
        </div>
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <div className="flex items-center space-x-1 text-xs text-zinc-500">
              <Clock className="h-3 w-3" />
              <span>{lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className={`grid gap-4 ${compact ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        <MetricCard
          title="CPU Usage"
          value={(metrics as any)?.live_metrics?.cpu_usage || 0}
          icon={<Cpu className="h-4 w-4" />}
          status={getResourceStatus((metrics as any)?.live_metrics?.cpu_usage || 0)}
          unit="%"
          loading={loading}
        />
        
        <MetricCard
          title="Memory Usage"
          value={(metrics as any)?.live_metrics?.memory_usage || 0}
          icon={<MemoryStick className="h-4 w-4" />}
          status={getResourceStatus((metrics as any)?.live_metrics?.memory_usage || 0)}
          unit="%"
          loading={loading}
        />
        
        <MetricCard
          title="Active Connections"
          value={(metrics as any)?.live_metrics?.active_connections || 0}
          icon={<Users className="h-4 w-4" />}
          status="healthy"
          loading={loading}
        />
        
        <MetricCard
          title="Response Time"
          value={(metrics as any)?.live_metrics?.response_time || 0}
          icon={<Activity className="h-4 w-4" />}
          status={(metrics as any)?.live_metrics?.response_time > 1000 ? 'warning' : 'healthy'}
          unit="ms"
          loading={loading}
        />
      </div>

      {!compact && metrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-zinc-400">System Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-300">CPU</span>
                  <span className="text-white">{(metrics as any)?.live_metrics?.cpu_usage || 0}%</span>
                </div>
                <Progress 
                  value={(metrics as any)?.live_metrics?.cpu_usage || 0} 
                  className="h-2"
                  // indicatorClassName={`${getResourceStatus(metrics?.live_metrics?.cpu_usage || 0) === 'error' ? 'bg-red-500' : getResourceStatus(metrics?.live_metrics?.cpu_usage || 0) === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`}
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-300">Memory</span>
                  <span className="text-white">{(metrics as any)?.live_metrics?.memory_usage || 0}%</span>
                </div>
                <Progress 
                  value={(metrics as any)?.live_metrics?.memory_usage || 0} 
                  className="h-2"
                  // indicatorClassName={`${getResourceStatus(metrics?.live_metrics?.memory_usage || 0) === 'error' ? 'bg-red-500' : getResourceStatus(metrics?.live_metrics?.memory_usage || 0) === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-zinc-400">Application Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-300 text-sm">Requests/min</span>
                <span className="text-white font-medium">{formatNumber((metrics as any)?.live_metrics?.requests_per_minute || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300 text-sm">DB Connections</span>
                <span className="text-white font-medium">{(metrics as any)?.live_metrics?.database_connections || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300 text-sm">Queue Size</span>
                <span className="text-white font-medium">{(metrics as any)?.live_metrics?.queue_size || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300 text-sm">Error Count</span>
                <span className={`font-medium ${((metrics as any)?.live_metrics?.error_count || 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {(metrics as any)?.live_metrics?.error_count || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default RealtimeMetricsWidget; 
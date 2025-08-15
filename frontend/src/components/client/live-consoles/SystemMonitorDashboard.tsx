import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Server,
  Zap,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Gauge,
  Database,
  Globe,
  Shield,
  Clock,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface SystemMetric {
  label: string
  value: number
  max: number
  unit: string
  status: 'normal' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
}

interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'degraded'
  uptime: string
  lastCheck: Date
  responseTime: number
  icon: any
}

const mockSystemMetrics: SystemMetric[] = [
  { label: 'CPU Usage', value: 45, max: 100, unit: '%', status: 'normal', trend: 'stable' },
  { label: 'Memory', value: 6.2, max: 16, unit: 'GB', status: 'normal', trend: 'up' },
  { label: 'Disk I/O', value: 120, max: 500, unit: 'MB/s', status: 'normal', trend: 'down' },
  { label: 'Network', value: 850, max: 1000, unit: 'Mbps', status: 'warning', trend: 'up' },
  { label: 'Database', value: 245, max: 500, unit: 'conn', status: 'normal', trend: 'stable' },
  { label: 'Cache Hit', value: 92, max: 100, unit: '%', status: 'normal', trend: 'up' }
]

const mockServices: ServiceStatus[] = [
  { name: 'API Gateway', status: 'online', uptime: '99.99%', lastCheck: new Date(), responseTime: 45, icon: Server },
  { name: 'Email Service', status: 'online', uptime: '99.95%', lastCheck: new Date(), responseTime: 120, icon: Zap },
  { name: 'Database', status: 'online', uptime: '99.98%', lastCheck: new Date(), responseTime: 15, icon: Database },
  { name: 'Cache Layer', status: 'degraded', uptime: '98.50%', lastCheck: new Date(), responseTime: 250, icon: MemoryStick },
  { name: 'CDN', status: 'online', uptime: '100%', lastCheck: new Date(), responseTime: 12, icon: Globe },
  { name: 'Security', status: 'online', uptime: '100%', lastCheck: new Date(), responseTime: 8, icon: Shield }
]

export function SystemMonitorDashboard({ className }: { className?: string }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [metrics, setMetrics] = useState(mockSystemMetrics)
  const [services, setServices] = useState(mockServices)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.max(0, Math.min(metric.max, 
          metric.value + (Math.random() - 0.5) * (metric.max * 0.1)
        ))
      })))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
      case 'online':
        return 'text-green-500'
      case 'warning':
      case 'degraded':
        return 'text-yellow-500'
      case 'critical':
      case 'offline':
        return 'text-red-500'
      default:
        return 'text-muted-foreground'
    }
  }

  const getStatusBadgeVariant = (status: string): React.ComponentProps<typeof Badge>["variant"] => {
    if (status === 'online' || status === 'normal') return 'default'
    if (status === 'degraded' || status === 'warning') return 'secondary'
    if (status === 'offline' || status === 'critical') return 'destructive'
    return 'outline'
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">System Monitor</h2>
          <p className="text-muted-foreground text-sm mt-1">Real-time infrastructure monitoring</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="border-border"
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-background/50 border border-border">
          <TabsTrigger value="overview" className="data-[state=active]:bg-red-500/20">
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-red-500/20">
            Performance
          </TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-red-500/20">
            Services
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-red-500/20">
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric, idx) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-background/50 border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {metric.label}
                      </CardTitle>
                      {metric.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : metric.trend === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">
                        {metric.unit === '%' ? metric.value.toFixed(1) : metric.value.toFixed(0)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {metric.max} {metric.unit}
                      </span>
                    </div>
                    <Progress 
                      value={(metric.value / metric.max) * 100} 
                      className="h-2 mt-3"
                    />
                    <Badge 
                      variant={getStatusBadgeVariant(metric.status)}
                      className="mt-3"
                      aria-label={`Metric status: ${metric.status}`}
                    >
                      {metric.status}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card className="bg-background/50 border-border">
            <CardHeader>
              <CardTitle className="text-red-400">Performance Metrics</CardTitle>
              <CardDescription className="text-muted-foreground">
                Detailed system performance analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* CPU Cores */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-red-400" />
                      <span className="text-white font-medium">CPU Cores</span>
                    </div>
                    <span className="text-muted-foreground text-sm">8 cores / 16 threads</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Core {i}</span>
                          <span className="text-white">{Math.floor(Math.random() * 40 + 30)}%</span>
                        </div>
                        <Progress value={Math.random() * 60 + 20} className="h-1" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Memory Breakdown */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MemoryStick className="h-5 w-5 text-red-400" />
                      <span className="text-white font-medium">Memory Usage</span>
                    </div>
                    <span className="text-muted-foreground text-sm">6.2 GB / 16 GB</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Applications</span>
                      <span className="text-white">3.8 GB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cache</span>
                      <span className="text-white">1.2 GB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Buffers</span>
                      <span className="text-white">1.2 GB</span>
                    </div>
                  </div>
                </div>

                {/* Network Stats */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Network className="h-5 w-5 text-red-400" />
                      <span className="text-white font-medium">Network I/O</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">Inbound</p>
                      <p className="text-xl font-bold text-white">425 Mbps</p>
                      <Progress value={42.5} className="h-1 mt-2" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">Outbound</p>
                      <p className="text-xl font-bold text-white">380 Mbps</p>
                      <Progress value={38} className="h-1 mt-2" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service, idx) => {
              const Icon = service.icon
              return (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-background/50 border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'p-2 rounded-lg',
                            service.status === 'online' && 'bg-green-500/10',
                            service.status === 'degraded' && 'bg-yellow-500/10',
                            service.status === 'offline' && 'bg-red-500/10'
                          )}>
                            <Icon className={cn('h-5 w-5', getStatusColor(service.status))} />
                          </div>
                          <div>
                            <p className="text-white font-medium">{service.name}</p>
                            <p className="text-muted-foreground text-sm">Uptime: {service.uptime}</p>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(service.status)} aria-label={`Service status: ${service.status}`}>
                          {service.status}
                        </Badge>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Response Time</p>
                          <p className="text-white font-medium">{service.responseTime}ms</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Check</p>
                          <p className="text-white font-medium">
                            {service.lastCheck.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Alert className="bg-yellow-900/20 border-yellow-500/30">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-400">
              <strong>Warning:</strong> Cache service experiencing high latency (250ms average)
            </AlertDescription>
          </Alert>

          <Card className="bg-background/50 border-border">
            <CardHeader>
              <CardTitle className="text-red-400">Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {[
                    { time: '10:45:23', level: 'warning', message: 'High memory usage detected (85%)' },
                    { time: '10:42:15', level: 'info', message: 'Backup completed successfully' },
                    { time: '10:38:41', level: 'error', message: 'Failed to connect to replica database' },
                    { time: '10:35:12', level: 'warning', message: 'SSL certificate expires in 30 days' },
                    { time: '10:30:55', level: 'info', message: 'System update available' }
                  ].map((alert, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-black/30"
                    >
                      <Badge 
                        variant={alert.level === 'error' ? 'destructive' : alert.level === 'warning' ? 'secondary' : 'default'}
                        className="text-xs"
                        aria-label={`Alert level: ${alert.level}`}
                      >
                        {alert.level}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-muted-foreground text-sm">{alert.message}</p>
                        <p className="text-muted-foreground text-xs mt-1">{alert.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
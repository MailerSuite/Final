/**
 * 🚀 Enhanced Live Monitoring Dashboard - Streamlined Design
 * Transforms the complex monitoring systems into a real-time powerhouse
 * Built with StreamlinedDesignSystem for maximum monitoring efficiency
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  StreamlinedCard,
  StreamlinedConsole,
  StreamlinedTable,
  StreamlinedMetric,
  StreamlinedPageHeader,
  StreamlinedGrid,
  StreamlinedButton,
  streamlinedAnimations
} from '@/components/client/StreamlinedDesignSystem'
import { ThemeToggle } from '@/components/client/ThemeProvider'
import {
  Activity,
  Server,
  Database,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  Settings,
  Bell,
  BellOff,
  Play,
  Pause,
  Zap,
  Shield,
  Globe,
  Users,
  Mail,
  TrendingUp,
  TrendingDown,
  Cpu,
  HardDrive,
  MemoryStick,
  NetworkIcon,
  Eye,
  BarChart3,
  LineChart,
  Target
} from 'lucide-react'

// Types
interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  network: number
  uptime: string
  load: number
}

interface ServiceStatus {
  id: string
  name: string
  status: 'healthy' | 'warning' | 'critical' | 'offline'
  responseTime: number
  lastCheck: string
  uptime: number
  endpoint: string
  description: string
}

interface Alert {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'critical'
  message: string
  service?: string
  resolved: boolean
}

interface ConsoleLog {
  id: string
  timestamp: string
  level: 'info' | 'success' | 'error' | 'warning'
  message: string
  service?: string
}

interface PerformanceMetric {
  timestamp: string
  cpu: number
  memory: number
  responseTime: number
  throughput: number
}

export default function EnhancedLiveMonitoring() {
  // State management
  const [isRealTimeActive, setIsRealTimeActive] = useState(true)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 45,
    memory: 62,
    disk: 78,
    network: 23,
    uptime: '15d 7h 32m',
    load: 1.25
  })
  
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([])
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMetric[]>([])
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h')
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [wsConnected, setWsConnected] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)

  // Add console log
  const addConsoleLog = useCallback((level: ConsoleLog['level'], message: string, service?: string) => {
    const log: ConsoleLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      service
    }
    setConsoleLogs(prev => [...prev.slice(-99), log])
  }, [])

  // Add alert
  const addAlert = useCallback((level: Alert['level'], message: string, service?: string) => {
    const alert: Alert = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level,
      message,
      service,
      resolved: false
    }
    setAlerts(prev => [alert, ...prev.slice(0, 49)]) // Keep last 50 alerts
    addConsoleLog(level === 'critical' ? 'error' : level, `ALERT: ${message}`, service)
  }, [addConsoleLog])

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      // In a real implementation, this would connect to your WebSocket endpoint
      // wsRef.current = new WebSocket('ws://localhost:8000/ws/monitoring')
      
      // Simulate WebSocket connection for demo
      setWsConnected(true)
      addConsoleLog('success', 'Real-time monitoring connection established')
      
      // Simulate periodic updates
      const interval = setInterval(() => {
        if (isRealTimeActive) {
          updateMetrics()
        }
      }, 2000)

      return () => clearInterval(interval)
    } catch (error) {
      setWsConnected(false)
      addConsoleLog('error', 'Failed to establish monitoring connection')
    }
  }, [isRealTimeActive, addConsoleLog])

  // Update metrics
  const updateMetrics = useCallback(() => {
    // Simulate real-time metric updates
    setSystemMetrics(prev => ({
      ...prev,
      cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() - 0.5) * 10)),
      memory: Math.max(30, Math.min(95, prev.memory + (Math.random() - 0.5) * 5)),
      network: Math.max(0, Math.min(100, prev.network + (Math.random() - 0.5) * 20)),
      load: Math.max(0.1, Math.min(4.0, prev.load + (Math.random() - 0.5) * 0.3))
    }))

    // Update service statuses
    setServices(prev => prev.map(service => {
      const responseTime = Math.max(50, service.responseTime + (Math.random() - 0.5) * 100)
      let status: ServiceStatus['status'] = 'healthy'
      
      if (responseTime > 1000) status = 'critical'
      else if (responseTime > 500) status = 'warning'
      
      return {
        ...service,
        responseTime: Math.round(responseTime),
        lastCheck: new Date().toISOString(),
        uptime: Math.min(100, service.uptime + 0.01)
      }
    }))

    // Add performance history point
    const now = new Date()
    setPerformanceHistory(prev => [...prev.slice(-29), {
      timestamp: now.toLocaleTimeString(),
      cpu: systemMetrics.cpu,
      memory: systemMetrics.memory,
      responseTime: Math.random() * 500 + 100,
      throughput: Math.random() * 1000 + 500
    }])

    // Random alerts
    if (Math.random() < 0.05 && alertsEnabled) { // 5% chance per update
      const alertMessages = [
        'High CPU usage detected',
        'Memory usage threshold exceeded',
        'Service response time degraded',
        'Disk space running low',
        'Network latency spike detected'
      ]
      const levels: Alert['level'][] = ['info', 'warning', 'critical']
      addAlert(
        levels[Math.floor(Math.random() * levels.length)],
        alertMessages[Math.floor(Math.random() * alertMessages.length)]
      )
    }
  }, [systemMetrics, alertsEnabled, addAlert])

  // Load initial data
  useEffect(() => {
    const initialServices: ServiceStatus[] = [
      {
        id: '1',
        name: 'SGPT Backend',
        status: 'healthy',
        responseTime: 145,
        lastCheck: new Date().toISOString(),
        uptime: 99.95,
        endpoint: '/api/v1/health',
        description: 'Main FastAPI backend service'
      },
      {
        id: '2',
        name: 'Database',
        status: 'healthy',
        responseTime: 23,
        lastCheck: new Date().toISOString(),
        uptime: 99.99,
        endpoint: 'postgresql://localhost:5432',
        description: 'PostgreSQL database server'
      },
      {
        id: '3',
        name: 'Redis Cache',
        status: 'warning',
        responseTime: 456,
        lastCheck: new Date().toISOString(),
        uptime: 98.7,
        endpoint: 'redis://localhost:6379',
        description: 'Redis caching service'
      },
      {
        id: '4',
        name: 'Email Service',
        status: 'healthy',
        responseTime: 234,
        lastCheck: new Date().toISOString(),
        uptime: 99.8,
        endpoint: '/api/v1/email/health',
        description: 'SMTP/IMAP email services'
      },
      {
        id: '5',
        name: 'Authentication',
        status: 'healthy',
        responseTime: 89,
        lastCheck: new Date().toISOString(),
        uptime: 99.95,
        endpoint: '/api/v1/auth/health',
        description: 'JWT authentication service'
      },
      {
        id: '6',
        name: 'File Storage',
        status: 'critical',
        responseTime: 1250,
        lastCheck: new Date().toISOString(),
        uptime: 95.2,
        endpoint: '/api/v1/files/health',
        description: 'File upload and storage service'
      }
    ]

    setServices(initialServices)
    addConsoleLog('info', 'Live monitoring dashboard initialized')
    addConsoleLog('info', `Monitoring ${initialServices.length} services`)
    
    const cleanup = initializeWebSocket()
    return cleanup
  }, [initializeWebSocket, addConsoleLog])

  // Service status styling
  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'critical': return 'text-red-500'
      case 'offline': return 'text-muted-foreground'
    }
  }

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'critical': return <XCircle className="w-4 h-4" />
      case 'offline': return <Clock className="w-4 h-4" />
    }
  }

  // Alert level styling
  const getAlertColor = (level: Alert['level']) => {
    switch (level) {
      case 'info': return 'text-blue-500 bg-blue-500/10'
      case 'warning': return 'text-yellow-500 bg-yellow-500/10'
      case 'critical': return 'text-red-500 bg-red-500/10'
    }
  }

  const healthyServices = services.filter(s => s.status === 'healthy').length
  const avgResponseTime = services.reduce((sum, s) => sum + s.responseTime, 0) / services.length

  return (
    <motion.div
      className="min-h-screen bg-background relative overflow-hidden"
      variants={streamlinedAnimations.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb" />
        <div className="floating-orb" />
        <div className="floating-orb floating-orb-3" />
      </div>

      {/* Header */}
      <StreamlinedPageHeader
        title="Live Monitoring Dashboard"
        subtitle="Real-time system monitoring with advanced analytics and alerting"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {wsConnected ? (
                <div className="flex items-center gap-2 text-green-500">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm">Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-500">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm">Offline</span>
                </div>
              )}
            </div>
            <StreamlinedButton
              variant={alertsEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setAlertsEnabled(!alertsEnabled)}
            >
              {alertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </StreamlinedButton>
            <StreamlinedButton
              variant={isRealTimeActive ? "default" : "outline"}
              size="sm"
              onClick={() => setIsRealTimeActive(!isRealTimeActive)}
            >
              {isRealTimeActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </StreamlinedButton>
            <ThemeToggle />
          </div>
        }
      />

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {/* System Metrics */}
        <StreamlinedGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <StreamlinedMetric
            label="CPU Usage"
            value={`${systemMetrics.cpu.toFixed(1)}%`}
            trend={{
              direction: systemMetrics.cpu > 70 ? 'down' : 'up',
              value: systemMetrics.cpu > 70 ? 'High' : 'Normal'
            }}
            icon={<Cpu className="w-4 h-4" />}
            variant={systemMetrics.cpu > 80 ? 'accent' : 'default'}
          />
          <StreamlinedMetric
            label="Memory Usage"
            value={`${systemMetrics.memory.toFixed(1)}%`}
            trend={{
              direction: systemMetrics.memory > 80 ? 'down' : 'up',
              value: `${(systemMetrics.memory / 100 * 16).toFixed(1)}GB`
            }}
            icon={<MemoryStick className="w-4 h-4" />}
            variant={systemMetrics.memory > 90 ? 'accent' : 'default'}
          />
          <StreamlinedMetric
            label="Disk Usage"
            value={`${systemMetrics.disk}%`}
            trend={{
              direction: 'neutral',
              value: `${(systemMetrics.disk / 100 * 500).toFixed(0)}GB`
            }}
            icon={<HardDrive className="w-4 h-4" />}
          />
          <StreamlinedMetric
            label="Network"
            value={`${systemMetrics.network.toFixed(1)}%`}
            trend={{
              direction: systemMetrics.network > 50 ? 'up' : 'down',
              value: `${(systemMetrics.network * 10).toFixed(0)} Mbps`
            }}
            icon={<NetworkIcon className="w-4 h-4" />}
          />
        </StreamlinedGrid>

        {/* Service Status & Performance */}
        <StreamlinedGrid className="grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Service Status */}
          <div className="lg:col-span-2">
            <StreamlinedCard variant="minimal" padding="none">
              <div className="p-4 border-b border-border dark:border-border/50 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" />
                  Service Status ({healthyServices}/{services.length} Healthy)
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    className="px-3 py-1 text-xs rounded border border-border dark:border-border bg-background/50 focus:border-primary transition-all"
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                  >
                    <option value="1h">Last Hour</option>
                    <option value="6h">Last 6 Hours</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                  </select>
                  <StreamlinedButton variant="ghost" size="sm">
                    <RefreshCw className="w-3 h-3" />
                  </StreamlinedButton>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border dark:border-border/30 bg-muted/10">
                    <tr>
                      <th className="text-left p-3 font-medium text-muted-foreground">Service</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Response</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Uptime</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Last Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service, index) => (
                      <motion.tr
                        key={service.id}
                        className="border-b border-border dark:border-border/20 hover:bg-muted/20 transition-colors"
                        variants={streamlinedAnimations.fadeInUp}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-xs text-muted-foreground">{service.description}</div>
                            <div className="text-xs text-muted-foreground font-mono">{service.endpoint}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className={`flex items-center gap-2 ${getStatusColor(service.status)}`}>
                            {getStatusIcon(service.status)}
                            <span className="text-xs font-medium capitalize">{service.status}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`text-sm font-medium ${
                            service.responseTime > 1000 ? 'text-red-500' :
                            service.responseTime > 500 ? 'text-yellow-500' : 'text-green-500'
                          }`}>
                            {service.responseTime}ms
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  service.uptime > 99 ? 'bg-green-500' :
                                  service.uptime > 95 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${service.uptime}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">{service.uptime.toFixed(2)}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {new Date(service.lastCheck).toLocaleTimeString()}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </StreamlinedCard>
          </div>

          {/* Real-time Alerts */}
          <StreamlinedCard variant="minimal" padding="none">
            <div className="p-4 border-b border-border dark:border-border/50 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                Recent Alerts ({alerts.filter(a => !a.resolved).length})
              </h3>
              <StreamlinedButton
                variant="ghost"
                size="sm"
                onClick={() => setAlerts([])}
              >
                Clear
              </StreamlinedButton>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              <AnimatePresence>
                {alerts.slice(0, 10).map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    className="p-3 border-b border-border dark:border-border/20 hover:bg-muted/20 transition-colors"
                    variants={streamlinedAnimations.fadeInUp}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ delay: index * 0.02 }}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getAlertColor(alert.level)}`}>
                        {alert.level.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium line-clamp-2">{alert.message}</div>
                        {alert.service && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Service: {alert.service}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </StreamlinedCard>
        </StreamlinedGrid>

        {/* Performance Charts & Console */}
        <StreamlinedGrid className="grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <StreamlinedCard variant="minimal" padding="md">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Performance Metrics (Real-time)
            </h3>
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <LineChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Performance chart visualization</p>
                <p className="text-xs">({performanceHistory.length} data points)</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border dark:border-border/30">
              <div className="text-center">
                <div className="text-lg font-semibold">{avgResponseTime.toFixed(0)}ms</div>
                <div className="text-xs text-muted-foreground">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{systemMetrics.load.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">System Load</div>
              </div>
            </div>
          </StreamlinedCard>

          {/* Live Console */}
          <StreamlinedCard variant="console" padding="none">
            <div className="p-3 border-b border-border dark:border-border/30 flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                System Console (Live)
              </h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRealTimeActive ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                <StreamlinedButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setConsoleLogs([])}
                >
                  Clear
                </StreamlinedButton>
              </div>
            </div>
            <StreamlinedConsole
              logs={consoleLogs}
              height="220px"
              maxLines={50}
              animated={true}
            />
          </StreamlinedCard>
        </StreamlinedGrid>

        {/* Quick Stats */}
        <StreamlinedGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-6">
          <StreamlinedMetric
            label="System Uptime"
            value={systemMetrics.uptime}
            icon={<Clock className="w-4 h-4" />}
            variant="minimal"
          />
          <StreamlinedMetric
            label="Active Users"
            value="1,247"
            trend={{ direction: 'up', value: '+5.2%' }}
            icon={<Users className="w-4 h-4" />}
            variant="minimal"
          />
          <StreamlinedMetric
            label="Emails Sent"
            value="15.4K"
            trend={{ direction: 'up', value: '+12%' }}
            icon={<Mail className="w-4 h-4" />}
            variant="minimal"
          />
          <StreamlinedMetric
            label="API Calls"
            value="89.2K"
            trend={{ direction: 'up', value: '+8.1%' }}
            icon={<Globe className="w-4 h-4" />}
            variant="minimal"
          />
          <StreamlinedMetric
            label="Cache Hit Rate"
            value="94.7%"
            trend={{ direction: 'up', value: 'Excellent' }}
            icon={<Zap className="w-4 h-4" />}
            variant="minimal"
          />
          <StreamlinedMetric
            label="Security Score"
            value="98/100"
            trend={{ direction: 'up', value: 'Secure' }}
            icon={<Shield className="w-4 h-4" />}
            variant="minimal"
          />
        </StreamlinedGrid>
      </div>
    </motion.div>
  )
}
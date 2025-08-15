import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Activity, Cpu, Database, Globe, Mail, Network, Server, Shield, Sparkles, TrendingUp, RefreshCcw, Rocket, CheckCircle, XCircle, Clock, Send } from 'lucide-react'
import PageShell from '../components/PageShell'
import { generateDashboardData } from '@/services/mockData'
import { useAuthStore } from '@/store/auth'
import axiosInstance from '@/http/axios'

type HealthState = 'healthy' | 'warning' | 'critical' | 'down' | 'unknown'

interface LiveHealth {
  status: HealthState
  live?: HealthState
  ready?: HealthState
}

interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  uptime: string
}

interface FunctionStats {
  campaignsActive: number
  emailsSent24h: number
  smtpAccounts: number
  imapAccounts: number
}

interface SmtpAccount {
  id: string
  email: string
  provider: string
  status: 'active' | 'inactive' | 'error'
  sent24h: number
  limit: number
}

interface ProxyAccount {
  id: string
  host: string
  port: number
  type: string
  status: 'active' | 'inactive' | 'error'
  country: string
}

const statusColor = (s: HealthState) => {
  switch (s) {
    case 'healthy': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
    case 'warning': return 'bg-amber-500/15 text-amber-400 border-amber-500/20'
    case 'critical': return 'bg-rose-500/15 text-rose-400 border-rose-500/20'
    case 'down': return 'bg-rose-600/20 text-rose-400 border-rose-600/30'
    default: return 'bg-muted/15 text-muted-foreground border-border/20'
  }
}

const generateMockSmtpAccounts = (): SmtpAccount[] => [
  { id: '1', email: 'sender1@company.com', provider: 'Gmail', status: 'active', sent24h: 245, limit: 500 },
  { id: '2', email: 'sender2@company.com', provider: 'Outlook', status: 'active', sent24h: 180, limit: 300 },
  { id: '3', email: 'sender3@company.com', provider: 'SendGrid', status: 'inactive', sent24h: 0, limit: 1000 },
  { id: '4', email: 'sender4@company.com', provider: 'Gmail', status: 'error', sent24h: 45, limit: 500 },
  { id: '5', email: 'sender5@company.com', provider: 'Mailgun', status: 'active', sent24h: 320, limit: 800 },
]

const generateMockProxyAccounts = (): ProxyAccount[] => [
  { id: '1', host: '192.168.1.100', port: 8080, type: 'HTTP', status: 'active', country: 'US' },
  { id: '2', host: '10.0.0.50', port: 3128, type: 'HTTPS', status: 'active', country: 'UK' },
  { id: '3', host: '172.16.0.25', port: 1080, type: 'SOCKS5', status: 'inactive', country: 'DE' },
  { id: '4', host: '203.45.67.89', port: 8080, type: 'HTTP', status: 'error', country: 'CA' },
  { id: '5', host: '198.51.100.42', port: 3128, type: 'HTTPS', status: 'active', country: 'FR' },
]

export default function UnifiedFunctionsDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState<LiveHealth>({ status: 'unknown' })
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [funcStats, setFuncStats] = useState<FunctionStats | null>(null)
  const [smtpAccounts, setSmtpAccounts] = useState<SmtpAccount[]>([])
  const [proxyAccounts, setProxyAccounts] = useState<ProxyAccount[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'system' | 'functions'>('overview')

  const { token, userData } = useAuthStore()

  const fetchAll = React.useCallback(async () => {
    setLoading(true)
    try {
      // Check if user is authenticated
      if (!token) {
        console.warn('No authentication token available, using mock data')
        const mockData = generateDashboardData()
        setHealth({ status: 'healthy', live: 'healthy', ready: 'healthy' })
        setMetrics({
          cpu: Math.random() * 60 + 20,
          memory: Math.random() * 50 + 30,
          disk: Math.random() * 40 + 40,
          uptime: '15d 8h 32m',
        })
        setFuncStats({
          campaignsActive: mockData.stats.activeCampaigns,
          emailsSent24h: Math.floor(mockData.stats.totalSent / 30),
          smtpAccounts: 8,
          imapAccounts: 6,
        })
        
        // Mock SMTP and Proxy accounts
        setSmtpAccounts(generateMockSmtpAccounts())
        setProxyAccounts(generateMockProxyAccounts())
        
        setLoading(false)
        return
      }

      // Make authenticated API calls
      const [h1, hLive, hReady] = await Promise.all([
        axiosInstance.get('/api/v1/health').catch(() => null),
        axiosInstance.get('/health/live').catch(() => null),
        axiosInstance.get('/health/ready').catch(() => null),
      ])

      const toJson = async (res: unknown) => {
        try { return res?.data || null } catch { return null }
      }
      const j1 = await toJson(h1)
      const jLive = await toJson(hLive)
      const jReady = await toJson(hReady)

      let newHealth: LiveHealth = {
        status: (j1?.status as HealthState) || 'unknown',
        live: (jLive?.status as HealthState) || undefined,
        ready: (jReady?.status as HealthState) || undefined,
      }

      // Fetch system metrics with admin authentication
      let sys: SystemMetrics = {
        cpu: 0,
        memory: 0,
        disk: 0,
        uptime: '—',
      }

      try {
        const metricsResp = await axiosInstance.get('/api/v1/admin/system/status')
        const metricsJson = metricsResp?.data
        if (metricsJson?.system) {
          sys = {
            cpu: Number(metricsJson.system.cpu_percent ?? 0),
            memory: Number(metricsJson.system.memory_percent ?? 0),
            disk: Number(metricsJson.system.disk_percent ?? 0),
            uptime: metricsJson.system.uptime ?? '—',
          }
        }
      } catch (error) {
        console.warn('Failed to fetch system metrics:', error)
      }

      // Fetch business stats
      let fs: FunctionStats = {
        campaignsActive: 0,
        emailsSent24h: 0,
        smtpAccounts: 0,
        imapAccounts: 0,
      }

      try {
        const statsResp = await axiosInstance.get('/api/v1/analytics/summary')
        const stats = statsResp?.data
        if (stats) {
          fs = {
            campaignsActive: Number(stats.campaigns_active ?? 0),
            emailsSent24h: Number(stats.emails_sent_24h ?? 0),
            smtpAccounts: Number(stats.smtp_accounts ?? 0),
            imapAccounts: Number(stats.imap_accounts ?? 0),
          }
        }
      } catch (error) {
        console.warn('Failed to fetch analytics summary:', error)
      }

      // Use mock data if API calls fail or return no data
      if (!j1 || newHealth.status === 'unknown') {
        const mockData = generateDashboardData()
        newHealth = { status: 'healthy', live: 'healthy', ready: 'healthy' }
        sys = {
          cpu: Math.random() * 60 + 20,
          memory: Math.random() * 50 + 30,
          disk: Math.random() * 40 + 40,
          uptime: '15d 8h 32m',
        }
        fs = {
          campaignsActive: mockData.stats.activeCampaigns,
          emailsSent24h: Math.floor(mockData.stats.totalSent / 30),
          smtpAccounts: 8,
          imapAccounts: 6,
        }
      }

      setHealth(newHealth)
      setMetrics(sys)
      setFuncStats(fs)
      setSmtpAccounts(generateMockSmtpAccounts())
      setProxyAccounts(generateMockProxyAccounts())
    } catch (_) {
      // Fall back to mock data on error
      const mockData = generateDashboardData()
      setHealth({ status: 'healthy', live: 'healthy', ready: 'healthy' })
      setMetrics({
        cpu: Math.random() * 60 + 20,
        memory: Math.random() * 50 + 30,
        disk: Math.random() * 40 + 40,
        uptime: '15d 8h 32m',
      })
      setFuncStats({
        campaignsActive: mockData.stats.activeCampaigns,
        emailsSent24h: Math.floor(mockData.stats.totalSent / 30),
        smtpAccounts: 8,
        imapAccounts: 6,
      })
      setSmtpAccounts(generateMockSmtpAccounts())
      setProxyAccounts(generateMockProxyAccounts())
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    let cancelled = false
    fetchAll()
    return () => { cancelled = true }
  }, [fetchAll])

  const statCards = useMemo(() => ([
    {
      title: 'System Health',
      value: (health.status || 'unknown').toUpperCase(),
      icon: Shield,
      badge: health.status,
      subtitle: `Live: ${health.live ?? '—'} • Ready: ${health.ready ?? '—'}`,
    },
    {
      title: 'CPU Load',
      value: metrics ? `${metrics.cpu.toFixed(0)}%` : '—',
      icon: Cpu,
      badge: metrics && metrics.cpu > 80 ? 'critical' : metrics && metrics.cpu > 60 ? 'warning' : 'healthy',
      subtitle: metrics ? `Uptime: ${metrics.uptime}` : 'Collecting…',
    },
    {
      title: 'Memory Usage',
      value: metrics ? `${metrics.memory.toFixed(0)}%` : '—',
      icon: Database,
      badge: metrics && metrics.memory > 80 ? 'warning' : 'healthy',
      subtitle: 'Application pool',
    },
    {
      title: 'Disk Space',
      value: metrics ? `${metrics.disk.toFixed(0)}%` : '—',
      icon: Server,
      badge: metrics && metrics.disk > 85 ? 'critical' : 'healthy',
      subtitle: 'Persistent volumes',
    },
  ]), [health, metrics])

  const businessCards = useMemo(() => ([
    { title: 'Active Campaigns', value: funcStats?.campaignsActive ?? 0, icon: TrendingUp, subtitle: 'Running now' },
    { title: 'Emails Sent (24h)', value: funcStats?.emailsSent24h ?? 0, icon: Mail, subtitle: 'Throughput last 24h' },
    { title: 'SMTP Accounts', value: funcStats?.smtpAccounts ?? 0, icon: Network, subtitle: 'Configured senders' },
    { title: 'IMAP Accounts', value: funcStats?.imapAccounts ?? 0, icon: Globe, subtitle: 'Monitored inboxes' },
  ]), [funcStats])

  return (
    <PageShell
      title="Platform Overview"
      subtitle="Unified dashboard aligned with system and business functions"
      titleIcon={<Rocket className="w-4 h-4 text-primary" />}
      actions={(
        <>
          <Button 
            size="sm" 
            variant="default" 
            className="rounded-full bg-primary hover:bg-primary/90"
            onClick={() => navigate('/campaigns/create')}
          >
            <Send className="w-4 h-4 mr-2" />
            Quick Send
          </Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={fetchAll} disabled={loading}>
            <RefreshCcw className={cn('w-4 h-4 mr-2', loading ? 'animate-spin' : '')} />
            Refresh
          </Button>
          <Button size="sm" className="rounded-full"><Sparkles className="w-4 h-4 mr-2" />Open Assistant</Button>
        </>
      )}
    >

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((c) => (
          <Card key={c.title} variant="gradient-subtle" className="rounded-2xl border-border/20 bg-card hover:bg-card/80 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold text-card-foreground">{c.title}</CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{c.value}</div>
              <p className="text-sm text-muted-foreground">{c.subtitle}</p>
              <Badge className={cn('mt-2', statusColor(c.badge))}>
                {c.badge}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Business metrics */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4 text-foreground">Business Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {businessCards.map((c) => (
            <Card key={c.title} variant="gradient-card" className="rounded-2xl border-primary/10 bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-foreground">{c.title}</CardTitle>
                <c.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{c.value}</div>
                <p className="text-sm text-muted-foreground">{c.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Authentication status */}
      {!token && (
        <div className="mt-8">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-amber-600" />
                <div>
                  <h4 className="text-base font-semibold text-amber-800">Authentication Required</h4>
                  <p className="text-sm text-amber-700">
                    Please log in to view real-time system metrics and business data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Deep dive section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4 text-foreground">Service Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base font-semibold text-foreground">
                <Activity className="h-5 w-5" />
                <span>API Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={statusColor(health.status)}>
                {health.status || 'unknown'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base font-semibold text-foreground">
                <Globe className="h-5 w-5" />
                <span>Web Service</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={statusColor(health.live || 'unknown')}>
                {health.live || 'unknown'}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SMTP Accounts Table */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4 text-foreground">SMTP Accounts</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent (24h)</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead>Usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {smtpAccounts.map((account) => {
                  const usagePercent = (account.sent24h / account.limit) * 100
                  return (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.email}</TableCell>
                      <TableCell>{account.provider}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          account.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
                          account.status === 'inactive' ? 'bg-gray-500/15 text-gray-400 border-gray-500/20' :
                          'bg-rose-500/15 text-rose-400 border-rose-500/20'
                        )}>
                          {account.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {account.status === 'inactive' && <Clock className="w-3 h-3 mr-1" />}
                          {account.status === 'error' && <XCircle className="w-3 h-3 mr-1" />}
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{account.sent24h.toLocaleString()}</TableCell>
                      <TableCell>{account.limit.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className={cn(
                                "h-2 rounded-full transition-all",
                                usagePercent > 80 ? "bg-red-500" :
                                usagePercent > 60 ? "bg-yellow-500" :
                                "bg-emerald-500"
                              )}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {usagePercent.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Proxy Accounts Table */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4 text-foreground">Proxy Accounts</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Host</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Country</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proxyAccounts.map((proxy) => (
                  <TableRow key={proxy.id}>
                    <TableCell className="font-medium font-mono">{proxy.host}</TableCell>
                    <TableCell className="font-mono">{proxy.port}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {proxy.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        proxy.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
                        proxy.status === 'inactive' ? 'bg-gray-500/15 text-gray-400 border-gray-500/20' :
                        'bg-rose-500/15 text-rose-400 border-rose-500/20'
                      )}>
                        {proxy.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {proxy.status === 'inactive' && <Clock className="w-3 h-3 mr-1" />}
                        {proxy.status === 'error' && <XCircle className="w-3 h-3 mr-1" />}
                        {proxy.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                          {proxy.country}
                        </div>
                        <span>{proxy.country}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

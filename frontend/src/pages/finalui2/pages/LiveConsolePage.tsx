import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
// Removed legacy design-system.css; relying on Tailwind/shadcn styles
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LiveConsole } from '@/components/ui/live-console'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  ComputerDesktopIcon as TerminalIcon, 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  ArrowDownTrayIcon as DownloadIcon,
  FunnelIcon as FilterIcon,
  MagnifyingGlassIcon as SearchIcon,
  ServerIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog8ToothIcon as CogIcon,
  TrashIcon,
  ArrowPathIcon as RefreshCwIcon
} from '@heroicons/react/24/outline'

const resolveWsUrl = (): string | undefined => {
  const base = import.meta.env.VITE_WS_URL as string | undefined
  if (base) return `${base.replace(/\/?$/, '')}/console`
  // Fallback to localhost dev default
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://${window.location.host}/ws/console`
  }
  return undefined
}

export default function LiveConsolePage() {
  const wsUrl = resolveWsUrl()
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [filterLevel, setFilterLevel] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const [logCount, setLogCount] = useState(0)

  // Mock connection status and metrics
  useEffect(() => {
    const timer = setInterval(() => {
      setIsConnected(Math.random() > 0.1) // 90% uptime simulation
      setLogCount(prev => prev + Math.floor(Math.random() * 5))
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  const systemMetrics = [
    { label: 'Memory Usage', value: '2.4GB', progress: 68 },
    { label: 'CPU Usage', value: '45%', progress: 45 },
    { label: 'Network I/O', value: '128KB/s', progress: 32 },
    { label: 'Active Connections', value: '1,247', progress: 85 },
  ]

  const logSources = [
    { id: 'system', name: 'System', count: 156, active: true },
    { id: 'email', name: 'Email Engine', count: 2340, active: true },
    { id: 'auth', name: 'Authentication', count: 89, active: false },
    { id: 'database', name: 'Database', count: 445, active: true },
    { id: 'api', name: 'API Gateway', count: 1890, active: true },
    { id: 'websocket', name: 'WebSocket', count: 67, active: false },
  ]

  const quickFilters = [
    { id: 'error', label: 'Errors', count: 12, variant: 'destructive' as const },
    { id: 'warning', label: 'Warnings', count: 45, variant: 'secondary' as const },
    { id: 'info', label: 'Info', count: 1250, variant: 'outline' as const },
    { id: 'debug', label: 'Debug', count: 890, variant: 'outline' as const },
  ]

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-primary/10 border border-primary/20">
            <TerminalIcon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Live System Console</h1>
            <p className="text-xs text-muted-foreground">Real-time monitoring & log analysis</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'default' : 'destructive'} className="badge-compact flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {isConnected ? 'Live' : 'Offline'}
          </Badge>
          <Button size="sm" variant="outline" className="btn-compact-sm">
            <DownloadIcon className="icon-sm mr-1" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* System Metrics */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="card-compact">
          <CardHeader className="pb-2 pt-2.5 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <ServerIcon className="icon-sm text-blue-500" />
                System Metrics
              </CardTitle>
              <Button size="sm" variant="ghost" className="btn-compact-xs p-1">
                <RefreshCwIcon className="icon-xs" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-2.5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {systemMetrics.map((metric, idx) => (
                <div key={idx} className="p-2 rounded border">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium">{metric.label}</span>
                    <span className="text-xs font-semibold">{metric.value}</span>
                  </div>
                  <Progress value={metric.progress} className="h-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Console Area - Takes up 3 columns */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="console" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="h-7">
                <TabsTrigger value="console" className="text-xs py-1 px-2 flex items-center gap-1">
                  <TerminalIcon className="icon-xs" />
                  Console
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs py-1 px-2 flex items-center gap-1">
                  <WifiIcon className="icon-xs" />
                  Analytics
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-1">
                <Button 
                  size="sm" 
                  variant={isPaused ? "default" : "outline"}
                  onClick={() => setIsPaused(!isPaused)}
                  className="btn-compact-xs p-1"
                >
                  {isPaused ? <PlayIcon className="icon-xs" /> : <PauseIcon className="icon-xs" />}
                </Button>
                <Button size="sm" variant="outline" className="btn-compact-xs p-1">
                  <StopIcon className="icon-xs" />
                </Button>
                <Button size="sm" variant="outline" className="btn-compact-xs p-1">
                  <TrashIcon className="icon-xs" />
                </Button>
              </div>
            </div>

            <TabsContent value="console" className="space-y-4">
              {/* Compact Search and Filter Bar */}
              <Card className="card-compact">
                <CardContent className="p-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 icon-xs text-muted-foreground" />
                      <Input 
                        placeholder="Search..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-compact pl-7 text-xs"
                      />
                    </div>
                    <Select value={filterLevel} onValueChange={setFilterLevel}>
                      <SelectTrigger className="w-[120px] select-compact text-xs">
                        <FilterIcon className="icon-xs mr-1" />
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">All</SelectItem>
                        <SelectItem value="error" className="text-xs">Errors</SelectItem>
                        <SelectItem value="warning" className="text-xs">Warnings+</SelectItem>
                        <SelectItem value="info" className="text-xs">Info+</SelectItem>
                        <SelectItem value="debug" className="text-xs">Debug</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Switch 
                        id="auto-scroll" 
                        checked={autoScroll}
                        onCheckedChange={setAutoScroll}
                        className="scale-75"
                      />
                      <Label htmlFor="auto-scroll" className="text-xs">Auto</Label>
                    </div>
                  </div>
                  
                  {/* Compact Quick Filters */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {quickFilters.map((filter) => (
                      <Badge 
                        key={filter.id}
                        variant={filter.variant}
                        className="badge-compact cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {filter.label} ({filter.count})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Compact Console Display */}
              <Card className="min-h-[350px]">
                <CardHeader className="pb-1 pt-2 px-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Console Output</CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{logCount > 1000 ? `${(logCount/1000).toFixed(1)}k` : logCount} msgs</span>
                      <Separator orientation="vertical" className="h-3" />
                      <span>{isConnected ? 'Live' : '2m ago'}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <LiveConsole 
                    title="" 
                    wsUrl={wsUrl} 
                    height={350}
                    className="border-0 rounded-none text-xs"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Console Analytics</CardTitle>
                  <CardDescription>Log patterns and system insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <WifiIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Analytics dashboard coming soon</p>
                    <p className="text-sm mt-2">Real-time log analysis and pattern detection</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Sidebar - Takes up 1 column */}
        <motion.div
          className="lg:col-span-1 space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Compact Log Sources */}
          <Card className="card-compact">
            <CardHeader className="pb-1.5 pt-2 px-2.5">
              <CardTitle className="text-xs flex items-center gap-1">
                <CogIcon className="icon-xs text-muted-foreground" />
                Log Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[140px]">
                <div className="space-y-1">
                  {logSources.map((source) => (
                    <div key={source.id} className="flex items-center justify-between p-1.5 rounded border hover:bg-accent transition-colors">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${source.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-xs">{source.name}</span>
                      </div>
                      <Badge variant="outline" className="badge-compact">
                        {source.count > 1000 ? `${(source.count/1000).toFixed(1)}k` : source.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Compact Recent Alerts */}
          <Card className="card-compact">
            <CardHeader className="pb-1.5 pt-2 px-2.5">
              <CardTitle className="text-xs flex items-center gap-1">
                <ExclamationTriangleIcon className="icon-xs text-amber-500" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1.5">
              <div className="p-1.5 rounded border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                <div className="flex items-start gap-1">
                  <ExclamationTriangleIcon className="icon-xs text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-medium">High memory (85%)</div>
                    <div className="text-xs text-muted-foreground">2m ago</div>
                  </div>
                </div>
              </div>
              
              <div className="p-1.5 rounded border border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
                <div className="flex items-start gap-1">
                  <CheckCircleIcon className="icon-xs text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-medium">DB restored</div>
                    <div className="text-xs text-muted-foreground">5m ago</div>
                  </div>
                </div>
              </div>
              
              <div className="p-1.5 rounded border">
                <div className="flex items-start gap-1">
                  <ClockIcon className="icon-xs text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-medium">Slow API</div>
                    <div className="text-xs text-muted-foreground">12m ago</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compact Console Settings */}
          <Card className="card-compact">
            <CardHeader className="pb-1.5 pt-2 px-2.5">
              <CardTitle className="text-xs">Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="timestamps" className="text-xs">Timestamps</Label>
                <Switch id="timestamps" defaultChecked className="scale-75" />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="colors" className="text-xs">Colors</Label>
                <Switch id="colors" defaultChecked className="scale-75" />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="wrap" className="text-xs">Wrap</Label>
                <Switch id="wrap" className="scale-75" />
              </div>
              
              <Separator className="my-1.5" />
              
              <div className="space-y-1">
                <Label className="text-xs">Buffer</Label>
                <Select defaultValue="1000">
                  <SelectTrigger className="select-compact w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500" className="text-xs">500</SelectItem>
                    <SelectItem value="1000" className="text-xs">1K</SelectItem>
                    <SelectItem value="5000" className="text-xs">5K</SelectItem>
                    <SelectItem value="unlimited" className="text-xs">Max</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

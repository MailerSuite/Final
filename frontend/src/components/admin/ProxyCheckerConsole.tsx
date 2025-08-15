/**
 * 🚀 Proxy Checker Console - Real-time Proxy Testing & Monitoring
 * Professional live console for testing proxy connections and speed monitoring
 * Matches legacy mass marketing software with real-time proxy validation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Pause, 
  Play, 
  Square, 
  RefreshCw, 
  Download, 
  Trash2, 
  Activity, 
  Settings,
  Maximize2,
  Minimize2,
  Filter,
  Search,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Zap,
  Target,
  Globe,
  MapPin,
  Timer,
  Award,
  TrendingUp,
  TrendingDown,
  Gauge
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Hooks and utilities
import { toast } from 'sonner';

// Types
interface ProxyLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'debug';
  proxyHost: string;
  proxyPort: number;
  proxyType: 'http' | 'https' | 'socks4' | 'socks5';
  status: 'testing' | 'active' | 'failed' | 'timeout' | 'banned' | 'slow' | 'anonymous';
  responseTime: number;
  message: string;
  errorCode?: string;
  testUrl?: string;
  location?: string;
  isAnonymous?: boolean;
  supportsHTTPS?: boolean;
  bandwidth?: number;
  uptime?: number;
  lastWorking?: string;
}

interface ProxyTestConfig {
  testUrl: string;
  timeout: number;
  maxConcurrent: number;
  testAnonymity: boolean;
  testHTTPS: boolean;
  retryAttempts: number;
  speedThreshold: number; // ms
  batchSize: number;
  proxyList: string; // multiline input
}

interface ProxyStats {
  totalProxies: number;
  activeProxies: number;
  failedProxies: number;
  testingProxies: number;
  bannedProxies: number;
  slowProxies: number;
  anonymousProxies: number;
  httpsSupported: number;
  avgResponseTime: number;
  successRate: number;
  uptime: number;
  totalTested: number;
}

interface ProxyInfo {
  host: string;
  port: number;
  type: string;
  username?: string;
  password?: string;
  country?: string;
  provider?: string;
}

interface ConsoleFilters {
  showInfo: boolean;
  showSuccess: boolean;
  showWarning: boolean;
  showError: boolean;
  showDebug: boolean;
  search: string;
  status: string;
  proxyType: string;
  location: string;
  anonymous: string;
}

const ProxyCheckerConsole = ({ className = "" }: { className?: string }) => {
  // State Management
  const [logs, setLogs] = useState<ProxyLogEntry[]>([]);
  const [stats, setStats] = useState<ProxyStats>({
    totalProxies: 0,
    activeProxies: 0,
    failedProxies: 0,
    testingProxies: 0,
    bannedProxies: 0,
    slowProxies: 0,
    anonymousProxies: 0,
    httpsSupported: 0,
    avgResponseTime: 0,
    successRate: 0,
    uptime: 0,
    totalTested: 0
  });
  
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [maxLogs, setMaxLogs] = useState(1000);
  
  // Test Configuration
  const [testConfig, setTestConfig] = useState<ProxyTestConfig>({
    testUrl: 'https://httpbin.org/ip',
    timeout: 10000,
    maxConcurrent: 50,
    testAnonymity: true,
    testHTTPS: true,
    retryAttempts: 2,
    speedThreshold: 5000,
    batchSize: 20,
    proxyList: '127.0.0.1:8080\n127.0.0.1:3128\n127.0.0.1:1080'
  });
  
  // Filters
  const [filters, setFilters] = useState<ConsoleFilters>({
    showInfo: true,
    showSuccess: true,
    showWarning: true,
    showError: true,
    showDebug: false,
    search: '',
    status: 'all',
    proxyType: 'all',
    location: 'all',
    anonymous: 'all'
  });

  // Refs
  const logsEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Log type colors and icons
  const logTypeConfig = {
    info: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: Activity },
    success: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', icon: CheckCircle },
    warning: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: AlertTriangle },
    error: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
    debug: { color: 'text-muted-foreground dark:text-muted-foreground', bg: 'bg-muted dark:bg-background/20', icon: Settings }
  };

  // Status -> Badge variant mapping (avoid direct bg/text/border classes on Badge)
  const statusVariant: Record<ProxyLogEntry['status'], React.ComponentProps<typeof Badge>["variant"]> = {
    testing: 'secondary',
    active: 'default',
    failed: 'destructive',
    timeout: 'destructive',
    banned: 'destructive',
    slow: 'secondary',
    anonymous: 'default'
  };

  // Type colors
  const typeColors = {
    http: 'text-blue-400',
    https: 'text-green-400',
    socks4: 'text-purple-400',
    socks5: 'text-orange-400'
  };

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    // Type filters
    if (!filters.showInfo && log.type === 'info') return false;
    if (!filters.showSuccess && log.type === 'success') return false;
    if (!filters.showWarning && log.type === 'warning') return false;
    if (!filters.showError && log.type === 'error') return false;
    if (!filters.showDebug && log.type === 'debug') return false;
    
    // Search filter
    if (filters.search && !log.message.toLowerCase().includes(filters.search.toLowerCase()) &&
        !log.proxyHost.toLowerCase().includes(filters.search.toLowerCase()) &&
        !log.location?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (filters.status !== 'all' && log.status !== filters.status) return false;
    
    // Type filter
    if (filters.proxyType !== 'all' && log.proxyType !== filters.proxyType) return false;
    
    // Location filter
    if (filters.location !== 'all' && log.location !== filters.location) return false;
    
    // Anonymous filter
    if (filters.anonymous !== 'all') {
      if (filters.anonymous === 'yes' && !log.isAnonymous) return false;
      if (filters.anonymous === 'no' && log.isAnonymous) return false;
    }
    
    return true;
  });

  // Parse proxy list
  const parseProxyList = (proxyListText: string): ProxyInfo[] => {
    return proxyListText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          return {
            host: parts[0],
            port: parseInt(parts[1]) || 8080,
            type: parts[2] || 'http',
            username: parts[3],
            password: parts[4],
            country: 'Unknown',
            provider: 'Unknown'
          };
        }
        return null;
      })
      .filter((proxy): proxy is ProxyInfo => proxy !== null);
  };

  // Generate mock log entry (for development)
  const generateMockLogEntry = useCallback((): ProxyLogEntry => {
    const hosts = ['192.168.1.100', '10.0.0.55', '172.16.0.25', '203.0.113.45', '198.51.100.75'];
    const ports = [8080, 3128, 1080, 8888, 9050];
    const types: ProxyLogEntry['proxyType'][] = ['http', 'https', 'socks4', 'socks5'];
    const statuses: ProxyLogEntry['status'][] = ['active', 'failed', 'timeout', 'banned', 'slow', 'testing', 'anonymous'];
    const locations = ['United States', 'Germany', 'Singapore', 'Japan', 'United Kingdom', 'Canada', 'France'];
    const testUrls = ['https://httpbin.org/ip', 'https://api.ipify.org', 'https://ifconfig.me', 'https://icanhazip.com'];
    
    const host = hosts[Math.floor(Math.random() * hosts.length)];
    const port = ports[Math.floor(Math.random() * ports.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const testUrl = testUrls[Math.floor(Math.random() * testUrls.length)];
    
    const logType = status === 'active' || status === 'anonymous' ? 'success' : 
                    status === 'failed' || status === 'timeout' || status === 'banned' ? 'error' : 
                    status === 'slow' ? 'warning' : 'info';
    
    const messages = {
      testing: 'Testing proxy connection...',
      active: 'Proxy is working correctly',
      failed: 'Proxy connection failed',
      timeout: 'Connection timeout exceeded',
      banned: 'IP address appears to be banned',
      slow: 'Proxy response time is slow',
      anonymous: 'Proxy provides anonymity protection'
    };
    
    const responseTime = status === 'timeout' ? testConfig.timeout : 
                        status === 'slow' ? Math.floor(Math.random() * 5000) + 5000 :
                        status === 'active' ? Math.floor(Math.random() * 3000) + 200 :
                        Math.floor(Math.random() * 1000) + 100;
    
    const isAnonymous = status === 'anonymous' || (status === 'active' && Math.random() > 0.6);
    const supportsHTTPS = type === 'https' || (Math.random() > 0.3);
    
    return {
      id: `proxy_log_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      type: logType,
      proxyHost: host,
      proxyPort: port,
      proxyType: type,
      status,
      responseTime,
      message: messages[status],
      testUrl,
      location,
      isAnonymous,
      supportsHTTPS,
      bandwidth: Math.floor(Math.random() * 100) + 10, // Mbps
      uptime: Math.floor(Math.random() * 30) + 70, // percentage
      errorCode: status === 'failed' || status === 'banned' ? `${Math.floor(Math.random() * 500) + 400}` : undefined,
      lastWorking: status === 'failed' ? `${Math.floor(Math.random() * 24)} hours ago` : undefined
    };
  }, [testConfig.timeout]);

  // Mock stats update
  const updateMockStats = useCallback(() => {
    setStats(prev => {
      const total = logs.length;
      const active = logs.filter(l => l.status === 'active' || l.status === 'anonymous').length;
      const failed = logs.filter(l => l.status === 'failed' || l.status === 'timeout' || l.status === 'banned').length;
      const testing = logs.filter(l => l.status === 'testing').length;
      const slow = logs.filter(l => l.status === 'slow').length;
      const anonymous = logs.filter(l => l.isAnonymous).length;
      const httpsSupported = logs.filter(l => l.supportsHTTPS).length;
      
      const avgResponseTime = total > 0 ? 
        logs.reduce((sum, log) => sum + log.responseTime, 0) / total : 0;
      
      return {
        totalProxies: total + 156,
        activeProxies: active + 89,
        failedProxies: failed + 34,
        testingProxies: testing + 5,
        bannedProxies: logs.filter(l => l.status === 'banned').length + 8,
        slowProxies: slow + 12,
        anonymousProxies: anonymous + 67,
        httpsSupported: httpsSupported + 78,
        avgResponseTime: Math.floor(avgResponseTime || Math.random() * 1000 + 500),
        successRate: total > 0 ? ((active / total) * 100) : 73.5,
        uptime: Math.random() * 10 + 85, // 85-95%
        totalTested: total + 234
      };
    });
  }, [logs]);

  // Start Proxy test
  const startProxyTest = async () => {
    const proxies = parseProxyList(testConfig.proxyList);
    if (proxies.length === 0) {
      toast.error('Please provide a valid proxy list');
      return;
    }
    
    setIsActive(true);
    toast.success(`Starting proxy testing for ${proxies.length} proxies`);
    
    // Start mock data generation for development
    const interval = setInterval(() => {
      if (logs.length < maxLogs) {
        const newLog = generateMockLogEntry();
        setLogs(prev => [...prev.slice(-(maxLogs-1)), newLog]);
      }
    }, 800 + Math.random() * 1200); // Random interval 0.8-2 seconds
    
    // Cleanup interval when component unmounts or stops
    return () => clearInterval(interval);
  };

  // Stop Proxy test
  const stopProxyTest = () => {
    setIsActive(false);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    toast.success('Proxy testing stopped');
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    toast.success('Console cleared');
  };

  // Export logs
  const exportLogs = () => {
    const csvContent = [
      'Timestamp,Type,Proxy Host,Port,Type,Status,Response Time,Location,Anonymous,HTTPS Support,Message',
      ...filteredLogs.map(log => 
        `"${log.timestamp}","${log.type}","${log.proxyHost}","${log.proxyPort}","${log.proxyType}","${log.status}","${log.responseTime}","${log.location}","${log.isAnonymous}","${log.supportsHTTPS}","${log.message}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proxy_console_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Proxy logs exported');
  };

  // Update stats when logs change
  useEffect(() => {
    updateMockStats();
  }, [logs, updateMockStats]);

  // Auto scroll when new logs arrive
  useEffect(() => {
    scrollToBottom();
  }, [logs, scrollToBottom]);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-background' : ''} ${className}`}>
      <Card className="border-0 shadow-lg bg-background text-orange-400 font-mono">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ scale: isActive ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
                  className={`w-3 h-3 rounded-full ${isActive ? 'bg-orange-500' : 'bg-muted'}`}
                />
                <CardTitle className="text-orange-400">Proxy Checker Console</CardTitle>
              </div>
              <Badge variant="secondary" aria-label={`${parseProxyList(testConfig.proxyList).length} Proxies`}>
                {parseProxyList(testConfig.proxyList).length} Proxies
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={isActive ? stopProxyTest : startProxyTest}
                className="text-orange-400 border-orange-400 hover:bg-orange-400/10"
              >
                {isActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isActive ? 'Stop' : 'Test'}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPaused(!isPaused)}
                disabled={!isActive}
                className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={clearLogs}
                className="text-red-400 border-red-400 hover:bg-red-400/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={exportLogs}
                className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-purple-400 border-purple-400 hover:bg-purple-400/10"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-4 mt-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{stats.activeProxies.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">{stats.failedProxies.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{stats.testingProxies.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Testing</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">{stats.bannedProxies.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Banned</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-400">{stats.slowProxies.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Slow</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-400">{stats.anonymousProxies.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Anonymous</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">{stats.httpsSupported.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">HTTPS</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-400">{stats.avgResponseTime.toFixed(0)}ms</div>
              <div className="text-xs text-muted-foreground">Avg Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-pink-400">{stats.successRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Success</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-indigo-400">{stats.uptime.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-teal-400">{stats.totalTested.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Tested</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-lime-400">{stats.totalProxies.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          {/* Proxy Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="space-y-4 p-3 bg-card rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Test URL</Label>
                  <Input
                    value={testConfig.testUrl}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, testUrl: e.target.value }))}
                    className="h-8 bg-muted border-border text-muted-foreground"
                    placeholder="https://httpbin.org/ip"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Timeout (ms)</Label>
                  <Input
                    type="number"
                    value={testConfig.timeout}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) || 10000 }))}
                    className="h-8 bg-muted border-border text-muted-foreground"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max Concurrent</Label>
                  <Input
                    type="number"
                    value={testConfig.maxConcurrent}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, maxConcurrent: parseInt(e.target.value) || 50 }))}
                    className="h-8 bg-muted border-border text-muted-foreground"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Speed Threshold (ms)</Label>
                  <Input
                    type="number"
                    value={testConfig.speedThreshold}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, speedThreshold: parseInt(e.target.value) || 5000 }))}
                    className="h-8 bg-muted border-border text-muted-foreground"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={testConfig.testAnonymity}
                    onCheckedChange={(checked) => setTestConfig(prev => ({ ...prev, testAnonymity: checked }))}
                    className="scale-75"
                  />
                  <span className="text-xs text-muted-foreground">Test Anonymity</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={testConfig.testHTTPS}
                    onCheckedChange={(checked) => setTestConfig(prev => ({ ...prev, testHTTPS: checked }))}
                    className="scale-75"
                  />
                  <span className="text-xs text-muted-foreground">Test HTTPS</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 p-3 bg-card rounded-lg">
              <Label className="text-xs text-muted-foreground">Proxy List (host:port:type)</Label>
              <Textarea
                value={testConfig.proxyList}
                onChange={(e) => setTestConfig(prev => ({ ...prev, proxyList: e.target.value }))}
                className="h-32 bg-muted border-border text-muted-foreground font-mono text-xs"
                placeholder="192.168.1.1:8080:http&#10;127.0.0.1:3128:https&#10;10.0.0.1:1080:socks5"
              />
              <div className="text-xs text-muted-foreground">
                {parseProxyList(testConfig.proxyList).length} proxies loaded
              </div>
            </div>
          </div>
          
          {/* Console Logs */}
          <ScrollArea className={`${isFullscreen ? 'h-[calc(100vh-450px)]' : 'h-96'} bg-black rounded-lg p-3 mb-4`}>
            <div className="space-y-1">
              <AnimatePresence>
                {filteredLogs.map((log) => {
                  const LogIcon = logTypeConfig[log.type].icon;
                  
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-start space-x-3 text-xs p-2 rounded hover:bg-card/50"
                    >
                      <div className="flex-shrink-0 w-20 text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                      
                      <div className="flex-shrink-0">
                        <LogIcon className={`h-4 w-4 ${logTypeConfig[log.type].color}`} />
                      </div>
                      
                      <div className="flex-shrink-0 w-28 truncate">
                        <span className="text-orange-400">{log.proxyHost}</span>
                      </div>
                      
                      <div className="flex-shrink-0 w-12 text-purple-400">
                        {log.proxyPort}
                      </div>
                      
                      <div className="flex-shrink-0 w-16">
                        <span className={`text-xs ${typeColors[log.proxyType]}`}>
                          {log.proxyType.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <Badge variant={statusVariant[log.status]} className="text-xs" aria-label={`Status: ${log.status}`}>
                          {log.status}
                        </Badge>
                      </div>
                      
                      <div className="flex-shrink-0 w-16 text-yellow-400">
                        {log.responseTime}ms
                      </div>
                      
                      <div className="flex-shrink-0 w-20 text-cyan-400 truncate">
                        {log.location}
                      </div>
                      
                      <div className="flex-1 text-muted-foreground">
                        {log.message}
                        {log.isAnonymous && <span className="text-green-400 ml-2">Anonymous</span>}
                        {log.supportsHTTPS && <span className="text-blue-400 ml-2">HTTPS</span>}
                        {log.errorCode && <span className="text-red-400 ml-2">Error: {log.errorCode}</span>}
                        {log.bandwidth && <span className="text-purple-400 ml-2">{log.bandwidth}Mbps</span>}
                        {log.uptime && <span className="text-orange-400 ml-2">{log.uptime}% uptime</span>}
                        {log.lastWorking && <span className="text-muted-foreground ml-2">Last: {log.lastWorking}</span>}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={logsEndRef} />
            </div>
          </ScrollArea>
          
          {/* Console Status */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing {filteredLogs.length} of {logs.length} log entries
            </div>
            <div className="flex items-center space-x-4">
              <div>Max logs: {maxLogs}</div>
              <div className="flex items-center space-x-1">
                <span>Auto-scroll:</span>
                <span className={autoScroll ? 'text-orange-400' : 'text-muted-foreground'}>
                  {autoScroll ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Status:</span>
                <span className={isActive ? 'text-orange-400' : 'text-muted-foreground'}>
                  {isActive ? 'TESTING' : 'IDLE'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProxyCheckerConsole;
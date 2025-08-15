/**
 * 🚀 SMTP Checker Console - Real-time SMTP Server Testing & Monitoring
 * Professional live console for testing SMTP connections and authentication
 * Matches legacy mass marketing software with real-time connection diagnostics
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Server, 
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
  Shield,
  Key,
  Wifi,
  WifiOff,
  Zap,
  Target,
  TestTube
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from '@/components/ui/label';

// Hooks and utilities
import axiosInstance from '@/http/axios';
import { toast } from 'sonner';

// Types
interface SMTPLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'debug';
  server: string;
  port: number;
  username: string;
  status: 'connecting' | 'connected' | 'authenticating' | 'authenticated' | 'testing' | 'success' | 'failed' | 'timeout';
  responseTime: number;
  message: string;
  errorCode?: string;
  smtpResponse?: string;
  tlsStatus?: 'enabled' | 'disabled' | 'failed';
  authMethod?: 'plain' | 'login' | 'oauth2' | 'none';
  step: 'connection' | 'ehlo' | 'starttls' | 'auth' | 'mail_from' | 'rcpt_to' | 'data' | 'quit';
}

interface SMTPTestConfig {
  server: string;
  port: number;
  username: string;
  password: string;
  useTLS: boolean;
  useAuth: boolean;
  fromEmail: string;
  toEmail: string;
  timeout: number;
}

interface SMTPStats {
  totalTests: number;
  successful: number;
  failed: number;
  inProgress: number;
  avgResponseTime: number;
  successRate: number;
  upServers: number;
  downServers: number;
  tlsSupported: number;
  authSuccess: number;
}

interface ConsoleFilters {
  showInfo: boolean;
  showSuccess: boolean;
  showWarning: boolean;
  showError: boolean;
  showDebug: boolean;
  search: string;
  status: string;
  server: string;
  step: string;
}

const SMTPCheckerConsole = ({ className = "" }: { className?: string }) => {
  // State Management
  const [logs, setLogs] = useState<SMTPLogEntry[]>([]);
  const [stats, setStats] = useState<SMTPStats>({
    totalTests: 0,
    successful: 0,
    failed: 0,
    inProgress: 0,
    avgResponseTime: 0,
    successRate: 0,
    upServers: 0,
    downServers: 0,
    tlsSupported: 0,
    authSuccess: 0
  });
  
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [maxLogs, setMaxLogs] = useState(1000);
  
  // Test Configuration
  const [testConfig, setTestConfig] = useState<SMTPTestConfig>({
    server: 'smtp.gmail.com',
    port: 587,
    username: '',
    password: '',
    useTLS: true,
    useAuth: true,
    fromEmail: 'test@example.com',
    toEmail: 'test@example.com',
    timeout: 30000
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
    server: 'all',
    step: 'all'
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
  const statusVariant: Record<SMTPLogEntry['status'], React.ComponentProps<typeof Badge>["variant"]> = {
    connecting: 'secondary',
    connected: 'default',
    authenticating: 'secondary',
    authenticated: 'default',
    testing: 'secondary',
    success: 'default',
    failed: 'destructive',
    timeout: 'destructive'
  };

  // Step colors
  const stepColors = {
    connection: 'text-blue-400',
    ehlo: 'text-cyan-400',
    starttls: 'text-purple-400',
    auth: 'text-yellow-400',
    mail_from: 'text-green-400',
    rcpt_to: 'text-indigo-400',
    data: 'text-pink-400',
    quit: 'text-muted-foreground'
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
        !log.server.toLowerCase().includes(filters.search.toLowerCase()) &&
        !log.username.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (filters.status !== 'all' && log.status !== filters.status) return false;
    
    // Server filter
    if (filters.server !== 'all' && log.server !== filters.server) return false;
    
    // Step filter
    if (filters.step !== 'all' && log.step !== filters.step) return false;
    
    return true;
  });

  // Generate mock log entry (for development)
  const generateMockLogEntry = useCallback((): SMTPLogEntry => {
    const servers = ['smtp.gmail.com', 'smtp.outlook.com', 'smtp.yahoo.com', 'smtp.sendgrid.net', 'smtp.mailgun.org'];
    const usernames = ['user1@gmail.com', 'user2@outlook.com', 'user3@yahoo.com', 'api_key', 'mailgun_user'];
    const statuses: SMTPLogEntry['status'][] = ['success', 'failed', 'timeout', 'connecting', 'authenticated'];
    const steps: SMTPLogEntry['step'][] = ['connection', 'ehlo', 'starttls', 'auth', 'mail_from', 'rcpt_to', 'data', 'quit'];
    const authMethods: SMTPLogEntry['authMethod'][] = ['plain', 'login', 'oauth2', 'none'];
    
    const server = servers[Math.floor(Math.random() * servers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const step = steps[Math.floor(Math.random() * steps.length)];
    const type = status === 'success' || status === 'authenticated' ? 'success' : 
                 status === 'failed' || status === 'timeout' ? 'error' : 'info';
    
    const port = server.includes('gmail') ? 587 : server.includes('outlook') ? 587 : 
                 server.includes('yahoo') ? 587 : server.includes('sendgrid') ? 587 : 2525;
    
    const messages = {
      connection: status === 'success' ? 'TCP connection established successfully' : 'Failed to establish TCP connection',
      ehlo: status === 'success' ? 'EHLO command successful, server capabilities received' : 'EHLO command failed',
      starttls: status === 'success' ? 'STARTTLS negotiation successful, connection secured' : 'STARTTLS failed',
      auth: status === 'success' ? 'Authentication successful' : 'Authentication failed - invalid credentials',
      mail_from: status === 'success' ? 'MAIL FROM command accepted' : 'MAIL FROM command rejected',
      rcpt_to: status === 'success' ? 'RCPT TO command accepted' : 'RCPT TO command rejected',
      data: status === 'success' ? 'DATA command successful, message accepted' : 'DATA command failed',
      quit: 'QUIT command sent, connection closed gracefully'
    };
    
    return {
      id: `smtp_log_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      type,
      server,
      port,
      username: usernames[Math.floor(Math.random() * usernames.length)],
      status,
      responseTime: Math.floor(Math.random() * 5000) + 100,
      message: messages[step],
      step,
      errorCode: status === 'failed' ? `${Math.floor(Math.random() * 500) + 500}` : undefined,
      smtpResponse: status === 'success' ? '250 OK' : status === 'failed' ? '535 Authentication failed' : undefined,
      tlsStatus: Math.random() > 0.2 ? 'enabled' : 'disabled',
      authMethod: authMethods[Math.floor(Math.random() * authMethods.length)]
    };
  }, []);

  // Mock stats update
  const updateMockStats = useCallback(() => {
    setStats(prev => {
      const total = logs.length;
      const successful = logs.filter(l => l.status === 'success' || l.status === 'authenticated').length;
      const failed = logs.filter(l => l.status === 'failed' || l.status === 'timeout').length;
      const inProgress = logs.filter(l => l.status === 'connecting' || l.status === 'authenticating' || l.status === 'testing').length;
      
      return {
        totalTests: total + 250,
        successful: successful + 180,
        failed: failed + 25,
        inProgress: inProgress + 3,
        avgResponseTime: Math.floor(Math.random() * 1000) + 500,
        successRate: total > 0 ? ((successful / total) * 100) : 87.5,
        upServers: 12,
        downServers: 2,
        tlsSupported: 11,
        authSuccess: successful + 175
      };
    });
  }, [logs]);

  // Start SMTP test
  const startSMTPTest = async () => {
    if (!testConfig.server || !testConfig.username) {
      toast.error('Please configure SMTP server and username');
      return;
    }
    
    setIsActive(true);
    toast.success('SMTP testing started');
    
    // Start mock data generation for development
    const interval = setInterval(() => {
      if (logs.length < maxLogs) {
        const newLog = generateMockLogEntry();
        setLogs(prev => [...prev.slice(-(maxLogs-1)), newLog]);
      }
    }, 1000 + Math.random() * 2000); // Random interval 1-3 seconds
    
    // Cleanup interval when component unmounts or stops
    return () => clearInterval(interval);
  };

  // Stop SMTP test
  const stopSMTPTest = () => {
    setIsActive(false);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    toast.success('SMTP testing stopped');
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    toast.success('Console cleared');
  };

  // Export logs
  const exportLogs = () => {
    const csvContent = [
      'Timestamp,Type,Server,Port,Username,Status,Response Time,Step,Message,TLS,Auth Method',
      ...filteredLogs.map(log => 
        `"${log.timestamp}","${log.type}","${log.server}","${log.port}","${log.username}","${log.status}","${log.responseTime}","${log.step}","${log.message}","${log.tlsStatus}","${log.authMethod}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smtp_console_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('SMTP logs exported');
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
      <Card className="border-0 shadow-lg bg-background text-cyan-400 font-mono">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ scale: isActive ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
                  className={`w-3 h-3 rounded-full ${isActive ? 'bg-cyan-500' : 'bg-muted'}`}
                />
                <CardTitle className="text-cyan-400">SMTP Checker Console</CardTitle>
              </div>
              <Badge variant="secondary" aria-label={`Server: ${testConfig.server}:${testConfig.port}`}>
                Server: {testConfig.server}:{testConfig.port}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={isActive ? stopSMTPTest : startSMTPTest}
                className="text-cyan-400 border-cyan-400 hover:bg-cyan-400/10"
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
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4 mt-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{stats.successful.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Success</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">{stats.failed.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{stats.inProgress.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Testing</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">{stats.successRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-400">{stats.avgResponseTime}ms</div>
              <div className="text-xs text-muted-foreground">Avg Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-400">{stats.upServers}</div>
              <div className="text-xs text-muted-foreground">Up</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-400">{stats.downServers}</div>
              <div className="text-xs text-muted-foreground">Down</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-indigo-400">{stats.tlsSupported}</div>
              <div className="text-xs text-muted-foreground">TLS</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-pink-400">{stats.authSuccess}</div>
              <div className="text-xs text-muted-foreground">Auth OK</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">{stats.totalTests}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          {/* SMTP Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4 p-3 bg-card rounded-lg">
            <div>
              <Label className="text-xs text-muted-foreground">Server</Label>
              <Input
                value={testConfig.server}
                onChange={(e) => setTestConfig(prev => ({ ...prev, server: e.target.value }))}
                className="h-8 bg-muted border-border text-muted-foreground"
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Port</Label>
              <Input
                type="number"
                value={testConfig.port}
                onChange={(e) => setTestConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
                className="h-8 bg-muted border-border text-muted-foreground"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Username</Label>
              <Input
                value={testConfig.username}
                onChange={(e) => setTestConfig(prev => ({ ...prev, username: e.target.value }))}
                className="h-8 bg-muted border-border text-muted-foreground"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Password</Label>
              <Input
                type="password"
                value={testConfig.password}
                onChange={(e) => setTestConfig(prev => ({ ...prev, password: e.target.value }))}
                className="h-8 bg-muted border-border text-muted-foreground"
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center space-x-2 pt-4">
              <Switch
                checked={testConfig.useTLS}
                onCheckedChange={(checked) => setTestConfig(prev => ({ ...prev, useTLS: checked }))}
                className="scale-75"
              />
              <span className="text-xs text-muted-foreground">TLS</span>
            </div>
            <div className="flex items-center space-x-2 pt-4">
              <Switch
                checked={testConfig.useAuth}
                onCheckedChange={(checked) => setTestConfig(prev => ({ ...prev, useAuth: checked }))}
                className="scale-75"
              />
              <span className="text-xs text-muted-foreground">Auth</span>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-card rounded-lg">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={filters.showInfo}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showInfo: checked }))}
                className="scale-75"
              />
              <span className="text-xs text-blue-400">Info</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={filters.showSuccess}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showSuccess: checked }))}
                className="scale-75"
              />
              <span className="text-xs text-green-400">Success</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={filters.showError}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showError: checked }))}
                className="scale-75"
              />
              <span className="text-xs text-red-400">Error</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-40 h-8 bg-muted border-border text-muted-foreground placeholder-gray-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAutoScroll(!autoScroll)}
                className={`h-8 ${autoScroll ? 'text-cyan-400 border-cyan-400' : 'text-muted-foreground border-border'}`}
              >
                {autoScroll ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Auto
              </Button>
            </div>
          </div>
          
          {/* Console Logs */}
          <ScrollArea className={`${isFullscreen ? 'h-[calc(100vh-350px)]' : 'h-96'} bg-black rounded-lg p-3`}>
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
                      
                      <div className="flex-shrink-0 w-24 truncate">
                        <span className="text-cyan-400">{log.server}</span>
                      </div>
                      
                      <div className="flex-shrink-0 w-12 text-purple-400">
                        {log.port}
                      </div>
                      
                      <div className="flex-shrink-0 w-32 truncate">
                        <span className="text-yellow-400">{log.username}</span>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <Badge variant={statusVariant[log.status]} className="text-xs" aria-label={`Status: ${log.status}`}>
                          {log.status}
                        </Badge>
                      </div>
                      
                      <div className="flex-shrink-0 w-16 text-orange-400">
                        {log.responseTime}ms
                      </div>
                      
                      <div className="flex-shrink-0 w-20">
                        <span className={`text-xs ${stepColors[log.step]}`}>
                          {log.step.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-1 text-muted-foreground">
                        {log.message}
                        {log.smtpResponse && <span className="text-green-400 ml-2">{log.smtpResponse}</span>}
                        {log.errorCode && <span className="text-red-400 ml-2">Error: {log.errorCode}</span>}
                        {log.tlsStatus && <span className="text-purple-400 ml-2">TLS: {log.tlsStatus}</span>}
                        {log.authMethod && <span className="text-blue-400 ml-2">Auth: {log.authMethod}</span>}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={logsEndRef} />
            </div>
          </ScrollArea>
          
          {/* Console Status */}
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <div>
              Showing {filteredLogs.length} of {logs.length} log entries
            </div>
            <div className="flex items-center space-x-4">
              <div>Max logs: {maxLogs}</div>
              <div className="flex items-center space-x-1">
                <span>Auto-scroll:</span>
                <span className={autoScroll ? 'text-cyan-400' : 'text-muted-foreground'}>
                  {autoScroll ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Status:</span>
                <span className={isActive ? 'text-cyan-400' : 'text-muted-foreground'}>
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

export default SMTPCheckerConsole;
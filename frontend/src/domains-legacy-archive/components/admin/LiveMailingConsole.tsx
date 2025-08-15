/**
 * 🚀 Live Mailing Console - Real-time Email Campaign Monitoring
 * Professional live console for monitoring email sending progress and delivery status
 * Matches legacy mass marketing software with real-time logs and performance metrics
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Send, 
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
  Target, 
  TrendingUp, 
  Settings,
  Maximize2,
  Minimize2,
  Filter,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";

// Hooks and utilities
import { toast } from 'sonner';

// Types
interface MailingLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'debug';
  recipient: string;
  subject: string;
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'spam';
  smtpServer: string;
  responseTime: number;
  message: string;
  messageId?: string;
  deliveryTime?: string;
  errorCode?: string;
  retryCount?: number;
}

interface MailingStats {
  totalEmails: number;
  sent: number;
  delivered: number;
  failed: number;
  queued: number;
  sending: number;
  bounced: number;
  spam: number;
  avgResponseTime: number;
  successRate: number;
  currentSpeed: number; // emails per minute
  estimatedCompletion: string;
}

interface ConsoleFilters {
  showInfo: boolean;
  showSuccess: boolean;
  showWarning: boolean;
  showError: boolean;
  showDebug: boolean;
  search: string;
  status: string;
  smtpServer: string;
}

const LiveMailingConsole = ({ campaignId, className = "" }: { campaignId?: string; className?: string }) => {
  // State Management
  const [logs, setLogs] = useState<MailingLogEntry[]>([]);
  const [stats, setStats] = useState<MailingStats>({
    totalEmails: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    queued: 0,
    sending: 0,
    bounced: 0,
    spam: 0,
    avgResponseTime: 0,
    successRate: 0,
    currentSpeed: 0,
    estimatedCompletion: '--'
  });
  
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [maxLogs, setMaxLogs] = useState(1000);
  
  // Filters
  const [filters, setFilters] = useState<ConsoleFilters>({
    showInfo: true,
    showSuccess: true,
    showWarning: true,
    showError: true,
    showDebug: false,
    search: '',
    status: 'all',
    smtpServer: 'all'
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

  // Status colors
  const statusColors = {
    queued: 'bg-muted text-foreground dark:bg-background/20 dark:text-muted-foreground',
    sending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    sent: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    bounced: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    spam: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
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
        !log.recipient.toLowerCase().includes(filters.search.toLowerCase()) &&
        !log.subject.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (filters.status !== 'all' && log.status !== filters.status) return false;
    
    // SMTP server filter
    if (filters.smtpServer !== 'all' && log.smtpServer !== filters.smtpServer) return false;
    
    return true;
  });

  // Generate mock log entry (for development)
  const generateMockLogEntry = useCallback((): MailingLogEntry => {
    const recipients = ['user1@example.com', 'user2@gmail.com', 'user3@yahoo.com', 'user4@outlook.com'];
    const subjects = ['Welcome to our service!', 'Your weekly newsletter', 'Important account update', 'Special offer inside'];
    const smtpServers = ['smtp.gmail.com', 'smtp.sendgrid.net', 'smtp.mailgun.org', 'smtp.amazon.com'];
    const statuses: MailingLogEntry['status'][] = ['sent', 'delivered', 'failed', 'bounced', 'sending'];
    const types: MailingLogEntry['type'][] = ['info', 'success', 'warning', 'error'];
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const type = status === 'sent' || status === 'delivered' ? 'success' : 
                 status === 'failed' || status === 'bounced' ? 'error' : 'info';
    
    return {
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      type,
      recipient: recipients[Math.floor(Math.random() * recipients.length)],
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      status,
      smtpServer: smtpServers[Math.floor(Math.random() * smtpServers.length)],
      responseTime: Math.floor(Math.random() * 2000) + 200,
      message: status === 'sent' ? 'Email sent successfully' : 
               status === 'delivered' ? 'Email delivered to recipient' :
               status === 'failed' ? 'SMTP authentication failed' :
               status === 'bounced' ? 'Recipient email address invalid' : 'Preparing email for delivery',
      messageId: status === 'sent' || status === 'delivered' ? `msg_${Math.random().toString(36).substr(2, 9)}` : undefined,
      retryCount: status === 'failed' ? Math.floor(Math.random() * 3) : undefined
    };
  }, []);

  // Mock stats update
  const updateMockStats = useCallback(() => {
    setStats(prev => {
      const total = logs.length;
      const sent = logs.filter(l => l.status === 'sent' || l.status === 'delivered').length;
      const failed = logs.filter(l => l.status === 'failed' || l.status === 'bounced').length;
      const queued = logs.filter(l => l.status === 'queued').length;
      const sending = logs.filter(l => l.status === 'sending').length;
      
      return {
        totalEmails: total + 5000, // Simulate large campaign
        sent: sent + 3200,
        delivered: sent + 2980,
        failed: failed + 45,
        queued: Math.max(0, 1755 - total),
        sending: sending + 12,
        bounced: Math.floor(failed * 0.6),
        spam: Math.floor(failed * 0.1),
        avgResponseTime: Math.floor(Math.random() * 500) + 300,
        successRate: total > 0 ? ((sent / total) * 100) : 95.2,
        currentSpeed: Math.floor(Math.random() * 20) + 40, // 40-60 emails per minute
        estimatedCompletion: '15:30:00'
      };
    });
  }, [logs]);

  // Start/Stop console
  const toggleConsole = async () => {
    if (isActive) {
      // Stop console
      setIsActive(false);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      toast.success('Live console stopped');
    } else {
      // Start console
      setIsActive(true);
      toast.success('Live console started');
      
      // Start mock data generation for development
      const interval = setInterval(() => {
        if (logs.length < maxLogs) {
          const newLog = generateMockLogEntry();
          setLogs(prev => [...prev.slice(-(maxLogs-1)), newLog]);
        }
      }, 1500 + Math.random() * 2000); // Random interval 1.5-3.5 seconds
      
      // Cleanup interval when component unmounts or stops
      return () => clearInterval(interval);
    }
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    toast.success('Console cleared');
  };

  // Export logs
  const exportLogs = () => {
    const csvContent = [
      'Timestamp,Type,Recipient,Subject,Status,SMTP Server,Response Time,Message',
      ...filteredLogs.map(log => 
        `"${log.timestamp}","${log.type}","${log.recipient}","${log.subject}","${log.status}","${log.smtpServer}","${log.responseTime}","${log.message}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mailing_console_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Console logs exported');
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
      <Card className="border-0 shadow-lg bg-background text-green-400 font-mono">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ scale: isActive ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
                  className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-muted'}`}
                />
                <CardTitle className="text-green-400">Live Mailing Console</CardTitle>
              </div>
              {campaignId && (
                <Badge variant="outline" className="text-green-400 border-green-400">
                  Campaign: {campaignId}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={toggleConsole}
                className="text-green-400 border-green-400 hover:bg-green-400/10"
              >
                {isActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isActive ? 'Stop' : 'Start'}
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mt-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{stats.sent.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Sent</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">{stats.delivered.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">{stats.failed.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{stats.queued.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Queued</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-400">{stats.currentSpeed}</div>
              <div className="text-xs text-muted-foreground">Per Min</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">{stats.successRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Success</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-400">{stats.avgResponseTime}ms</div>
              <div className="text-xs text-muted-foreground">Avg Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-400">{stats.estimatedCompletion}</div>
              <div className="text-xs text-muted-foreground">ETA</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Campaign Progress</span>
              <span className="text-green-400">
                {stats.totalEmails > 0 ? Math.round(((stats.sent + stats.failed) / stats.totalEmails) * 100) : 0}%
              </span>
            </div>
            <Progress 
              value={stats.totalEmails > 0 ? ((stats.sent + stats.failed) / stats.totalEmails) * 100 : 0} 
              className="h-2"
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
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
                checked={filters.showWarning}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showWarning: checked }))}
                className="scale-75"
              />
              <span className="text-xs text-yellow-400">Warning</span>
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
                className={`h-8 ${autoScroll ? 'text-green-400 border-green-400' : 'text-muted-foreground border-border'}`}
              >
                {autoScroll ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Auto
              </Button>
            </div>
          </div>
          
          {/* Console Logs */}
          <ScrollArea className={`${isFullscreen ? 'h-[calc(100vh-300px)]' : 'h-96'} bg-black rounded-lg p-3`}>
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
                      
                      <div className="flex-shrink-0 w-32 truncate">
                        <span className="text-cyan-400">{log.recipient}</span>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <Badge className={`text-xs ${statusColors[log.status]}`}>
                          {log.status}
                        </Badge>
                      </div>
                      
                      <div className="flex-shrink-0 w-24 text-purple-400 truncate">
                        {log.smtpServer}
                      </div>
                      
                      <div className="flex-shrink-0 w-16 text-yellow-400">
                        {log.responseTime}ms
                      </div>
                      
                      <div className="flex-1 text-muted-foreground">
                        <span className="text-muted-foreground">[{log.subject}]</span> {log.message}
                        {log.messageId && <span className="text-green-400 ml-2">ID: {log.messageId}</span>}
                        {log.errorCode && <span className="text-red-400 ml-2">Error: {log.errorCode}</span>}
                        {log.retryCount && <span className="text-orange-400 ml-2">Retry: {log.retryCount}</span>}
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
                <span className={autoScroll ? 'text-green-400' : 'text-muted-foreground'}>
                  {autoScroll ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Status:</span>
                <span className={isActive ? 'text-green-400' : 'text-muted-foreground'}>
                  {isActive ? 'RUNNING' : 'STOPPED'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveMailingConsole;
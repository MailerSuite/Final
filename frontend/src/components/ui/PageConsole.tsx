import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  CommandLineIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  ClockIcon,
  BoltIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  WifiIcon
} from '@heroicons/react/24/outline';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'debug';
  message: string;
  details?: any;
  category?: string;
}

interface PageConsoleProps {
  title: string;
  source: string;
  className?: string;
  initialLogs?: LogEntry[];
  onLogAction?: (action: string, data?: any) => void;
  height?: 'sm' | 'md' | 'lg' | 'xl';
  showSearch?: boolean;
  showControls?: boolean;
  autoConnect?: boolean;
  logCategories?: string[];
  defaultCollapsed?: boolean;
  defaultConnected?: boolean;
  showDetails?: boolean;
  maxLogs?: number;
  intervalMs?: number;
}

export const PageConsole: React.FC<PageConsoleProps> = ({
  title,
  source,
  className,
  initialLogs = [],
  onLogAction,
  height = 'md',
  showSearch = true,
  showControls = true,
  autoConnect = true,
  logCategories = [],
  defaultCollapsed = false,
  defaultConnected = undefined,
  showDetails = true,
  maxLogs = 50,
  intervalMs = 5000,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [isConnected, setIsConnected] = useState(
    defaultConnected !== undefined ? defaultConnected : autoConnect
  );
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const heightClasses = {
    sm: 'h-32',
    md: 'h-48',
    lg: 'h-64',
    xl: 'h-80'
  };

  // Generate mock logs based on source type
  const generateMockLog = (category?: string): LogEntry => {
    const levels: LogEntry['level'][] = ['info', 'success', 'warning', 'error', 'debug'];
    
    const messageTemplates = {
      smtp: [
        `${category || 'DELIVERY'}: Email sent successfully to recipient`,
        `${category || 'AUTH'}: SMTP authentication completed`,
        `${category || 'ERROR'}: Connection timeout to mail server`,
        `${category || 'QUEUE'}: Message queued for retry`,
        `${category || 'BOUNCE'}: Bounce notification received`
      ],
      campaigns: [
        `${category || 'LAUNCH'}: Campaign started with 1,${Math.floor(Math.random() * 9 + 1)}00 recipients`,
        `${category || 'METRICS'}: Open rate: ${(Math.random() * 30 + 15).toFixed(1)}%`,
        `${category || 'CLICK'}: Click-through rate: ${(Math.random() * 5 + 1).toFixed(1)}%`,
        `${category || 'UNSUBSCRIBE'}: Unsubscribe rate: ${(Math.random() * 0.5).toFixed(2)}%`,
        `${category || 'A/B'}: Test variant performing ${(Math.random() * 20 + 5).toFixed(0)}% better`
      ],
      analytics: [
        `${category || 'METRICS'}: Real-time data updated`,
        `${category || 'USERS'}: ${Math.floor(Math.random() * 2000 + 500)} active users`,
        `${category || 'REVENUE'}: Today's revenue: $${(Math.random() * 10000 + 1000).toFixed(0)}`,
        `${category || 'API'}: ${Math.floor(Math.random() * 1000)} API calls in last minute`,
        `${category || 'PERFORMANCE'}: Page load time: ${(Math.random() * 2000 + 500).toFixed(0)}ms`
      ],
      proxies: [
        `${category || 'STATUS'}: Proxy ${192 + Math.floor(Math.random() * 60)}.168.1.${Math.floor(Math.random() * 254)} - Online`,
        `${category || 'TEST'}: Connection speed: ${Math.floor(Math.random() * 200 + 50)}ms`,
        `${category || 'ROTATION'}: IP rotated to new location`,
        `${category || 'ERROR'}: Proxy timeout, switching to backup`,
        `${category || 'HEALTH'}: Pool health: ${Math.floor(Math.random() * 30 + 70)}% available`
      ],
      system: [
        `${category || 'SYSTEM'}: CPU usage: ${Math.floor(Math.random() * 50 + 20)}%`,
        `${category || 'MEMORY'}: Memory: ${(Math.random() * 4 + 2).toFixed(1)}GB / 8GB`,
        `${category || 'DATABASE'}: Query executed in ${Math.floor(Math.random() * 100 + 10)}ms`,
        `${category || 'CACHE'}: Cache hit rate: ${Math.floor(Math.random() * 20 + 80)}%`,
        `${category || 'SECURITY'}: Security scan completed successfully`
      ]
    };

    const sourceKey = source.toLowerCase() as keyof typeof messageTemplates;
    const messages = messageTemplates[sourceKey] || messageTemplates.system;
    
    return {
      id: `${source}-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      category: category || 'GENERAL',
      details: Math.random() > 0.8 ? {
        duration: Math.floor(Math.random() * 1000) + 'ms',
        status: Math.random() > 0.5 ? 'success' : 'pending'
      } : undefined
    };
  };

  // Simulate live log updates
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      const shouldAddLog = Math.random() > 0.4;
      if (!shouldAddLog) return;

      const category = logCategories.length > 0 ? 
        logCategories[Math.floor(Math.random() * logCategories.length)] : 
        undefined;

      const newLog = generateMockLog(category);
      setLogs(prev => [...prev.slice(-(maxLogs - 1)), newLog]);

      if (onLogAction) {
        onLogAction('new_log', newLog);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isConnected, source, logCategories, onLogAction, maxLogs, intervalMs]);

  // Auto scroll
  useEffect(() => {
    if (isAutoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [logs, isAutoScroll]);

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return CheckCircleIcon;
      case 'warning': return ExclamationTriangleIcon;
      case 'error': return XCircleIcon;
      case 'debug': return BoltIcon;
      default: return InformationCircleIcon;
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'debug': return 'text-purple-400';
      default: return 'text-blue-400';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      log.category?.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const clearLogs = () => {
    setLogs([]);
    if (onLogAction) onLogAction('clear_logs');
  };

  const exportLogs = () => {
    const logsText = logs.map(log => 
      `${log.timestamp} [${log.level.toUpperCase()}] ${log.category}: ${log.message}`
    ).join('\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${source.toLowerCase()}-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (onLogAction) onLogAction('export_logs', { count: logs.length });
  };

  if (isCollapsed) {
    return (
      <Card className={cn('bg-background/30 backdrop-blur-sm border-blue-500/20', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CommandLineIcon className="w-4 h-4 text-blue-400" />
              <CardTitle className="text-sm text-white">{title}</CardTitle>
              <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
                {logs.length} logs
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(false)}
              className="text-muted-foreground hover:text-white p-1"
            >
              <ChevronDownIcon className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-background/50 backdrop-blur-xl border-blue-500/20', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30">
              <CommandLineIcon className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-sm text-white flex items-center gap-2">
                {title}
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-muted'}`} />
                  <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
                    {isConnected ? 'Live' : 'Paused'}
                  </Badge>
                </div>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{logs.length} log entries</p>
            </div>
          </div>

          {showControls && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsConnected(!isConnected)}
                className={`${isConnected ? 'text-green-400' : 'text-muted-foreground'} hover:text-white p-1`}
              >
                {isConnected ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={exportLogs}
                className="text-muted-foreground hover:text-white p-1"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLogs}
                className="text-muted-foreground hover:text-red-400 p-1"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(true)}
                className="text-muted-foreground hover:text-white p-1"
              >
                <ChevronUpIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {showSearch && (
          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-7 text-xs bg-card/50 border-border/50"
              />
            </div>
            
            {logCategories.length > 0 && (
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-7 text-xs bg-card/50 border border-border/50 rounded-md text-muted-foreground px-2"
              >
                <option value="all">All</option>
                {logCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className={cn('w-full', heightClasses[height])} ref={scrollAreaRef}>
          <div className="p-3 space-y-1 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CommandLineIcon className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">No logs available</p>
                {!isConnected && <p className="text-xs opacity-75">Click play to start monitoring</p>}
              </div>
            ) : (
              filteredLogs.map(log => {
                const LogIcon = getLogIcon(log.level);
                return (
                  <motion.div
                    key={log.id}
                    initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                    animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                    className="flex items-start gap-2 p-1.5 hover:bg-card/30 rounded text-xs group"
                  >
                    <LogIcon className={`w-3 h-3 mt-0.5 shrink-0 ${getLogColor(log.level)}`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        {log.category && (
                          <Badge variant="outline" className="text-xs py-0 px-1 h-4">
                            {log.category}
                          </Badge>
                        )}
                        <Badge 
                          variant={log.level === 'error' ? 'destructive' : log.level === 'success' ? 'default' : 'secondary'}
                          className="text-xs py-0 px-1 h-4"
                        >
                          {log.level}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground break-words leading-tight">{log.message}</p>
                      
                      {showDetails && log.details && (
                        <div className="mt-1 p-1.5 bg-card/50 rounded text-xs text-muted-foreground">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PageConsole;
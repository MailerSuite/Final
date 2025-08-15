/**
 * Enterprise LiveConsole Component
 * High-performance real-time console with WebSocket support, filtering, search, and export
 * Matches legacy functionality with modern shadcn/ui design
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Terminal,
  Search,
  Filter,
  Download,
  Trash2,
  Play,
  Pause,
  ScrollText,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  Copy,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useWebSocketPool } from '@/hooks/useWebSocketPool'

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'success';
  component: string;
  message: string;
  data?: any;
}

interface LiveConsoleProps {
  /** WebSocket URL for real-time logs */
  wsUrl?: string;
  /** Static logs array */
  logs?: LogEntry[];
  /** Console title */
  title?: string;
  /** Maximum number of logs to keep in memory */
  maxLogs?: number;
  /** Auto-scroll to bottom */
  autoScroll?: boolean;
  /** Show component filter */
  showComponentFilter?: boolean;
  /** Show level filter */
  showLevelFilter?: boolean;
  /** Enable search */
  enableSearch?: boolean;
  /** Enable export */
  enableExport?: boolean;
  /** Console height */
  height?: string | number;
  /** Collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Connection status callback */
  onConnectionChange?: (connected: boolean) => void;
  /** Log entry click handler */
  onLogClick?: (log: LogEntry) => void;
}

const LOG_LEVEL_COLORS = {
  debug: 'text-muted-foreground',
  info: 'text-blue-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
  success: 'text-green-400'
} as const;

const LOG_LEVEL_BACKGROUNDS = {
  debug: 'bg-muted/20',
  info: 'bg-blue-500/10',
  warn: 'bg-yellow-500/10',
  error: 'bg-red-500/10',
  success: 'bg-green-500/10'
} as const;

export const LiveConsole: React.FC<LiveConsoleProps> = ({
  wsUrl,
  logs: staticLogs = [],
  title = "Live Console",
  maxLogs = 1000,
  autoScroll = true,
  showComponentFilter = true,
  showLevelFilter = true,
  enableSearch = true,
  enableExport = true,
  height = 400,
  collapsible = false,
  defaultCollapsed = false,
  className,
  onConnectionChange,
  onLogClick
}) => {
  // State
  const [logs, setLogs] = useState<LogEntry[]>(staticLogs);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [componentFilter, setComponentFilter] = useState<string>('all');
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(autoScroll);

  // Refs
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const logBufferRef = useRef<LogEntry[]>([]);
  const pausedRef = useRef(paused);
  const wsPool = useWebSocketPool()
  const reconnectTimerRef = useRef<number | null>(null)
  const currentConnRef = useRef<string | null>(null)

  useEffect(() => { pausedRef.current = paused }, [paused])

  // Sync internal logs when props change (for external data sources)
  useEffect(() => {
    // Replace logs when staticLogs reference changes to support external feeding
    if (staticLogs && Array.isArray(staticLogs)) {
      setLogs(staticLogs);
    }
  }, [staticLogs]);

  // WebSocket connection
  useEffect(() => {
    if (!wsUrl) return;

    let stopped = false

    const start = async () => {
      if (stopped) return

      try {
        const id = await wsPool.connect('live-console', wsUrl)
        currentConnRef.current = id

        const handleOpen = () => {
          setConnected(true)
          onConnectionChange?.(true)
        }

        const handleMessage = (ev: any) => {
          try {
            const parsed = JSON.parse(ev.data)
            if (pausedRef.current) {
              logBufferRef.current.push(parsed)
              return
            }
            const logEntry: LogEntry = parsed
            setLogs(prev => {
              const updated = [...prev, logEntry]
              return updated.slice(-maxLogs)
            })
          } catch (err) {
            console.error('Failed to parse live console message:', err)
          }
        }

        const handleClose = (ev: any) => {
          setConnected(false)
          onConnectionChange?.(false)
          currentConnRef.current = null
          if (!stopped) {
            reconnectTimerRef.current = window.setTimeout(() => start(), 3000)
          }
        }

        const handleError = () => {
          setConnected(false)
          onConnectionChange?.(false)
        }

        wsPool.on('open', handleOpen)
        wsPool.on('message', handleMessage)
        wsPool.on('close', handleClose)
        wsPool.on('error', handleError)
      } catch (err) {
        console.error('WebSocket connection failed:', err)
        setConnected(false)
        onConnectionChange?.(false)
        if (!stopped) reconnectTimerRef.current = window.setTimeout(() => start(), 3000)
      }
    }

    start()

    return () => {
      stopped = true
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      if (currentConnRef.current) {
        try {
          wsPool.close()
        } catch (_) { }
        currentConnRef.current = null
      }
    }
  }, [wsUrl, paused, maxLogs, onConnectionChange]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScrollEnabled && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [logs, autoScrollEnabled]);

  // Resume paused logs
  const resumeLogs = useCallback(() => {
    if (logBufferRef.current.length > 0) {
      setLogs(prev => {
        const updated = [...prev, ...logBufferRef.current];
        logBufferRef.current = [];
        return updated.slice(-maxLogs);
      });
    }
    setPaused(false);
  }, [maxLogs]);

  // Filter and search logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Level filter
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;

      // Component filter
      if (componentFilter !== 'all' && log.component !== componentFilter) return false;

      // Search filter
      if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      return true;
    });
  }, [logs, levelFilter, componentFilter, searchTerm]);

  // Get unique components for filter
  const uniqueComponents = useMemo(() => {
    return Array.from(new Set(logs.map(log => log.component)));
  }, [logs]);

  // Export functions
  const exportLogs = useCallback((format: 'json' | 'csv' | 'txt') => {
    const dataToExport = filteredLogs;
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json': {
        content = JSON.stringify(dataToExport, null, 2);
        filename = `console-logs-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;
      }
      case 'csv': {
        const csvHeader = 'Timestamp,Level,Component,Message\n';
        const csvRows = dataToExport.map(log =>
          `"${log.timestamp.toISOString()}","${log.level}","${log.component}","${log.message.replace(/"/g, '""')}"`
        ).join('\n');
        content = csvHeader + csvRows;
        filename = `console-logs-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
        break;
      }
      case 'txt': {
        content = dataToExport.map(log =>
          `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()} ${log.component}: ${log.message}`
        ).join('\n');
        filename = `console-logs-${new Date().toISOString().split('T')[0]}.txt`;
        mimeType = 'text/plain';
        break;
      }
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredLogs]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    logBufferRef.current = [];
  }, []);

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    }).format(date);
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{title}</CardTitle>

            {/* Connection Status */}
            {wsUrl && (
              <Badge variant={connected ? "live" : "secondary"} className="text-xs" aria-label={`Connection: ${connected ? 'connected' : 'disconnected'}`}>
                {connected ? (
                  <><Wifi className="h-3 w-3 mr-1" />Connected</>
                ) : (
                  <><WifiOff className="h-3 w-3 mr-1" />Disconnected</>
                )}
              </Badge>
            )}

            {/* Log Count */}
            <Badge variant="secondary" className="text-xs" aria-label="Visible logs count">
              {filteredLogs.length} / {logs.length}
            </Badge>

            {/* Paused Indicator */}
            {paused && logBufferRef.current.length > 0 && (
              <Badge variant="destructive" className="text-xs" aria-label={`Pending logs: ${logBufferRef.current.length}`}>
                +{logBufferRef.current.length} pending
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => paused ? resumeLogs() : setPaused(true)}
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
            >
              <ScrollText className={cn("h-4 w-4", autoScrollEnabled && "text-primary")} />
            </Button>

            {enableExport && (
              <Select onValueChange={(format) => exportLogs(format as any)}>
                <SelectTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">Export JSON</SelectItem>
                  <SelectItem value="csv">Export CSV</SelectItem>
                  <SelectItem value="txt">Export TXT</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Button variant="ghost" size="sm" onClick={clearLogs}>
              <Trash2 className="h-4 w-4" />
            </Button>

            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mt-3"
            >
              {enableSearch && (
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-8"
                  />
                </div>
              )}

              {showLevelFilter && (
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-[120px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {showComponentFilter && uniqueComponents.length > 0 && (
                <Select value={componentFilter} onValueChange={setComponentFilter}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Components</SelectItem>
                    {uniqueComponents.map(component => (
                      <SelectItem key={component} value={component}>
                        {component}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardHeader>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <CardContent className="pt-0">
              <ScrollArea
                className="w-full border border-border dark:border-border rounded-md"
                style={{ height: typeof height === 'number' ? `${height}px` : height }}
                ref={scrollAreaRef}
              >
                <div className="p-4 font-mono text-sm">
                  <AnimatePresence initial={false}>
                    {filteredLogs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "flex items-start gap-3 py-1 px-2 rounded-sm hover:bg-accent/50 cursor-pointer group transition-colors",
                          LOG_LEVEL_BACKGROUNDS[log.level]
                        )}
                        onClick={() => onLogClick?.(log)}
                      >
                        {/* Timestamp */}
                        <span className="text-muted-foreground text-xs min-w-[80px] select-none">
                          {formatTimestamp(log.timestamp)}
                        </span>

                        {/* Level Badge */}
                        <Badge
                          variant="outline"
                          className={cn("text-xs min-w-[60px] justify-center", LOG_LEVEL_COLORS[log.level])}
                        >
                          {log.level.toUpperCase()}
                        </Badge>

                        {/* Component */}
                        <span className="text-muted-foreground text-xs min-w-[100px] truncate">
                          [{log.component}]
                        </span>

                        {/* Message */}
                        <span className="flex-1 text-foreground break-words">
                          {log.message}
                        </span>

                        {/* Copy Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(`[${formatTimestamp(log.timestamp)}] ${log.level.toUpperCase()} ${log.component}: ${log.message}`);
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {filteredLogs.length === 0 && (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Terminal className="h-8 w-8 mr-3" />
                      <span>No logs to display</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default LiveConsole;
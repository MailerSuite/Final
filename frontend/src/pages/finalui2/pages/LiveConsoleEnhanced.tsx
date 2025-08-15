import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '../components/PageShell';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Badge already imported above; remove duplicate
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CommandLineIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  WifiIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  BugAntIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  BoltIcon,
  ServerStackIcon,
  CpuChipIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
// Card already imported above; remove duplicate
// ui-kit ActionButton used for control buttons
// Removed legacy ui-kit ActionButton; using shadcn Button variants exclusively

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'success' | 'warning' | 'error' | 'critical';
  source: string;
  message: string;
  data?: unknown;
  tags?: string[];
}

const LiveConsoleEnhanced: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamp, setShowTimestamp] = useState(true);
  const [showSource, setShowSource] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    total: 0,
    debug: 0,
    info: 0,
    success: 0,
    warning: 0,
    error: 0,
    critical: 0
  });

  // Simulate WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      setIsConnected(true);

      // Simulate incoming logs
      const interval = setInterval(() => {
        if (!isPaused) {
          const levels: LogEntry['level'][] = ['debug', 'info', 'success', 'warning', 'error', 'critical'];
          const sources = ['API', 'Database', 'Auth', 'Email', 'WebSocket', 'Cache', 'Queue', 'AI'];
          const messages = [
            'Connection established successfully',
            'Processing request from user',
            'Query executed in 42ms',
            'Cache hit for key: user_session',
            'Email sent to recipient',
            'Authentication token validated',
            'WebSocket message received',
            'AI model prediction completed',
            'Database connection pool healthy',
            'Rate limit exceeded for IP',
            'Failed to connect to service',
            'Timeout waiting for response',
            'Memory usage at 78%',
            'CPU usage spike detected',
            'Disk space running low',
            'Network latency increased',
            'Background job completed',
            'Scheduled task executed',
            'Configuration reloaded',
            'Service health check passed'
          ];

          const level = levels[Math.floor(Math.random() * levels.length)];
          const newLog: LogEntry = {
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            level,
            source: sources[Math.floor(Math.random() * sources.length)],
            message: messages[Math.floor(Math.random() * messages.length)],
            data: Math.random() > 0.7 ? {
              duration: `${Math.floor(Math.random() * 1000)}ms`,
              user: `user_${Math.floor(Math.random() * 1000)}`,
              ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
              endpoint: `/api/v1/${['users', 'campaigns', 'emails', 'analytics'][Math.floor(Math.random() * 4)]}`
            } : undefined,
            tags: Math.random() > 0.5 ? ['production', 'high-priority'] : ['staging']
          };

          setLogs(prev => {
            const updated = [newLog, ...prev].slice(0, 1000); // Keep last 1000 logs
            return updated;
          });

          setStats(prev => ({
            ...prev,
            total: prev.total + 1,
            [level]: prev[level] + 1
          }));
        }
      }, Math.random() * 2000 + 500);

      return () => clearInterval(interval);
    };

    const cleanup = connectWebSocket();
    return cleanup;
  }, [isPaused]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'debug': return <BugAntIcon className="w-4 h-4" />;
      case 'info': return <InformationCircleIcon className="w-4 h-4" />;
      case 'success': return <CheckCircleIcon className="w-4 h-4" />;
      case 'warning': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'error': return <XCircleIcon className="w-4 h-4" />;
      case 'critical': return <BoltIcon className="w-4 h-4" />;
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'debug': return 'text-blue-300/80 bg-blue-500/10 border-blue-500/30';
      case 'info': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'success': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'warning': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'error': return 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30';
      case 'critical': return 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (sourceFilter !== 'all' && log.source !== sourceFilter) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.source.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const uniqueSources = Array.from(new Set(logs.map(log => log.source)));

  const exportLogs = () => {
    const data = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-logs-${Date.now()}.json`;
    a.click();
  };

  const clearLogs = () => {
    setLogs([]);
    setStats({
      total: 0,
      debug: 0,
      info: 0,
      success: 0,
      warning: 0,
      error: 0,
      critical: 0
    });
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  return (
    <TooltipProvider>
      <PageShell
        title="Live System Console"
        subtitle="Real-time system logs and events monitoring"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Live' }, { label: 'Console' }]}
        toolbar={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsPaused(!isPaused)}>
              {isPaused ? <PlayIcon className="w-4 h-4 mr-2" /> : <PauseIcon className="w-4 h-4 mr-2" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAutoScroll(!autoScroll)}>
              {autoScroll ? <ChevronDownIcon className="w-4 h-4 mr-2" /> : <ChevronUpIcon className="w-4 h-4 mr-2" />}
              Auto-scroll
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              <TrashIcon className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        }
      >
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
        >
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg blur-xl opacity-50 animate-pulse" />
                  <Card className="relative p-3">
                    <CommandLineIcon className="w-5 h-5 text-cyan-400" />
                  </Card>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Live System Console
                  </h1>
                  <p className="text-blue-300/80 mt-1">Real-time system logs and events monitoring</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={isConnected ? 'default' : 'secondary'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                  <SignalIcon className="w-3 h-3 mr-1" />
                  {filteredLogs.length} logs
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            {Object.entries(stats).map(([key, value]) => (
              <Card key={key} className="p-3 text-center">
                <p className="text-xs text-blue-300/80 capitalize mb-1">{key}</p>
                <p className={`text-2xl font-bold ${key === 'total' ? 'text-cyan-400' :
                  key === 'error' ? 'text-fuchsia-400' :
                    key === 'critical' ? 'text-fuchsia-400' :
                      key === 'warning' ? 'text-purple-400' :
                        key === 'success' ? 'text-blue-400' :
                          key === 'info' ? 'text-blue-400' :
                            'text-blue-300/80'
                  }`}>
                  {value.toLocaleString()}
                </p>
              </Card>
            ))}
          </div>

          {/* Controls */}
          <AnimatedCard enable3D className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/80" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-card/40 border-white/10"
                  />
                </div>

                {/* Level Filter */}
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-32 bg-card/40 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>

                {/* Source Filter */}
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-32 bg-card/40 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {uniqueSources.map(source => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Separator orientation="vertical" className="h-8 bg-white/10" />

                {/* Actions */}
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsPaused(!isPaused)}
                        className={isPaused ? 'border-blue-500/30 text-blue-400' : 'border-white/10'}
                      >
                        {isPaused ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isPaused ? 'Resume' : 'Pause'}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAutoScroll(!autoScroll)}
                        className={autoScroll ? 'border-cyan-500/30 text-cyan-400' : 'border-white/10'}
                      >
                        {autoScroll ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Auto-scroll: {autoScroll ? 'On' : 'Off'}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={exportLogs}>
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export logs</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={clearLogs}>
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear logs</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Toggle Options */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
                <label className="flex items-center gap-2 text-sm text-blue-300/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTimestamp}
                    onChange={(e) => setShowTimestamp(e.target.checked)}
                    className="rounded border-white/20"
                  />
                  Show Timestamp
                </label>
                <label className="flex items-center gap-2 text-sm text-blue-300/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSource}
                    onChange={(e) => setShowSource(e.target.checked)}
                    className="rounded border-white/20"
                  />
                  Show Source
                </label>
              </div>
            </CardContent>
          </AnimatedCard>

          {/* Console Output */}
          <AnimatedCard enable3D aria-live="polite" className="">
            <CardContent className="p-0">
              <ScrollArea className="h-[600px] p-4" ref={scrollRef}>
                <AnimatePresence>
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <CommandLineIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                      <p className="text-blue-300/80">No logs to display</p>
                      <p className="text-sm text-blue-300/80 mt-1">
                        {isPaused ? 'Console is paused' : 'Waiting for logs...'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-sm">
                      {filteredLogs.map((log) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`p-2 rounded border ${getLevelColor(log.level)} hover:bg-white/[0.02] transition-all cursor-pointer`}
                          onClick={() => toggleLogExpansion(log.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {getLevelIcon(log.level)}
                              {showTimestamp && (
                                <span className="text-xs text-blue-300/80">
                                  {log.timestamp.toLocaleTimeString()}
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {showSource && (
                                  <Badge variant="outline" className="text-xs px-1 py-0">
                                    {log.source}
                                  </Badge>
                                )}
                                <span className="text-blue-300/80 truncate">
                                  {log.message}
                                </span>
                              </div>

                              {expandedLogs.has(log.id) && log.data && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="mt-2 p-2 bg-card/40 rounded text-xs text-blue-300/80"
                                >
                                  <pre>{JSON.stringify(log.data, null, 2)}</pre>
                                </motion.div>
                              )}

                              {log.tags && log.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {log.tags.map((tag, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="text-xs px-1 py-0 border-white/10 text-blue-300/80"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </CardContent>
          </AnimatedCard>
        </motion.div>
      </PageShell>
    </TooltipProvider>
  );
};

export default LiveConsoleEnhanced;
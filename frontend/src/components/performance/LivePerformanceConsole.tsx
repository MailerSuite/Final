import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  TrendingUp,
  Pause,
  Play,
  Square,
  RefreshCw,
  Download,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { createWebSocket } from '@/utils/websocket';

interface PerformanceLogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  threadId?: number;
  metric_type?: 'smtp' | 'imap' | 'load_balancing' | 'system';
  value?: number;
  unit?: string;
}

interface LiveMetrics {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  current_throughput: number;
  active_connections: number;
  test_progress?: number;
  test_status?: 'running' | 'completed' | 'failed';
  smtp_metrics?: {
    throughput: number;
    success_rate: number;
    avg_response_time: number;
  };
  imap_metrics?: {
    throughput: number;
    success_rate: number;
    avg_response_time: number;
  };
  load_balancing_metrics?: {
    session_allocation_rate: number;
    tier_distribution: Record<string, number>;
    queue_depth: number;
  };
}

interface Props {
  testId?: string;
  isRunning: boolean;
  onStart?: () => void;
  onStop?: () => void;
  onPause?: () => void;
  maxLines?: number;
}

const LivePerformanceConsole: React.FC<Props> = ({
  testId,
  isRunning,
  onStart,
  onStop,
  onPause,
  maxLines = 500
}) => {
  const [logs, setLogs] = useState<PerformanceLogEntry[]>([]);
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [connected, setConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const endRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isRunning && testId) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isRunning, testId]);

  useEffect(() => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const connectWebSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    let base = (import.meta.env.VITE_API_BASE as string) || "/api/v1";
    base = base.replace(/^https?:\/\//, "");

    const url = `${protocol}//${base}/performance/live${testId ? `?test_id=${testId}` : ''}`;

    try {
      wsRef.current = createWebSocket(url);

      wsRef.current.onopen = () => {
        setConnected(true);
        addLog('info', 'Connected to performance monitoring stream');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data.replace('data: ', ''));

          if (data.error) {
            addLog('error', `Stream error: ${data.error}`);
            return;
          }

          // Update live metrics
          setMetrics(data);

          // Generate log entries from metrics
          if (data.smtp_metrics) {
            addLog('info',
              `SMTP: ${data.smtp_metrics.throughput.toFixed(1)} ops/sec (${data.smtp_metrics.success_rate.toFixed(1)}% success)`,
              undefined,
              'smtp',
              data.smtp_metrics.throughput,
              'ops/sec'
            );
          }

          if (data.imap_metrics) {
            addLog('info',
              `IMAP: ${data.imap_metrics.throughput.toFixed(1)} ops/sec (${data.imap_metrics.success_rate.toFixed(1)}% success)`,
              undefined,
              'imap',
              data.imap_metrics.throughput,
              'ops/sec'
            );
          }

          if (data.load_balancing_metrics) {
            addLog('info',
              `Load Balancing: ${data.load_balancing_metrics.session_allocation_rate.toFixed(1)} sessions/sec (Queue: ${data.load_balancing_metrics.queue_depth})`,
              undefined,
              'load_balancing',
              data.load_balancing_metrics.session_allocation_rate,
              'sessions/sec'
            );
          }

          // System metrics
          if (data.cpu_usage !== undefined) {
            addLog('info',
              `System: CPU ${data.cpu_usage.toFixed(1)}%, RAM ${data.memory_usage.toFixed(1)}%, Connections: ${data.active_connections}`,
              undefined,
              'system'
            );
          }

        } catch (err) {
          console.error('Error parsing performance data:', err);
          addLog('error', `Failed to parse performance data: ${err}`);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Performance WebSocket error:', error);
        addLog('error', 'Performance monitoring connection error');
        setConnected(false);
      };

      wsRef.current.onclose = (event) => {
        setConnected(false);
        addLog('warning', `Performance monitoring disconnected: ${event.code} ${event.reason}`);
      };

    } catch (error) {
      console.error('Failed to connect performance WebSocket:', error);
      addLog('error', 'Failed to connect to performance monitoring');
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  };

  const addLog = (
    level: PerformanceLogEntry['level'],
    message: string,
    threadId?: number,
    metric_type?: string,
    value?: number,
    unit?: string
  ) => {
    if (isPaused) return;

    const logEntry: PerformanceLogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      threadId,
      metric_type: metric_type as any,
      value,
      unit
    };

    setLogs(prev => {
      const newLogs = [...prev, logEntry];
      return newLogs.slice(-maxLines); // Keep only the last maxLines entries
    });
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (onPause) onPause();
  };

  const handleClear = () => {
    setLogs([]);
    toast.success('Performance logs cleared');
  };

  const handleExport = () => {
    const logData = logs.map(log => ({
      timestamp: log.timestamp,
      level: log.level,
      message: log.message,
      threadId: log.threadId,
      metric_type: log.metric_type,
      value: log.value,
      unit: log.unit
    }));

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Performance logs exported');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const getMetricColor = (metric_type?: string) => {
    switch (metric_type) {
      case 'smtp': return 'text-blue-400';
      case 'imap': return 'text-green-400';
      case 'load_balancing': return 'text-purple-400';
      case 'system': return 'text-orange-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="bg-transparent border border-zinc-800">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-white flex items-center justify-between">
          <span className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Live Performance Console
            {connected && (
              <Badge variant="live" aria-label="Live connection" className="ml-2">
                Connected
              </Badge>
            )}
          </span>

          <div className="flex items-center space-x-2">
            {onStart && !isRunning && (
              <Button variant="ghost" size="sm" onClick={onStart}>
                <Play className="h-4 w-4" />
              </Button>
            )}

            {isRunning && (
              <Button variant="ghost" size="sm" onClick={handlePause}>
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            )}

            {onStop && isRunning && (
              <Button variant="ghost" size="sm" onClick={onStop}>
                <Square className="h-4 w-4" />
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={handleClear} disabled={logs.length === 0}>
              <Trash2 className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={handleExport} disabled={logs.length === 0}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Live Metrics Summary */}
        {metrics && isRunning && (
          <div className="mb-4 p-3 bg-zinc-900/50 rounded-md">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">CPU</span>
                <div className="font-mono text-orange-400">{metrics.cpu_usage.toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Memory</span>
                <div className="font-mono text-orange-400">{metrics.memory_usage.toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Connections</span>
                <div className="font-mono text-blue-400">{metrics.active_connections}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Throughput</span>
                <div className="font-mono text-green-400">{metrics.current_throughput.toFixed(1)}/sec</div>
              </div>
            </div>

            {metrics.test_progress !== undefined && (
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Test Progress</span>
                  <span className="text-white">{metrics.test_progress.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.test_progress} className="h-2" />
              </div>
            )}
          </div>
        )}

        {/* Console Output */}
        <div
          className="border bg-zinc-900 rounded-md p-3 text-green-400 font-mono text-sm h-64 overflow-y-auto space-y-1"
          role="log"
          aria-live="polite"
        >
          {logs.length === 0 && (
            <div className="text-muted-foreground italic">
              {isRunning ? 'Waiting for performance data...' : 'Start a performance test to see live metrics'}
            </div>
          )}

          {logs.map((log, index) => (
            <div key={index} className="flex items-start space-x-2">
              <span className="text-muted-foreground text-xs w-20 flex-shrink-0">[{log.timestamp}]</span>

              {log.threadId && (
                <span className="text-purple-300 text-xs w-12 flex-shrink-0">T{log.threadId}</span>
              )}

              {log.metric_type && (
                <Badge variant="secondary" className={`text-xs ${getMetricColor(log.metric_type)}`} aria-label={`Metric type: ${log.metric_type}`}>
                  {log.metric_type.toUpperCase()}
                </Badge>
              )}

              <span className={`${getLevelColor(log.level)} flex-1`}>
                {log.message}
              </span>

              {log.value !== undefined && log.unit && (
                <span className="text-blue-300 text-xs flex-shrink-0">
                  {log.value.toFixed(1)}{log.unit}
                </span>
              )}
            </div>
          ))}

          <div ref={endRef} />
        </div>

        {/* Console Controls */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{logs.length} entries {isPaused && '(paused)'}</span>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="mr-1"
              />
              Auto-scroll
            </label>

            {connected && <span className="text-green-400">● Live</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LivePerformanceConsole; 
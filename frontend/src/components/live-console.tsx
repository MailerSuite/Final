import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, Copy, Pause, Play } from 'lucide-react';

interface LiveConsoleLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success' | 'command';
  message: string;
  threadId?: number;
}

interface LiveConsoleProps {
  logs: LiveConsoleLog[];
  onClear?: () => void;
  onExport?: () => void;
  className?: string;
  title?: string;
  maxLogs?: number;
}

export const LiveConsole: React.FC<LiveConsoleProps> = ({
  logs,
  onClear,
  onExport,
  className,
  title = "Live Console",
  maxLogs = 1000
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (autoScroll && consoleRef.current && !isPaused) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs, autoScroll, isPaused]);

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400 bg-red-900/20';
      case 'warning':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'success':
        return 'text-purple-400 bg-purple-900/20';
      case 'command':
        return 'text-blue-400 bg-blue-900/20';
      default:
        return 'text-muted-foreground bg-background/20';
    }
  };

  const getLogLevelBadge = (level: string) => {
    const variant: React.ComponentProps<typeof Badge>["variant"] =
      level === 'error' ? 'destructive'
        : level === 'warning' ? 'secondary'
          : level === 'success' ? 'default'
            : 'outline'
    const label = level.toUpperCase()
    return <Badge variant={variant} className="text-xs" aria-label={`Log level: ${label}`}>{label}</Badge>
  };

  const copyToClipboard = () => {
    const logText = logs.map(log =>
      `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');
    navigator.clipboard.writeText(logText);
  };

  const displayedLogs = logs.slice(-maxLogs);

  return (
    <Card className={`bg-background/30 border-border ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-100 text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-border text-muted-foreground">
              {logs.length} logs
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPaused(!isPaused)}
              className="border-border text-muted-foreground hover:bg-card"
            >
              {isPaused ? (
                <Play className="h-4 w-4 mr-1" />
              ) : (
                <Pause className="h-4 w-4 mr-1" />
              )}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={copyToClipboard}
              className="border-border text-muted-foreground hover:bg-card"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onExport}
              className="border-border text-muted-foreground hover:bg-card"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClear}
              className="border-red-600 text-red-400 hover:bg-red-600/10"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={consoleRef}
          className="bg-black/50 border border-border rounded-md p-4 font-mono text-sm h-96 overflow-y-auto"
        >
          {displayedLogs.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              No console output yet...
            </div>
          ) : (
            <div className="space-y-1">
              {displayedLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-2 p-1 rounded ${getLogLevelColor(log.level)}`}
                >
                  <span className="text-muted-foreground text-xs min-w-[80px]">
                    {log.timestamp}
                  </span>
                  <span className="text-muted-foreground text-xs min-w-[60px]">
                    {log.threadId ? `[T${log.threadId}]` : ''}
                  </span>
                  <div className="min-w-[60px]">
                    {getLogLevelBadge(log.level)}
                  </div>
                  <span className="flex-1">
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>
            Showing {displayedLogs.length} of {logs.length} logs
          </span>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-border bg-card"
            />
            Auto-scroll
          </label>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveConsole; 
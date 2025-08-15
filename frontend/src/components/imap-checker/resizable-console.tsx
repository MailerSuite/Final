import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Download, Copy, Maximize2, Minimize2 } from 'lucide-react';

interface ConsoleLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success' | 'command';
  message: string;
  threadId?: number;
}

interface ResizableConsoleProps {
  logs: ConsoleLog[];
  onClear?: () => void;
  onExport?: () => void;
  className?: string;
  title?: string;
}

export const ResizableConsole: React.FC<ResizableConsoleProps> = ({
  logs,
  onClear,
  onExport,
  className,
  title = "Console Output"
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(300);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'success':
        return 'text-green-400';
      case 'command':
        return 'text-blue-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'command':
        return '⚡';
      default:
        return 'ℹ️';
    }
  };

  const copyToClipboard = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');
    navigator.clipboard.writeText(logText);
  };

  return (
    <Card className={`bg-background/30 border-border ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-100 text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="border-border text-muted-foreground hover:bg-card"
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea
          ref={scrollAreaRef}
          className={`bg-black/50 border border-border rounded-md p-4 font-mono text-sm ${
            isExpanded ? 'h-96' : `h-${height}`
          }`}
        >
          {logs.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              No console output yet...
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-muted-foreground text-xs min-w-[80px]">
                    {log.timestamp}
                  </span>
                  <span className="text-muted-foreground text-xs min-w-[60px]">
                    {log.threadId ? `[T${log.threadId}]` : ''}
                  </span>
                  <span className="text-xs mr-2">
                    {getLogLevelIcon(log.level)}
                  </span>
                  <span className={`flex-1 ${getLogLevelColor(log.level)}`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {!isExpanded && (
          <div className="mt-2">
            <input
              type="range"
              min="200"
              max="600"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResizableConsole; 
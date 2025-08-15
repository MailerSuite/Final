import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Settings, Play, Pause, RotateCcw } from 'lucide-react';

interface ThreadManagementPageProps {
  maxThreads?: number;
  currentThreads?: number;
  onThreadsChange?: (threads: number) => void;
  onStart?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  isRunning?: boolean;
}

export const ThreadManagementPage: React.FC<ThreadManagementPageProps> = ({
  maxThreads = 10,
  currentThreads = 5,
  onThreadsChange,
  onStart,
  onStop,
  onReset,
  isRunning = false
}) => {
  const [threads, setThreads] = useState(currentThreads);

  const handleThreadsChange = (value: number[]) => {
    const newThreads = value[0];
    setThreads(newThreads);
    onThreadsChange?.(newThreads);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-background/30 border-border">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Thread Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Thread Count Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">Thread Count</Label>
              <Badge variant="outline" className="text-muted-foreground border-border">
                {threads} / {maxThreads}
              </Badge>
            </div>
            <Slider
              value={[threads]}
              onValueChange={handleThreadsChange}
              max={maxThreads}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>{maxThreads}</span>
            </div>
          </div>

          {/* Manual Input */}
          <div className="space-y-2">
            <Label htmlFor="threads-input" className="text-muted-foreground">
              Manual Input
            </Label>
            <Input
              id="threads-input"
              type="number"
              min={1}
              max={maxThreads}
              value={threads}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 1 && value <= maxThreads) {
                  setThreads(value);
                  onThreadsChange?.(value);
                }
              }}
              className="bg-card/50 border-border text-gray-100"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onStart}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
            <Button
              onClick={onStop}
              disabled={!isRunning}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-600/10"
            >
              <Pause className="h-4 w-4 mr-2" />
              Stop
            </Button>
            <Button
              onClick={onReset}
              variant="outline"
              className="border-border text-muted-foreground hover:bg-card"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Status */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge 
                variant={isRunning ? "default" : "secondary"}
                className={isRunning ? "bg-green-600" : "bg-muted"}
              >
                {isRunning ? "Running" : "Stopped"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThreadManagementPage; 
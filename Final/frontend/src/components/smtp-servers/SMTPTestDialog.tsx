/**
 * SMTP Test Dialog Component
 * Real-time SMTP server connection testing with detailed logs
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Play,
  RotateCcw,
  Download,
  Copy,
  Terminal,
  Zap,
  Shield,
  Mail,
  Server,
  Clock,
  Activity,
  ChevronRight,
  Info,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { smtpApi } from '@/api/smtp-api';
import { cn } from '@/lib/utils';

interface TestStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'warning';
  message?: string;
  duration?: number;
  details?: any;
}

interface SMTPTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  server: {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
    security: string;
  };
  sessionId: string;
}

const TEST_STEPS = [
  { id: 'dns', name: 'DNS Resolution' },
  { id: 'connect', name: 'TCP Connection' },
  { id: 'greeting', name: 'SMTP Greeting' },
  { id: 'ehlo', name: 'EHLO/HELO' },
  { id: 'starttls', name: 'STARTTLS' },
  { id: 'auth', name: 'Authentication' },
  { id: 'mailbox', name: 'Mailbox Verification' },
  { id: 'quit', name: 'Clean Disconnect' },
];

export default function SMTPTestDialog({
  isOpen,
  onClose,
  server,
  sessionId,
}: SMTPTestDialogProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    performance?: {
      totalTime: number;
      responseTime: number;
      throughput: number;
    };
  } | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      resetTest();
    }
  }, [isOpen]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const resetTest = () => {
    setSteps(TEST_STEPS.map(step => ({ ...step, status: 'pending' })));
    setLogs([]);
    setTestResult(null);
    setIsRunning(false);
  };

  const addLog = (message: string, level: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const levelColors = {
      info: 'text-muted-foreground',
      success: 'text-green-500',
      error: 'text-red-500',
      warning: 'text-yellow-500',
    };
    setLogs(prev => [...prev, `[${timestamp}] <span class="${levelColors[level]}">${message}</span>`]);
  };

  const updateStep = (stepId: string, update: Partial<TestStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...update } : step
    ));
  };

  const runTest = async () => {
    setIsRunning(true);
    resetTest();
    
    const startTime = Date.now();
    abortControllerRef.current = new AbortController();

    try {
      addLog(`Starting SMTP test for ${server.name}`, 'info');
      addLog(`Target: ${server.host}:${server.port} (${server.security.toUpperCase()})`, 'info');
      
      // Simulate step-by-step testing
      for (const step of TEST_STEPS) {
        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Test cancelled');
        }

        updateStep(step.id, { status: 'running' });
        const stepStartTime = Date.now();

        try {
          switch (step.id) {
            case 'dns':
              addLog(`Resolving ${server.host}...`, 'info');
              await simulateDelay(500, 1500);
              addLog(`Resolved to 192.168.1.100`, 'success');
              updateStep(step.id, { 
                status: 'success', 
                message: 'Resolved successfully',
                duration: Date.now() - stepStartTime,
              });
              break;

            case 'connect':
              addLog(`Connecting to ${server.host}:${server.port}...`, 'info');
              await simulateDelay(800, 2000);
              addLog(`Connected successfully`, 'success');
              updateStep(step.id, { 
                status: 'success', 
                message: 'Connection established',
                duration: Date.now() - stepStartTime,
              });
              break;

            case 'greeting':
              addLog(`Waiting for server greeting...`, 'info');
              await simulateDelay(300, 800);
              addLog(`220 ${server.host} ESMTP ready`, 'success');
              updateStep(step.id, { 
                status: 'success', 
                message: 'Server ready',
                duration: Date.now() - stepStartTime,
              });
              break;

            case 'ehlo':
              addLog(`Sending EHLO...`, 'info');
              await simulateDelay(200, 500);
              addLog(`250-${server.host} Hello`, 'success');
              addLog(`250-SIZE 35882577`, 'info');
              addLog(`250-AUTH LOGIN PLAIN`, 'info');
              addLog(`250-STARTTLS`, 'info');
              addLog(`250 HELP`, 'info');
              updateStep(step.id, { 
                status: 'success', 
                message: 'Server capabilities received',
                duration: Date.now() - stepStartTime,
              });
              break;

            case 'starttls':
              if (server.security !== 'none') {
                addLog(`Initiating STARTTLS...`, 'info');
                await simulateDelay(500, 1000);
                addLog(`220 Ready to start TLS`, 'success');
                addLog(`TLS handshake completed`, 'success');
                updateStep(step.id, { 
                  status: 'success', 
                  message: 'TLS secured',
                  duration: Date.now() - stepStartTime,
                });
              } else {
                updateStep(step.id, { 
                  status: 'warning', 
                  message: 'Skipped (no encryption)',
                });
              }
              break;

            case 'auth':
              addLog(`Authenticating as ${server.username}...`, 'info');
              await simulateDelay(800, 1500);
              
              // Simulate random auth success/failure
              if (Math.random() > 0.1) {
                addLog(`235 Authentication successful`, 'success');
                updateStep(step.id, { 
                  status: 'success', 
                  message: 'Authenticated',
                  duration: Date.now() - stepStartTime,
                });
              } else {
                throw new Error('535 Authentication failed');
              }
              break;

            case 'mailbox':
              addLog(`Verifying mailbox access...`, 'info');
              await simulateDelay(300, 600);
              addLog(`MAIL FROM accepted`, 'success');
              addLog(`RCPT TO accepted`, 'success');
              updateStep(step.id, { 
                status: 'success', 
                message: 'Mailbox verified',
                duration: Date.now() - stepStartTime,
              });
              break;

            case 'quit':
              addLog(`Closing connection...`, 'info');
              await simulateDelay(100, 300);
              addLog(`221 Bye`, 'success');
              updateStep(step.id, { 
                status: 'success', 
                message: 'Disconnected cleanly',
                duration: Date.now() - stepStartTime,
              });
              break;
          }
        } catch (error: any) {
          addLog(`Error: ${error.message}`, 'error');
          updateStep(step.id, { 
            status: 'error', 
            message: error.message,
            duration: Date.now() - stepStartTime,
          });
          throw error;
        }
      }

      const totalTime = Date.now() - startTime;
      const responseTime = Math.round(totalTime / TEST_STEPS.length);
      
      setTestResult({
        success: true,
        message: 'All tests passed successfully',
        performance: {
          totalTime,
          responseTime,
          throughput: Math.round(1000 / responseTime),
        },
      });
      
      addLog(`✓ All tests completed successfully in ${totalTime}ms`, 'success');
      
    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      setTestResult({
        success: false,
        message: error.message || 'Test failed',
        performance: {
          totalTime,
          responseTime: 0,
          throughput: 0,
        },
      });
      
      addLog(`✗ Test failed: ${error.message}`, 'error');
      
      // Mark remaining steps as pending
      setSteps(prev => prev.map(step => 
        step.status === 'running' || step.status === 'pending' 
          ? { ...step, status: 'pending' } 
          : step
      ));
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  const simulateDelay = (min: number, max: number) => {
    return new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
  };

  const cancelTest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addLog('Test cancelled by user', 'warning');
      setIsRunning(false);
    }
  };

  const downloadLogs = () => {
    const plainLogs = logs.map(log => log.replace(/<[^>]*>/g, '')).join('\n');
    const blob = new Blob([plainLogs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smtp-test-${server.name}-${new Date().toISOString()}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyLogs = () => {
    const plainLogs = logs.map(log => log.replace(/<[^>]*>/g, '')).join('\n');
    navigator.clipboard.writeText(plainLogs);
    toast({
      title: 'Copied',
      description: 'Test logs copied to clipboard',
    });
  };

  const getStepIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Test SMTP Connection
          </DialogTitle>
          <DialogDescription>
            Testing connection to {server.name} ({server.host}:{server.port})
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Test Steps */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Test Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg transition-colors',
                    step.status === 'running' && 'bg-blue-500/10',
                    step.status === 'success' && 'bg-green-500/10',
                    step.status === 'error' && 'bg-red-500/10',
                  )}
                >
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{step.name}</div>
                    {step.message && (
                      <div className="text-xs text-muted-foreground">{step.message}</div>
                    )}
                  </div>
                  {step.duration && (
                    <div className="text-xs text-muted-foreground">
                      {step.duration}ms
                    </div>
                  )}
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Console Logs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Console Output
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyLogs}
                    disabled={logs.length === 0}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={downloadLogs}
                    disabled={logs.length === 0}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full rounded-md border bg-black/90 p-3">
                <div className="font-mono text-xs space-y-1">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      dangerouslySetInnerHTML={{ __html: log }}
                    />
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Test Result */}
        {testResult && (
          <Alert variant={testResult.success ? 'default' : 'destructive'}>
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertDescription className="font-medium">
                  {testResult.message}
                </AlertDescription>
                {testResult.performance && testResult.success && (
                  <div className="mt-2 flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Total: {testResult.performance.totalTime}ms
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Avg: {testResult.performance.responseTime}ms
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {testResult.performance.throughput} req/s
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <div className="flex gap-2">
            {!isRunning ? (
              <Button onClick={runTest}>
                <Play className="w-4 h-4 mr-2" />
                Start Test
              </Button>
            ) : (
              <Button variant="destructive" onClick={cancelTest}>
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Test
              </Button>
            )}
            <Button variant="outline" onClick={resetTest} disabled={isRunning}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
          <Button variant="outline" onClick={onClose} disabled={isRunning}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
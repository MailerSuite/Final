import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageConsole from '@/components/ui/PageConsole';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import ProgressBar from '@/components/ProgressBar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  EnvelopeIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  BoltIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  PlayIcon,
  StopIcon,
  LockClosedIcon,
  NoSymbolIcon,
  KeyIcon,
  GlobeAltIcon,
  WifiIcon,
  CpuChipIcon,
  SparklesIcon,
  ChartBarIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  BeakerIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  SignalIcon,
  CloudArrowUpIcon,
  FingerPrintIcon,
  CommandLineIcon,
  CodeBracketIcon,
  CubeTransparentIcon,
  FireIcon,
  RocketLaunchIcon,
  UserIcon,
  AtSymbolIcon
} from '@heroicons/react/24/outline';
// Removed duplicated UI imports (already imported above)
import PageShell from '../components/PageShell';
import { BlacklistApiFactory } from '@/api/blacklist-api';
import { useBulkSMTPChecker } from '@/hooks/useBulkSMTPChecker';
import { getSessionId } from '@/utils/getSessionId';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface SMTPConfig {
  server: string;
  port: string;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  encryption: 'none' | 'ssl' | 'tls' | 'starttls';
  authentication: 'plain' | 'login' | 'oauth2' | 'xoauth2';
  timeout: number;
}

interface TestResult {
  step: string;
  status: 'pending' | 'testing' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
  details?: Record<string, any>;
}

interface SMTPProvider {
  name: string;
  server: string;
  port: number;
  encryption: 'ssl' | 'tls' | 'starttls';
  auth: string;
  limits: {
    daily: number;
    hourly: number;
    concurrent: number;
  };
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: 'red' | 'blue' | 'orange' | 'green' | 'gray';
}

const SMTPCheckerPage: React.FC<{ initialTab?: string }> = ({ initialTab }) => {
  const colorToTextClass = (color: SMTPProvider['color']) => {
    switch (color) {
      case 'red': return 'text-red-400';
      case 'blue': return 'text-blue-400';
      case 'orange': return 'text-orange-400';
      case 'green': return 'text-green-400';
      default: return 'text-muted-foreground';
    }
  };
  const [initialLoading, setInitialLoading] = useState(true);
  const [config, setConfig] = useState<SMTPConfig>({
    server: '',
    port: '587',
    username: '',
    password: '',
    fromEmail: '',
    fromName: '',
    toEmail: '',
    encryption: 'starttls',
    authentication: 'plain',
    timeout: 30
  });

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<Array<{ name: string; config: SMTPConfig }>>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [testEmail, setTestEmail] = useState({
    subject: 'SMTP Test Email - {{timestamp}}',
    body: 'This is a test email sent from SpamGPT SMTP Checker.\n\nTimestamp: {{timestamp}}\nServer: {{server}}\nPort: {{port}}\n\nIf you received this email, your SMTP configuration is working correctly!',
    isHtml: false
  });

  // Popular SMTP providers
  const providers: SMTPProvider[] = [
    {
      name: 'Gmail',
      server: 'smtp.gmail.com',
      port: 587,
      encryption: 'starttls',
      auth: 'OAuth2 or App Password',
      limits: { daily: 500, hourly: 20, concurrent: 10 },
      features: ['OAuth2', 'App Passwords', 'Less Secure Apps'],
      icon: EnvelopeIcon,
      color: 'red'
    },
    {
      name: 'SendGrid',
      server: 'smtp.sendgrid.net',
      port: 587,
      encryption: 'starttls',
      auth: 'API Key',
      limits: { daily: 100000, hourly: 10000, concurrent: 100 },
      features: ['API Key Auth', 'Webhooks', 'Analytics', 'Templates'],
      icon: RocketLaunchIcon,
      color: 'blue'
    },
    {
      name: 'AWS SES',
      server: 'email-smtp.us-east-1.amazonaws.com',
      port: 587,
      encryption: 'starttls',
      auth: 'IAM Credentials',
      limits: { daily: 50000, hourly: 14, concurrent: 50 },
      features: ['IAM Auth', 'SNS Notifications', 'Configuration Sets'],
      icon: CloudArrowUpIcon,
      color: 'orange'
    },
    {
      name: 'Mailgun',
      server: 'smtp.mailgun.org',
      port: 587,
      encryption: 'starttls',
      auth: 'API Key',
      limits: { daily: 100000, hourly: 10000, concurrent: 100 },
      features: ['API Key', 'Webhooks', 'Tracking', 'Validation'],
      icon: BoltIcon,
      color: 'green'
    },
    {
      name: 'Office 365',
      server: 'smtp.office365.com',
      port: 587,
      encryption: 'starttls',
      auth: 'OAuth2 or Password',
      limits: { daily: 10000, hourly: 30, concurrent: 20 },
      features: ['OAuth2', 'Modern Auth', 'Azure AD'],
      icon: CubeTransparentIcon,
      color: 'blue'
    },
    {
      name: 'Custom SMTP',
      server: '',
      port: 25,
      encryption: 'none',
      auth: 'Plain',
      limits: { daily: 0, hourly: 0, concurrent: 0 },
      features: ['Flexible Configuration'],
      icon: ServerStackIcon,
      color: 'gray'
    }
  ];

  // Test steps
  const testSteps = [
    'DNS Resolution',
    'Port Connectivity',
    'TLS/SSL Handshake',
    'Authentication',
    'Sender Verification',
    'Message Composition',
    'Send Test Email',
    'Delivery Confirmation'
  ];

  const runSMTPTest = async () => {
    setIsTesting(true);
    setTestResults([]);
    setCurrentStep(0);

    for (let i = 0; i < testSteps.length; i++) {
      setCurrentStep(i);

      const result: TestResult = {
        step: testSteps[i],
        status: 'testing',
        message: `Testing ${testSteps[i]}...`
      };

      setTestResults(prev => [...prev, result]);

      // Simulate test delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Simulate test result
      const success = Math.random() > 0.2;
      const duration = Math.random() * 500 + 100;

      setTestResults(prev => prev.map((r, idx) =>
        idx === i ? {
          ...r,
          status: success ? 'success' : (Math.random() > 0.5 ? 'warning' : 'error'),
          message: success
            ? `${testSteps[i]} completed successfully`
            : `${testSteps[i]} failed: ${getErrorMessage(testSteps[i])}`,
          duration,
          details: {
            responseTime: `${duration.toFixed(0)}ms`,
            ...(i === 0 && { resolvedIP: '192.168.1.1' }),
            ...(i === 2 && { tlsVersion: 'TLS 1.3', cipher: 'AES256-GCM-SHA384' }),
            ...(i === 3 && { authMethod: config.authentication }),
            ...(i === 6 && { messageId: `<${Date.now()}@spamgpt.com>` })
          }
        } : r
      ));

      if (!success && Math.random() > 0.5) {
        // Stop test on critical failure
        for (let j = i + 1; j < testSteps.length; j++) {
          setTestResults(prev => [...prev, {
            step: testSteps[j],
            status: 'error',
            message: 'Skipped due to previous failure'
          }]);
        }
        break;
      }
    }

    setIsTesting(false);
  };

  const getErrorMessage = (step: string): string => {
    const errors: Record<string, string[]> = {
      'DNS Resolution': [
        'Could not resolve hostname',
        'DNS lookup timeout',
        'Invalid server address'
      ],
      'Port Connectivity': [
        'Connection refused',
        'Port blocked by firewall',
        'Connection timeout'
      ],
      'TLS/SSL Handshake': [
        'Certificate verification failed',
        'TLS version not supported',
        'Cipher mismatch'
      ],
      'Authentication': [
        'Invalid credentials',
        'Authentication method not supported',
        'Account locked or suspended'
      ],
      'Sender Verification': [
        'Sender domain not verified',
        'SPF record check failed',
        'From address not authorized'
      ],
      'Message Composition': [
        'Invalid message format',
        'Attachment size exceeded',
        'Invalid headers'
      ],
      'Send Test Email': [
        'Rate limit exceeded',
        'Recipient rejected',
        'Message rejected by server'
      ],
      'Delivery Confirmation': [
        'Message bounced',
        'Delivery delayed',
        'Recipient mailbox full'
      ]
    };

    const stepErrors = errors[step] || ['Unknown error'];
    return stepErrors[Math.floor(Math.random() * stepErrors.length)];
  };

  const handleProviderSelect = (providerName: string) => {
    const provider = providers.find(p => p.name === providerName);
    if (provider && provider.server) {
      setConfig(prev => ({
        ...prev,
        server: provider.server,
        port: String(provider.port),
        encryption: provider.encryption
      }));
      setSelectedProvider(providerName);
    }
  };

  const saveConfiguration = () => {
    const name = prompt('Enter a name for this configuration:');
    if (name) {
      setSavedConfigs(prev => [...prev, { name, config: { ...config } }]);
    }
  };

  const loadConfiguration = (savedConfig: SMTPConfig) => {
    setConfig(savedConfig);
  };

  const exportResults = () => {
    const results = testResults.map(r => ({
      ...r,
      timestamp: new Date().toISOString()
    }));

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smtp-test-${Date.now()}.json`;
    a.click();
  };

  const getStepIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-5 h-5 text-blue-300/80" />;
      case 'testing': return <ArrowPathIcon className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />;
      case 'error': return <XCircleIcon className="w-5 h-5 text-fuchsia-400" />;
    }
  };

  const overallStatus = testResults.every(r => r.status === 'success') ? 'success' :
    testResults.some(r => r.status === 'error') ? 'error' :
      testResults.some(r => r.status === 'warning') ? 'warning' : 'pending';

  // Stop conditions and threading thresholds (UI only)
  const [stopConditions, setStopConditions] = useState({
    maxErrors: 100,
    maxInvalid: 500,
    errorRatePct: 20,
    timeLimitMin: 60,
    pauseOnBlacklist: true,
    stopOnBounceSpike: true,
  })
  const [threadingCfg, setThreadingCfg] = useState({
    maxThreads: 64,
    perHost: 8,
    perIp: 16,
    rpsLimit: 50,
  })
  useEffect(() => {
    const id = requestAnimationFrame(() => setInitialLoading(false));
    return () => cancelAnimationFrame(id);
  }, [])
  useEffect(() => {
    try {
      const sc = localStorage.getItem('smtp_stop_conditions')
      const th = localStorage.getItem('smtp_threading_cfg')
      if (sc) setStopConditions({ ...stopConditions, ...JSON.parse(sc) })
      if (th) setThreadingCfg({ ...threadingCfg, ...JSON.parse(th) })
    } catch { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const saveStopConditions = () => {
    localStorage.setItem('smtp_stop_conditions', JSON.stringify(stopConditions))
  }
  const saveThreadingCfg = () => {
    localStorage.setItem('smtp_threading_cfg', JSON.stringify(threadingCfg))
  }

  // Bulk SMTP checker state
  const sessionId = getSessionId() || ''
  const { startBulkCheck, startFileCheck, getProgress, stopCheck, loading: bulkLoading } = useBulkSMTPChecker()
  const [bulkTab, setBulkTab] = useState<'paste' | 'upload'>('paste')
  const [bulkData, setBulkData] = useState('')
  const [bulkThreads, setBulkThreads] = useState(50)
  const [bulkTimeout, setBulkTimeout] = useState(30)
  const [bulkProxy, setBulkProxy] = useState(true)
  const [bulkInboxTest, setBulkInboxTest] = useState(true)
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [bulkProgress, setBulkProgress] = useState<{ total: number; checked: number; valid: number; invalid: number; errors: number; percentage: number; speed: number }>({ total: 0, checked: 0, valid: 0, invalid: 0, errors: 0, percentage: 0, speed: 0 })

  useEffect(() => {
    if (!sessionId || !jobId) return
    const timer = setInterval(async () => {
      try {
        const p = await getProgress(sessionId, jobId)
        setBulkProgress({ total: p.total, checked: p.checked, valid: p.valid, invalid: p.invalid, errors: p.errors, percentage: p.percentage, speed: p.speed })
        if (!p.is_running || p.checked >= p.total) {
          clearInterval(timer)
        }
      } catch {
        // ignore
      }
    }, 2000)
    return () => clearInterval(timer)
  }, [sessionId, jobId, getProgress])

  // Charts like Campaigns
  const smtpPerfData = [
    { time: '00:00', valid: 0, invalid: 0 },
    { time: '04:00', valid: 120, invalid: 40 },
    { time: '08:00', valid: 420, invalid: 160 },
    { time: '12:00', valid: 860, invalid: 310 },
    { time: '16:00', valid: 1220, invalid: 470 },
    { time: '20:00', valid: 1500, invalid: 580 },
    { time: '24:00', valid: 1680, invalid: 640 },
  ]

  return (
    <TooltipProvider>
      <PageShell
        title="SMTP Configuration Tester"
        titleIcon={
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/30">
            <ServerStackIcon className="w-4 h-4 text-primary neon-glow" />
          </span>
        }
        subtitle={isTesting ? 'Testing in progress…' : 'Test and validate your email server configuration'}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Score: 92</Badge>
            <Button variant="outline" onClick={exportResults}><ArrowDownTrayIcon className="w-4 h-4 mr-2" />Export Results</Button>
          </div>
        }
      >
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
        >
          <div className="">
            <div className="p-4 space-y-8">
              {/* Top Monitor Console */}
              <PageConsole
                title="SMTP Live Monitor"
                source="smtp"
                height="md"
                logCategories={["DELIVERY", "AUTH", "ERROR", "QUEUE", "BOUNCE"]}
                showSearch
                showControls
                autoConnect
                className="mb-6"
              />


              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Configuration Panel */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Provider Selection */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="bg-card border-border transition-all">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <RocketLaunchIcon className="w-5 h-5 text-primary" />
                          Quick Setup - Popular Providers
                        </CardTitle>
                        <CardDescription>Select a provider for pre-configured settings</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          {initialLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                              <div key={i} className="p-3 rounded-lg border border-white/10">
                                <div className="flex items-center gap-3">
                                  <Skeleton className="h-6 w-6 rounded" />
                                  <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-3 w-36" />
                                  </div>
                                  <Skeleton className="h-5 w-5 rounded-full" />
                                </div>
                                <Skeleton className="h-3 w-24 mt-3" />
                              </div>
                            ))
                          ) : (
                            providers.map((provider) => (
                              <motion.div
                                key={provider.name}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Card
                                  className={`cursor-pointer transition-all ${selectedProvider === provider.name
                                    ? 'ring-2 ring-primary bg-primary/5'
                                    : 'hover:bg-muted'
                                    }`}
                                  onClick={() => handleProviderSelect(provider.name)}
                                >
                                  <div className="flex items-center gap-3">
                                    <provider.icon className={`w-6 h-6 ${colorToTextClass(provider.color)}`} />
                                    <div className="flex-1">
                                      <div className="font-medium text-white">{provider.name}</div>
                                      <div className="text-xs text-blue-300/80">{provider.server || 'Custom'}</div>
                                    </div>
                                    {selectedProvider === provider.name && (
                                      <CheckCircleIcon className="w-5 h-5 text-primary" />
                                    )}
                                  </div>
                                  {provider.limits.daily > 0 && (
                                    <div className="mt-2 text-xs text-blue-300/80">
                                      {provider.limits.daily.toLocaleString()} emails/day
                                    </div>
                                  )}
                                </Card>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* SMTP Configuration */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="bg-black/60 backdrop-blur-xl border-white/10 hover:border-cyan-500/30 transition-all">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <ServerStackIcon className="w-5 h-5 text-cyan-400" />
                          SMTP Configuration
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">Enter your email server details with AI validation</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue={(initialTab as any) || "connection"} className="w-full">
                          <TabsList className="grid w-full grid-cols-7">
                            <TabsTrigger value="connection" className="flex items-center gap-2">
                              <GlobeAltIcon className="w-4 h-4" />
                              Connection
                            </TabsTrigger>
                            <TabsTrigger value="authentication" className="flex items-center gap-2">
                              <KeyIcon className="w-4 h-4" />
                              Authentication
                            </TabsTrigger>
                            <TabsTrigger value="message" className="flex items-center gap-2">
                              <DocumentTextIcon className="w-4 h-4" />
                              Message
                            </TabsTrigger>
                            <TabsTrigger value="advanced" className="flex items-center gap-2">
                              <AdjustmentsHorizontalIcon className="w-4 h-4" />
                              Advanced
                            </TabsTrigger>
                            <TabsTrigger value="bulk" className="flex items-center gap-2">
                              <DocumentTextIcon className="w-4 h-4" />
                              Bulk Check
                            </TabsTrigger>
                            <TabsTrigger value="stop" className="flex items-center gap-2">
                              <ShieldCheckIcon className="w-4 h-4" />
                              Stop Conditions
                            </TabsTrigger>
                            <TabsTrigger value="threads" className="flex items-center gap-2">
                              <CpuChipIcon className="w-4 h-4" />
                              Threading
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="connection" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="server">SMTP Server</Label>
                                <div className="relative">
                                  <ServerStackIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/80" />
                                  <Input
                                    id="server"
                                    placeholder="smtp.example.com"
                                    value={config.server}
                                    onChange={(e) => setConfig({ ...config, server: e.target.value })}
                                    className="pl-10"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="port">Port</Label>
                                <Select value={config.port} onValueChange={(value) => setConfig({ ...config, port: value })}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="25">25 (SMTP)</SelectItem>
                                    <SelectItem value="465">465 (SMTPS)</SelectItem>
                                    <SelectItem value="587">587 (Submission)</SelectItem>
                                    <SelectItem value="2525">2525 (Alternative)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Encryption</Label>
                              <div className="grid grid-cols-4 gap-2">
                                {(['none', 'ssl', 'tls', 'starttls'] as const).map((enc) => {
                                  const icon = enc === 'none'
                                    ? <NoSymbolIcon className="w-4 h-4" />
                                    : enc === 'ssl'
                                      ? <LockClosedIcon className="w-4 h-4" />
                                      : enc === 'tls'
                                        ? <ShieldCheckIcon className="w-4 h-4" />
                                        : <BoltIcon className="w-4 h-4" />;
                                  return (
                                    <Button
                                      key={enc}
                                      variant={config.encryption === enc ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setConfig({ ...config, encryption: enc })}
                                      className="w-full flex items-center gap-2"
                                    >
                                      {icon}
                                      {enc.toUpperCase()}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="timeout">Connection Timeout (seconds)</Label>
                              <div className="flex items-center gap-4">
                                <Input
                                  id="timeout"
                                  type="number"
                                  min="5"
                                  max="120"
                                  value={config.timeout}
                                  onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
                                  className="w-24"
                                />
                                <div className="flex-1">
                                  <Progress value={(config.timeout / 120) * 100} />
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="authentication" className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>Authentication Method</Label>
                              <Select
                                value={config.authentication}
                                onValueChange={(value: any) => setConfig({ ...config, authentication: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="plain"><div className="flex items-center gap-2"><KeyIcon className="w-4 h-4" /> PLAIN</div></SelectItem>
                                  <SelectItem value="login"><div className="flex items-center gap-2"><KeyIcon className="w-4 h-4" /> LOGIN</div></SelectItem>
                                  <SelectItem value="oauth2"><div className="flex items-center gap-2"><ShieldCheckIcon className="w-4 h-4" /> OAuth 2.0</div></SelectItem>
                                  <SelectItem value="xoauth2"><div className="flex items-center gap-2"><ShieldCheckIcon className="w-4 h-4" /> XOAUTH2</div></SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="username">Username / Email</Label>
                              <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/80" />
                                <Input
                                  id="username"
                                  placeholder="user@example.com"
                                  value={config.username}
                                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                                  className="pl-10"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="password">Password / API Key</Label>
                              <div className="relative">
                                <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/80" />
                                <Input
                                  id="password"
                                  type="password"
                                  placeholder="••••••••"
                                  value={config.password}
                                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                                  className="pl-10"
                                />
                              </div>
                            </div>

                            {config.authentication === 'oauth2' && (
                              <Alert>
                                <InformationCircleIcon className="w-4 h-4" />
                                <AlertDescription>
                                  OAuth 2.0 requires additional setup. Please configure your OAuth credentials in the Advanced tab.
                                </AlertDescription>
                              </Alert>
                            )}
                          </TabsContent>

                          <TabsContent value="message" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="from-email">From Email</Label>
                                <div className="relative">
                                  <AtSymbolIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/80" />
                                  <Input
                                    id="from-email"
                                    placeholder="sender@example.com"
                                    value={config.fromEmail}
                                    onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                                    className="pl-10"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="from-name">From Name</Label>
                                <Input
                                  id="from-name"
                                  placeholder="Your Name"
                                  value={config.fromName}
                                  onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="to-email">Test Recipient Email</Label>
                              <div className="relative">
                                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="to-email"
                                  placeholder="recipient@example.com"
                                  value={config.toEmail}
                                  onChange={(e) => setConfig({ ...config, toEmail: e.target.value })}
                                  className="pl-10"
                                />
                              </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                              <Label htmlFor="subject">Test Email Subject</Label>
                              <Input
                                id="subject"
                                value={testEmail.subject}
                                onChange={(e) => setTestEmail({ ...testEmail, subject: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="body">Test Email Body</Label>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    id="html-mode"
                                    checked={testEmail.isHtml}
                                    onCheckedChange={(checked) => setTestEmail({ ...testEmail, isHtml: checked })}
                                  />
                                  <Label htmlFor="html-mode" className="text-sm">HTML Mode</Label>
                                </div>
                              </div>
                              <Textarea
                                id="body"
                                rows={6}
                                value={testEmail.body}
                                onChange={(e) => setTestEmail({ ...testEmail, body: e.target.value })}
                                className="text-sm"
                              />
                            </div>
                          </TabsContent>

                          <TabsContent value="advanced" className="space-y-4 mt-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label>Enable DKIM Signing</Label>
                                  <p className="text-xs text-blue-300/80">Sign emails with DomainKeys Identified Mail</p>
                                </div>
                                <Switch />
                              </div>

                              <div className="flex items-center justify-between">
                                <div>
                                  <Label>Enable SPF Check</Label>
                                  <p className="text-xs text-blue-300/80">Verify Sender Policy Framework records</p>
                                </div>
                                <Switch />
                              </div>

                              <div className="flex items-center justify-between">
                                <div>
                                  <Label>Enable DMARC Policy</Label>
                                  <p className="text-xs text-blue-300/80">Apply Domain-based Message Authentication</p>
                                </div>
                                <Switch />
                              </div>

                              <div className="flex items-center justify-between">
                                <div>
                                  <Label>Use Connection Pool</Label>
                                  <p className="text-xs text-blue-300/80">Maintain persistent connections for better performance</p>
                                </div>
                                <Switch />
                              </div>

                              <Separator />

                              <div className="space-y-2">
                                <Label>Custom Headers</Label>
                                <Textarea
                                  placeholder="X-Custom-Header: value&#10;X-Another-Header: value"
                                  rows={4}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          </TabsContent>

                          {/* Bulk SMTP Checker Tab */}
                          <TabsContent value="bulk" className="space-y-4 mt-4">
                            <div className="space-y-3">
                              <Tabs value={bulkTab} onValueChange={(v) => setBulkTab(v as any)}>
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="paste">Paste</TabsTrigger>
                                  <TabsTrigger value="upload">Upload</TabsTrigger>
                                </TabsList>
                                <TabsContent value="paste" className="mt-3 space-y-3">
                                  <Label htmlFor="bulk-paste">Combos (mail:pass per line)</Label>
                                  <Textarea id="bulk-paste" rows={6} value={bulkData} onChange={(e) => setBulkData(e.target.value)} className="text-xs" />
                                </TabsContent>
                                <TabsContent value="upload" className="mt-3 space-y-3">
                                  <Input type="file" accept=".txt,.csv" onChange={(e) => setBulkFile(e.target.files?.[0] || null)} />
                                </TabsContent>
                              </Tabs>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Threads</Label>
                                  <Input type="number" min={1} max={200} value={bulkThreads} onChange={(e) => setBulkThreads(parseInt(e.target.value || '50'))} />
                                </div>
                                <div>
                                  <Label>Timeout (s)</Label>
                                  <Input type="number" min={5} max={120} value={bulkTimeout} onChange={(e) => setBulkTimeout(parseInt(e.target.value || '30'))} />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Switch checked={bulkProxy} onCheckedChange={setBulkProxy} id="bulk-proxy-main" />
                                  <Label htmlFor="bulk-proxy-main">Use Proxy</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch checked={bulkInboxTest} onCheckedChange={setBulkInboxTest} id="bulk-inbox-main" />
                                  <Label htmlFor="bulk-inbox-main">Inbox Test</Label>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="sm" disabled={bulkLoading} onClick={async () => {
                                  if (!sessionId) return
                                  try {
                                    if (bulkTab === 'paste') {
                                      const res = await startBulkCheck(sessionId, { combo_data: bulkData, max_threads: bulkThreads, timeout: bulkTimeout, enable_proxy: bulkProxy, enable_inbox_test: bulkInboxTest })
                                      setJobId(res.job_id)
                                    } else if (bulkFile) {
                                      const res = await startFileCheck(sessionId, { file: bulkFile, maxThreads: bulkThreads, timeout: bulkTimeout, enableProxy: bulkProxy, enableInboxTest: bulkInboxTest })
                                      setJobId(res.job_id)
                                    }
                                  } catch { }
                                }}>{bulkLoading ? 'Starting...' : 'Start'}</Button>
                                {jobId && (
                                  <Button size="sm" variant="outline" onClick={async () => { if (sessionId && jobId) { await stopCheck(sessionId, jobId); } }}>Stop</Button>
                                )}
                              </div>
                              {jobId && (
                                <div className="mt-2 space-y-2 text-xs">
                                  <div className="flex justify-between"><span>Checked</span><span>{bulkProgress.checked}/{bulkProgress.total}</span></div>
                                  <Progress value={bulkProgress.percentage} />
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">Valid: {bulkProgress.valid}</div>
                                    <div className="p-2 rounded bg-fuchsia-500/10 border border-fuchsia-500/20">Invalid: {bulkProgress.invalid}</div>
                                    <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">Errors: {bulkProgress.errors}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="stop" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Max Errors</Label>
                                <Input type="number" value={stopConditions.maxErrors} onChange={(e) => setStopConditions({ ...stopConditions, maxErrors: parseInt(e.target.value || '0') })} />
                              </div>
                              <div>
                                <Label>Max Invalid</Label>
                                <Input type="number" value={stopConditions.maxInvalid} onChange={(e) => setStopConditions({ ...stopConditions, maxInvalid: parseInt(e.target.value || '0') })} />
                              </div>
                              <div>
                                <Label>Error Rate %</Label>
                                <Input type="number" value={stopConditions.errorRatePct} onChange={(e) => setStopConditions({ ...stopConditions, errorRatePct: parseInt(e.target.value || '0') })} />
                              </div>
                              <div>
                                <Label>Time Limit (min)</Label>
                                <Input type="number" value={stopConditions.timeLimitMin} onChange={(e) => setStopConditions({ ...stopConditions, timeLimitMin: parseInt(e.target.value || '0') })} />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Switch checked={stopConditions.pauseOnBlacklist} onCheckedChange={(v) => setStopConditions({ ...stopConditions, pauseOnBlacklist: v })} id="pause-on-bl" />
                                <Label htmlFor="pause-on-bl">Pause on blacklist hits</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch checked={stopConditions.stopOnBounceSpike} onCheckedChange={(v) => setStopConditions({ ...stopConditions, stopOnBounceSpike: v })} id="stop-on-bounce" />
                                <Label htmlFor="stop-on-bounce">Stop on bounce spike</Label>
                              </div>
                            </div>
                            <div className="text-right">
                              <Button size="sm" variant="outline" onClick={saveStopConditions}><CheckCircleIcon className="w-4 h-4 mr-2" />Save</Button>
                            </div>
                          </TabsContent>

                          <TabsContent value="threads" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Max Threads</Label>
                                <Input type="number" min={1} max={256} value={threadingCfg.maxThreads} onChange={(e) => setThreadingCfg({ ...threadingCfg, maxThreads: parseInt(e.target.value || '1') })} />
                              </div>
                              <div>
                                <Label>Per Host</Label>
                                <Input type="number" min={1} max={64} value={threadingCfg.perHost} onChange={(e) => setThreadingCfg({ ...threadingCfg, perHost: parseInt(e.target.value || '1') })} />
                              </div>
                              <div>
                                <Label>Per IP</Label>
                                <Input type="number" min={1} max={128} value={threadingCfg.perIp} onChange={(e) => setThreadingCfg({ ...threadingCfg, perIp: parseInt(e.target.value || '1') })} />
                              </div>
                              <div>
                                <Label>RPS Limit</Label>
                                <Input type="number" min={1} max={1000} value={threadingCfg.rpsLimit} onChange={(e) => setThreadingCfg({ ...threadingCfg, rpsLimit: parseInt(e.target.value || '1') })} />
                              </div>
                            </div>
                            <div className="text-right">
                              <Button size="sm" variant="outline" onClick={saveThreadingCfg}><CheckCircleIcon className="w-4 h-4 mr-2" />Save</Button>
                            </div>
                          </TabsContent>
                        </Tabs>

                        <div className="flex justify-between items-center mt-6">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={saveConfiguration}
                            >
                              <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                              Save Config
                            </Button>

                            {savedConfigs.length > 0 && (
                              <Select onValueChange={(value) => {
                                const config = savedConfigs.find(c => c.name === value);
                                if (config) loadConfiguration(config.config);
                              }}>
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Load saved config" />
                                </SelectTrigger>
                                <SelectContent>
                                  {savedConfigs.map((config) => (
                                    <SelectItem key={config.name} value={config.name}>
                                      {config.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          <Button
                            onClick={runSMTPTest}
                            className={isTesting ? 'animate-pulse' : ''}
                          >
                            {isTesting ? (
                              <>
                                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              <>
                                <PlayIcon className="w-4 h-4 mr-2" />
                                Run SMTP Test
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Test Results & Console Panel */}
                <motion.div
                  className="lg:col-span-1 space-y-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {/* Small live console removed */}

                  {/* Overall Status */}
                  <Card className="bg-black/60 backdrop-blur-xl border-white/10 hover:border-cyan-500/30 transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Test Status</span>
                        <Badge variant={isTesting ? 'secondary' : overallStatus === 'success' ? 'default' : overallStatus === 'error' ? 'destructive' : 'secondary'}>
                          {isTesting ? 'Testing…' : overallStatus}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {isTesting && (
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-blue-300/80">Testing step {currentStep + 1} of {testSteps.length}</span>
                              <span className="text-cyan-400">{Math.round(((currentStep + 1) / testSteps.length) * 100)}%</span>
                            </div>
                            <ProgressBar
                              progress={((currentStep + 1) / testSteps.length) * 100}
                              active={true}
                            />
                          </div>
                        )}

                        {testResults.length > 0 && (
                          <ScrollArea className="h-[400px]">
                            <div className="space-y-2">
                              {testResults.map((result, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className={`p-3 rounded-lg border ${result.status === 'success' ? 'bg-green-500/10 border-green-500/30' :
                                    result.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                                      result.status === 'error' ? 'bg-fuchsia-500/10 border-fuchsia-500/30' :
                                        result.status === 'testing' ? 'bg-blue-500/10 border-blue-500/30' :
                                          'bg-muted/10 border-border/30'
                                    }`}
                                >
                                  <div className="flex items-start gap-3">
                                    {getStepIcon(result.status)}
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-white">{result.step}</span>
                                        {result.duration && (
                                          <span className="text-xs text-blue-300/80">
                                            {result.duration.toFixed(0)}ms
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-blue-300/80 mt-1">{result.message}</p>
                                      {result.details && (
                                        <div className="mt-2 text-xs text-blue-300/80">
                                          {Object.entries(result.details).map(([key, value]) => (
                                            <div key={key}>
                                              {key}: <span className="text-muted-foreground">{String(value)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}

                        {!isTesting && testResults.length === 0 && (
                          <div className="text-center py-8">
                            <BeakerIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                            <p className="text-blue-300/80">No test results yet</p>
                            <p className="text-sm text-blue-300/80 mt-1">Configure your SMTP settings and run a test</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Connection Info */}
                  {testResults.length > 0 && (
                    <Card className="bg-black/60 backdrop-blur-xl border-white/10 hover:border-cyan-500/30 transition-all">
                      <CardHeader>
                        <CardTitle className="text-sm text-white flex items-center gap-2">
                          <WifiIcon className="w-4 h-4 text-cyan-400" />
                          Connection Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-300/80">Server</span>
                            <span className="text-white">{config.server}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-300/80">Port</span>
                            <span className="text-white">{config.port}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-300/80">Encryption</span>
                            <Badge variant="outline">{config.encryption.toUpperCase()}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-300/80">Auth Method</span>
                            <Badge variant="outline">{config.authentication.toUpperCase()}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Blacklist Check */}
                  <Card className="bg-black/60 backdrop-blur-xl border-white/10 hover:border-cyan-500/30 transition-all">
                    <CardHeader>
                      <CardTitle className="text-sm text-white flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4 text-cyan-400" />
                        Quick Blacklist Check
                      </CardTitle>
                      <CardDescription>Check domain against common reputation sources</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <QuickBlacklistForm />
                    </CardContent>
                  </Card>

                  {/* Bulk SMTP Checker (Paste/Upload) */}
                  <Card className="bg-black/60 backdrop-blur-xl border-white/10 hover:border-cyan-500/30 transition-all">
                    <CardHeader>
                      <CardTitle className="text-sm text-white">Bulk SMTP Check</CardTitle>
                      <CardDescription>Paste combos or upload a mail:pass file</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Tabs value={bulkTab} onValueChange={(v) => setBulkTab(v as any)}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="paste">Paste</TabsTrigger>
                          <TabsTrigger value="upload">Upload</TabsTrigger>
                        </TabsList>
                        <TabsContent value="paste" className="mt-3 space-y-3">
                          <Label htmlFor="bulk-paste">Combos (mail:pass per line)</Label>
                          <Textarea id="bulk-paste" rows={5} value={bulkData} onChange={(e) => setBulkData(e.target.value)} className="text-xs" />
                        </TabsContent>
                        <TabsContent value="upload" className="mt-3 space-y-3">
                          <Input type="file" accept=".txt,.csv" onChange={(e) => setBulkFile(e.target.files?.[0] || null)} />
                        </TabsContent>
                      </Tabs>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Threads</Label>
                          <Input type="number" min={1} max={200} value={bulkThreads} onChange={(e) => setBulkThreads(parseInt(e.target.value || '50'))} />
                        </div>
                        <div>
                          <Label>Timeout (s)</Label>
                          <Input type="number" min={5} max={120} value={bulkTimeout} onChange={(e) => setBulkTimeout(parseInt(e.target.value || '30'))} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch checked={bulkProxy} onCheckedChange={setBulkProxy} id="bulk-proxy" />
                          <Label htmlFor="bulk-proxy">Use Proxy</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={bulkInboxTest} onCheckedChange={setBulkInboxTest} id="bulk-inbox" />
                          <Label htmlFor="bulk-inbox">Inbox Test</Label>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" disabled={bulkLoading} onClick={async () => {
                          if (!sessionId) return
                          try {
                            if (bulkTab === 'paste') {
                              const res = await startBulkCheck(sessionId, { combo_data: bulkData, max_threads: bulkThreads, timeout: bulkTimeout, enable_proxy: bulkProxy, enable_inbox_test: bulkInboxTest })
                              setJobId(res.job_id)
                            } else if (bulkFile) {
                              const res = await startFileCheck(sessionId, { file: bulkFile, maxThreads: bulkThreads, timeout: bulkTimeout, enableProxy: bulkProxy, enableInboxTest: bulkInboxTest })
                              setJobId(res.job_id)
                            }
                          } catch { }
                        }}>{bulkLoading ? 'Starting...' : 'Start'}</Button>
                        {jobId && (
                          <Button size="sm" variant="outline" onClick={async () => { if (sessionId && jobId) { await stopCheck(sessionId, jobId); } }}>Stop</Button>
                        )}
                      </div>
                      {jobId && (
                        <div className="mt-2 space-y-2 text-xs">
                          <div className="flex justify-between"><span>Checked</span><span>{bulkProgress.checked}/{bulkProgress.total}</span></div>
                          <Progress value={bulkProgress.percentage} />
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">Valid: {bulkProgress.valid}</div>
                            <div className="p-2 rounded bg-fuchsia-500/10 border border-fuchsia-500/20">Invalid: {bulkProgress.invalid}</div>
                            <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">Errors: {bulkProgress.errors}</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Large Analytics under Console */}
              <div className="mt-6">
                <Card className="p-4 md:p-4 hover:border-cyan-500/30 transition-all">
                  <div className="flex items-center gap-2 mb-4">
                    <ChartBarIcon className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-white">SMTP Bulk Performance</h3>
                  </div>
                  {initialLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={smtpPerfData}>
                        <defs>
                          <linearGradient id="smtpValid" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="smtpInvalid" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="time" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0b1220', border: '1px solid rgba(34,211,238,0.25)', boxShadow: '0 0 24px rgba(34,211,238,0.12)' }} />
                        <Area type="monotone" dataKey="valid" stroke="#22d3ee" fillOpacity={1} fill="url(#smtpValid)" />
                        <Area type="monotone" dataKey="invalid" stroke="#f43f5e" fillOpacity={1} fill="url(#smtpInvalid)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>

            </div>
          </div>
        </motion.div>
      </PageShell>
    </TooltipProvider>
  );
};

export default SMTPCheckerPage;

// Small reusable quick blacklist form
const QuickBlacklistForm: React.FC = () => {
  const [domain, setDomain] = React.useState('')
  const [status, setStatus] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="qb-domain">Domain</Label>
        <Input id="qb-domain" placeholder="example.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" disabled={loading} onClick={async () => {
          if (!domain.trim()) return
          setLoading(true); setStatus('Checking...')
          try {
            const api = BlacklistApiFactory()
            const res = await api.checkDomainBlacklistApiV1BlacklistBlacklistDomainDomainGet(domain.trim())
            const data = (res as any)?.data ?? res
            const bad = Array.isArray(data?.hits) ? data.hits.length : (data?.blacklisted ? 1 : 0)
            setStatus(bad ? `Listed on ${bad} lists` : 'Not listed')
          } catch (e) {
            setStatus('Check failed')
          } finally {
            setLoading(false)
          }
        }}>{loading ? 'Checking...' : 'Check'}</Button>
        {status && (
          <Badge variant={status.includes('Not') ? 'outline' : 'destructive'}>{status}</Badge>
        )}
      </div>
    </div>
  )
}
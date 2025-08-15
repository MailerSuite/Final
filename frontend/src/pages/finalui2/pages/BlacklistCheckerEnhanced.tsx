import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageShell from '../components/PageShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
  ShieldCheckIcon,
  ShieldExclamationIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  GlobeAltIcon,
  ServerStackIcon,
  WifiIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  SparklesIcon,
  BoltIcon,
  FireIcon,
  LockClosedIcon,
  EnvelopeIcon,
  AtSymbolIcon,
  SignalIcon,
  CloudIcon,
  CpuChipIcon,
  CommandLineIcon,
  FlagIcon,
  MapPinIcon,
  FingerPrintIcon,
  EyeIcon,
  NoSymbolIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';
// Removed design-system/ui-kit usage; using shadcn components

interface BlacklistProvider {
  id: string;
  name: string;
  url: string;
  type: 'rbl' | 'dnsbl' | 'surbl' | 'reputation';
  description: string;
  checkMethod: 'dns' | 'api' | 'web';
  severity: 'low' | 'medium' | 'high' | 'critical';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface BlacklistResult {
  provider: BlacklistProvider;
  status: 'clean' | 'listed' | 'timeout' | 'error' | 'checking';
  reason?: string;
  listedDate?: Date;
  delistUrl?: string;
  confidence: number;
  impact: string;
  checkTime: number;
}

interface DomainReputation {
  domain: string;
  ip: string;
  overallScore: number;
  totalProviders: number;
  cleanProviders: number;
  listedProviders: number;
  lastChecked: Date;
  history: {
    date: Date;
    score: number;
    listings: number;
  }[];
}

const BlacklistCheckerEnhanced: React.FC = () => {
  const [checkType, setCheckType] = useState<'ip' | 'domain' | 'email'>('domain');
  const [inputValue, setInputValue] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<BlacklistResult[]>([]);
  const [reputation, setReputation] = useState<DomainReputation | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [autoCheck, setAutoCheck] = useState(false);
  const [checkHistory, setCheckHistory] = useState<unknown[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);

  // Major blacklist providers
  const providers: BlacklistProvider[] = [
    // Critical RBLs
    {
      id: 'spamhaus',
      name: 'Spamhaus',
      url: 'zen.spamhaus.org',
      type: 'rbl',
      description: 'Most widely used anti-spam DNS blacklist',
      checkMethod: 'dns',
      severity: 'critical',
      icon: ShieldExclamationIcon,
      color: 'red'
    },
    {
      id: 'barracuda',
      name: 'Barracuda',
      url: 'b.barracudacentral.org',
      type: 'rbl',
      description: 'Barracuda Reputation Block List',
      checkMethod: 'dns',
      severity: 'high',
      icon: FireIcon,
      color: 'orange'
    },
    {
      id: 'spamcop',
      name: 'SpamCop',
      url: 'bl.spamcop.net',
      type: 'rbl',
      description: 'SpamCop Blocking List',
      checkMethod: 'dns',
      severity: 'high',
      icon: HandRaisedIcon,
      color: 'yellow'
    },
    // DNS Blacklists
    {
      id: 'surbl',
      name: 'SURBL',
      url: 'multi.surbl.org',
      type: 'surbl',
      description: 'Spam URI Realtime Blocklists',
      checkMethod: 'dns',
      severity: 'high',
      icon: GlobeAltIcon,
      color: 'blue'
    },
    {
      id: 'uribl',
      name: 'URIBL',
      url: 'multi.uribl.com',
      type: 'surbl',
      description: 'Realtime URI Blacklist',
      checkMethod: 'dns',
      severity: 'medium',
      icon: CloudIcon,
      color: 'cyan'
    },
    {
      id: 'sorbs',
      name: 'SORBS',
      url: 'dnsbl.sorbs.net',
      type: 'dnsbl',
      description: 'Spam and Open Relay Blocking System',
      checkMethod: 'dns',
      severity: 'medium',
      icon: ServerStackIcon,
      color: 'purple'
    },
    // Reputation Services
    {
      id: 'mxtoolbox',
      name: 'MXToolbox',
      url: 'mxtoolbox.com',
      type: 'reputation',
      description: 'Comprehensive email deliverability tool',
      checkMethod: 'api',
      severity: 'medium',
      icon: CommandLineIcon,
      color: 'green'
    },
    {
      id: 'senderscore',
      name: 'Sender Score',
      url: 'senderscore.org',
      type: 'reputation',
      description: 'Return Path sender reputation',
      checkMethod: 'api',
      severity: 'medium',
      icon: ChartBarIcon,
      color: 'pink'
    },
    {
      id: 'talos',
      name: 'Cisco Talos',
      url: 'talosintelligence.com',
      type: 'reputation',
      description: 'Cisco Talos Intelligence reputation',
      checkMethod: 'web',
      severity: 'high',
      icon: ShieldCheckIcon,
      color: 'gray'
    },
    {
      id: 'abuseat',
      name: 'AbuseAt CBL',
      url: 'cbl.abuseat.org',
      type: 'rbl',
      description: 'Composite Blocking List',
      checkMethod: 'dns',
      severity: 'high',
      icon: NoSymbolIcon,
      color: 'red'
    },
    {
      id: 'proofpoint',
      name: 'Proofpoint',
      url: 'proofpoint.com',
      type: 'reputation',
      description: 'Proofpoint Dynamic Reputation',
      checkMethod: 'api',
      severity: 'high',
      icon: FingerPrintIcon,
      color: 'indigo'
    },
    {
      id: 'invaluement',
      name: 'Invaluement',
      url: 'invaluement.com',
      type: 'reputation',
      description: 'Anti-spam DNSBL and reputation',
      checkMethod: 'dns',
      severity: 'medium',
      icon: EyeIcon,
      color: 'teal'
    },
    {
      id: 'nordspam',
      name: 'NordSpam',
      url: 'bl.nordspam.com',
      type: 'dnsbl',
      description: 'Nordic spam protection',
      checkMethod: 'dns',
      severity: 'low',
      icon: MapPinIcon,
      color: 'blue'
    },
    {
      id: 'backscatter',
      name: 'Backscatterer',
      url: 'ips.backscatterer.org',
      type: 'rbl',
      description: 'Backscatter detection list',
      checkMethod: 'dns',
      severity: 'low',
      icon: ArrowPathIcon,
      color: 'gray'
    },
    {
      id: 'truncate',
      name: 'Truncate',
      url: 'truncate.gbudb.net',
      type: 'dnsbl',
      description: 'GBUdb Truncate blocklist',
      checkMethod: 'dns',
      severity: 'low',
      icon: WifiIcon,
      color: 'yellow'
    }
  ];

  const runBlacklistCheck = async () => {
    if (!inputValue) return;

    setIsChecking(true);
    setResults([]);
    setCurrentProgress(0);

    // Initialize all providers as checking
    const initialResults: BlacklistResult[] = providers.map(provider => ({
      provider,
      status: 'checking',
      confidence: 0,
      impact: 'Checking...',
      checkTime: 0
    }));
    setResults(initialResults);

    // Simulate checking each provider
    for (let i = 0; i < providers.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

      const provider = providers[i];
      const isListed = Math.random() > 0.85; // 15% chance of being listed
      const checkTime = Math.random() * 500 + 100;

      const result: BlacklistResult = {
        provider,
        status: Math.random() > 0.95 ? 'timeout' : (isListed ? 'listed' : 'clean'),
        reason: isListed ? getRandomReason() : undefined,
        listedDate: isListed ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
        delistUrl: isListed ? `https://${provider.url}/delist` : undefined,
        confidence: Math.random() * 40 + 60,
        impact: getImpactLevel(provider.severity, isListed),
        checkTime
      };

      setResults(prev => prev.map((r, idx) => idx === i ? result : r));
      setCurrentProgress((i + 1) / providers.length * 100);
    }

    // Calculate reputation
    const listedCount = initialResults.filter(r => r.status === 'listed').length;
    const score = Math.max(0, 100 - (listedCount / providers.length * 100));

    setReputation({
      domain: inputValue,
      ip: '192.168.1.1', // Mock IP
      overallScore: Math.round(score),
      totalProviders: providers.length,
      cleanProviders: providers.length - listedCount,
      listedProviders: listedCount,
      lastChecked: new Date(),
      history: generateHistory()
    });

    // Add to history
    setCheckHistory(prev => [{
      id: Date.now(),
      value: inputValue,
      type: checkType,
      date: new Date(),
      score,
      listings: listedCount
    }, ...prev].slice(0, 10));

    setIsChecking(false);
  };

  const getRandomReason = () => {
    const reasons = [
      'Spam complaints from multiple recipients',
      'Suspicious email patterns detected',
      'Open relay configuration',
      'Compromised account activity',
      'Bulk email without proper authentication',
      'Policy violation - unsolicited email',
      'Malware distribution detected',
      'Phishing attempts reported',
      'Bot network participation',
      'Rate limit violations'
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  };

  const getImpactLevel = (severity: BlacklistProvider['severity'], isListed: boolean) => {
    if (!isListed) return 'None';
    switch (severity) {
      case 'critical': return 'Severe - Major ISPs will reject';
      case 'high': return 'High - Significant delivery impact';
      case 'medium': return 'Moderate - Some providers affected';
      case 'low': return 'Low - Minor impact';
      default: return 'Unknown';
    }
  };

  const generateHistory = () => {
    const history = [];
    for (let i = 0; i < 30; i++) {
      history.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        score: Math.max(60, Math.min(100, 85 + Math.random() * 20 - 10)),
        listings: Math.floor(Math.random() * 3)
      });
    }
    return history.reverse();
  };

  const getStatusIcon = (status: BlacklistResult['status']) => {
    switch (status) {
      case 'clean': return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'listed': return <XCircleIcon className="w-5 h-5 text-fuchsia-400" />;
      case 'timeout': return <ClockIcon className="w-5 h-5 text-yellow-400" />;
      case 'error': return <ExclamationTriangleIcon className="w-5 h-5 text-orange-400" />;
      case 'checking': return <ArrowPathIcon className="w-5 h-5 text-primary animate-spin" />;
    }
  };

  const getStatusColor = (status: BlacklistResult['status']) => {
    switch (status) {
      case 'clean': return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'listed': return 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400';
      case 'timeout': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'error': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'checking': return 'bg-cyan-500/10 border-cyan-500/30 text-primary';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-primary';
    if (score >= 50) return 'text-yellow-400';
    return 'text-fuchsia-400';
  };

  const exportResults = () => {
    const data = {
      checked: inputValue,
      type: checkType,
      date: new Date().toISOString(),
      reputation,
      results: results.map(r => ({
        provider: r.provider.name,
        status: r.status,
        reason: r.reason,
        impact: r.impact
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blacklist-check-${Date.now()}.json`;
    a.click();
  };

  // Auto-check every 5 minutes if enabled
  useEffect(() => {
    if (!autoCheck || !inputValue) return;

    const interval = setInterval(() => {
      runBlacklistCheck();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoCheck, inputValue]);

  const listedProviders = results.filter(r => r.status === 'listed');
  const cleanProviders = results.filter(r => r.status === 'clean');

  return (
    <TooltipProvider>
      <PageShell
        title="Blacklist & Reputation Checker"
        titleIcon={
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/30">
            <ShieldCheckIcon className="w-4 h-4 text-primary neon-glow" />
          </span>
        }
        subtitle="Check your domain, IP, or email against major blacklists"
      >
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
        >
          {/* Live Results Monitor */}
          {results.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Live Monitor</span>
                  <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-300">
                    <WifiIcon className="w-3 h-3 mr-1 animate-pulse" />
                    Streaming
                  </Badge>
                </CardTitle>
                <CardDescription>Real-time blacklist check events</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Summary strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <div className="p-2 rounded bg-black/40 border border-white/10 text-xs">
                    <div className="text-muted-foreground">Target</div>
                    <div className="truncate text-foreground">{inputValue}</div>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/10 text-xs">
                    <div className="text-muted-foreground">Total</div>
                    <div className="text-foreground">{providers.length}</div>
                  </div>
                  <div className="p-2 rounded bg-green-500/10 border border-green-500/30 text-xs">
                    <div className="text-green-400">Clean</div>
                    <div className="text-green-300">{cleanProviders.length}</div>
                  </div>
                  <div className="p-2 rounded bg-fuchsia-500/10 border border-fuchsia-500/30 text-xs">
                    <div className="text-fuchsia-400">Listed</div>
                    <div className="text-fuchsia-300">{listedProviders.length}</div>
                  </div>
                </div>

                {/* Score */}
                {reputation && (
                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <span className="text-muted-foreground">Reputation Score:</span>
                    <Badge variant="outline" className={`border-current ${getScoreColor(reputation.overallScore)}`}>
                      {reputation.overallScore}
                    </Badge>
                    <span className="ml-auto text-xs text-muted-foreground">Last checked {reputation.lastChecked.toLocaleTimeString()}</span>
                  </div>
                )}

                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {[...results].slice(-20).reverse().map((r, idx) => (
                      <div key={idx} className="p-3 bg-black/40 rounded-lg border border-white/10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 min-w-0">
                            {getStatusIcon(r.status)}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm text-foreground truncate max-w-[220px] sm:max-w-[360px]">
                                  {r.provider.name}
                                </span>
                                <Badge variant="outline" className={`text-[10px] ${getStatusColor(r.status)} border-current capitalize`}>
                                  {r.status}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] border-white/10 capitalize">
                                  {r.provider.type}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${
                                    r.provider.severity === 'critical' ? 'border-fuchsia-500/30 text-fuchsia-400' :
                                    r.provider.severity === 'high' ? 'border-orange-500/30 text-orange-400' :
                                    r.provider.severity === 'medium' ? 'border-yellow-500/30 text-yellow-400' :
                                    'border-border/30 text-muted-foreground'
                                  }`}
                                >
                                  {r.provider.severity}
                                </Badge>
                              </div>
                              {r.status === 'listed' && (
                                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                                  {r.reason && (
                                    <span className="truncate max-w-[320px]">Reason: {r.reason}</span>
                                  )}
                                  {r.listedDate && (
                                    <span>Listed: {r.listedDate.toLocaleDateString()}</span>
                                  )}
                                  {r.delistUrl && (
                                    <a href={r.delistUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-cyan-300">Delist →</a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                            <span>{r.checkTime.toFixed(0)}ms</span>
                            <span>{r.confidence.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
          {/* Header actions */}
          <div className="mb-6">
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-3">
                {reputation && (
                  <Badge variant="secondary">Rep: {reputation.overallScore}</Badge>
                )}
                <Button
                  variant="outline"
                  onClick={exportResults}
                  disabled={results.length === 0}
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Check Input */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Select value={checkType} onValueChange={(value: unknown) => setCheckType(value)}>
                    <SelectTrigger className="w-40 bg-black/40 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="domain">Domain</SelectItem>
                      <SelectItem value="ip">IP Address</SelectItem>
                      <SelectItem value="email">Email Address</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder={
                        checkType === 'domain' ? 'example.com' :
                          checkType === 'ip' ? '192.168.1.1' :
                            'user@example.com'
                      }
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="pl-10 bg-black/40 border-white/10"
                    />
                  </div>

                  <Button
                    onClick={runBlacklistCheck}
                    disabled={!inputValue || isChecking}
                    className={isChecking ? 'animate-pulse' : ''}
                  >
                    {isChecking ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                        Check Now
                      </>
                    )}
                  </Button>
                </div>

                {isChecking && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Checking {providers.length} providers...</span>
                      <span className="text-primary">{Math.round(currentProgress)}%</span>
                    </div>
                    <Progress value={currentProgress} />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={autoCheck}
                        onChange={(e) => setAutoCheck(e.target.checked)}
                        className="rounded border-white/20"
                      />
                      Auto-check every 5 minutes
                    </label>
                  </div>

                  {results.length > 0 && (
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-400">
                        <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                        {cleanProviders.length} Clean
                      </span>
                      <span className="text-fuchsia-400">
                        <XCircleIcon className="w-4 h-4 inline mr-1" />
                        {listedProviders.length} Listed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Providers List */}
              <div className="col-span-2">
                <Card className="">
                  <CardHeader>
                    <CardTitle>Blacklist Providers</CardTitle>
                    <CardDescription>
                      Checking against {providers.length} major blacklist and reputation services
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-3">
                        {results.map((result, idx) => (
                          <motion.div
                            key={result.provider.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`p-4 rounded-lg border ${getStatusColor(result.status)} cursor-pointer transition-all hover:scale-[1.02]`}
                            onClick={() => setSelectedProvider(result.provider.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                {getStatusIcon(result.status)}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-foreground">{result.provider.name}</h4>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${result.provider.severity === 'critical' ? 'border-fuchsia-500/30 text-fuchsia-400' :
                                          result.provider.severity === 'high' ? 'border-orange-500/30 text-orange-400' :
                                            result.provider.severity === 'medium' ? 'border-yellow-500/30 text-yellow-400' :
                                              'border-border/30 text-muted-foreground'
                                        }`}
                                    >
                                      {result.provider.severity}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground">
                                      {result.provider.type.toUpperCase()}
                                    </Badge>
                                  </div>

                                  <p className="text-sm text-muted-foreground mb-2">{result.provider.description}</p>

                                  {result.status === 'listed' && result.reason && (
                                    <Alert className="mt-2 bg-fuchsia-500/10 border-fuchsia-500/30">
                                      <ExclamationTriangleIcon className="w-4 h-4 text-fuchsia-400" />
                                      <AlertDescription className="text-fuchsia-300">
                                        {result.reason}
                                      </AlertDescription>
                                    </Alert>
                                  )}

                                  {result.status === 'listed' && (
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      <span>Listed: {result.listedDate?.toLocaleDateString()}</span>
                                      <a
                                        href={result.delistUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:text-cyan-300"
                                      >
                                        Request Delisting →
                                      </a>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>Impact: {result.impact}</span>
                                    <span>Check time: {result.checkTime.toFixed(0)}ms</span>
                                    <span>Confidence: {result.confidence.toFixed(0)}%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Reputation Summary */}
              <div className="space-y-6">
                {reputation && (
                  <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Reputation Score</span>
                        <span className={`inline-block w-2 h-2 rounded-full ${reputation.overallScore >= 90 ? 'bg-cyan-500 animate-pulse' : 'bg-fuchsia-500'}`} />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center mb-6">
                        <div className="relative w-32 h-32">
                          <svg className="w-32 h-32 transform -rotate-90">
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="rgba(255, 255, 255, 0.1)"
                              strokeWidth="12"
                              fill="none"
                            />
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="url(#gradient)"
                              strokeWidth="12"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 56}`}
                              strokeDashoffset={`${2 * Math.PI * 56 * (1 - reputation.overallScore / 100)}`}
                              strokeLinecap="round"
                            />
                            <defs>
                              <linearGradient id="gradient">
                                <stop offset="0%" stopColor="#22d3ee" />
                                <stop offset="100%" stopColor="#3b82f6" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <p className={`text-3xl font-bold ${getScoreColor(reputation.overallScore)}`}>
                                {reputation.overallScore}
                              </p>
                              <p className="text-xs text-muted-foreground">Score</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Checked</span>
                          <span className="text-foreground">{reputation.totalProviders}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Clean</span>
                          <span className="text-green-400">{reputation.cleanProviders}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Listed</span>
                          <span className="text-fuchsia-400">{reputation.listedProviders}</span>
                        </div>

                        <Separator className="bg-white/10 my-3" />

                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Reputation Trend (30 days)</Label>
                          <div className="h-20 flex items-end gap-1">
                            {reputation.history.slice(-14).map((h, idx) => (
                              <div
                                key={idx}
                                className="flex-1 bg-gradient-to-t from-cyan-500/50 to-cyan-500/20 rounded-t"
                                style={{ height: `${h.score}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Checks */}
                {checkHistory.length > 0 && (
                  <Card className="">
                    <CardHeader>
                      <CardTitle className="text-sm">Recent Checks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {checkHistory.map((check) => (
                            <div
                              key={check.id}
                              className="p-2 bg-black/40 rounded-lg text-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground truncate">{check.value}</span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getScoreColor(check.score)} border-current`}
                                >
                                  {check.score}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {check.date.toLocaleTimeString()}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {check.listings} listings
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {results.length === 0 && !isChecking && (
            <Card className="">
              <CardContent className="py-20 text-center">
                <ShieldCheckIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium text-foreground mb-2">Check Your Reputation</h3>
                <p className="text-muted-foreground mb-6">
                  Enter a domain, IP address, or email to check against {providers.length} major blacklists
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setInputValue('example.com');
                      setCheckType('domain');
                    }}
                  >
                    Try Example Domain
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setInputValue('192.168.1.1');
                      setCheckType('ip');
                    }}
                  >
                    Try Example IP
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </PageShell>
    </TooltipProvider>
  );
};

export default BlacklistCheckerEnhanced;
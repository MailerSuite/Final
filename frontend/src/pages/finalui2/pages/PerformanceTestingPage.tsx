/**
 * Enhanced Performance Testing & Monitoring Page
 * Comprehensive performance analysis, testing, and real-time monitoring
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Play,
  Square,
  Pause,
  Target,
  Gauge,
  Server,
  Database,
  Globe,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Settings,
  Rocket,
  Shield,
  Timer,
  Users,
  Mail,
  Send,
  Inbox,
  Loader2
} from 'lucide-react';
import { CompactDataTable, type CompactEntry } from "../components/CompactDataTable";
import PageShell from '@/pages/finalui2/components/PageShell';
import { toast } from 'sonner';

// Types
interface PerformanceMetrics {
  responseTime: { current: number; average: number; trend: 'up' | 'down' | 'stable'; threshold: number };
  throughput: { current: number; average: number; trend: 'up' | 'down' | 'stable'; threshold: number };
  errorRate: { current: number; average: number; trend: 'up' | 'down' | 'stable'; threshold: number };
  cpuLoad: { current: number; average: number; trend: 'up' | 'down' | 'stable'; threshold: number };
  memoryUsage: { current: number; average: number; trend: 'up' | 'down' | 'stable'; threshold: number };
  diskIO: { current: number; average: number; trend: 'up' | 'down' | 'stable'; threshold: number };
}

interface SystemResources {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  connections: number;
}

interface PerformanceTest {
  id: string;
  name: string;
  type: 'load' | 'stress' | 'spike' | 'endurance' | 'smtp' | 'imap';
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  duration: number;
  targetRPS: number;
  concurrentUsers: number;
  progress: number;
  results?: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    rpsAchieved: number;
    errorRate: number;
  };
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const PerformanceTestingPage: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('1h');
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [runningTests, setRunningTests] = useState<PerformanceTest[]>([]);
  const [completedTests, setCompletedTests] = useState<PerformanceTest[]>([]);

  // Performance metrics
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    responseTime: { current: 125, average: 118, trend: 'stable', threshold: 500 },
    throughput: { current: 1250, average: 1180, trend: 'up', threshold: 1000 },
    errorRate: { current: 0.8, average: 1.2, trend: 'down', threshold: 2.0 },
    cpuLoad: { current: 45, average: 42, trend: 'stable', threshold: 80 },
    memoryUsage: { current: 68, average: 65, trend: 'up', threshold: 85 },
    diskIO: { current: 850, average: 820, trend: 'stable', threshold: 1000 }
  });

  const [systemResources, setSystemResources] = useState<SystemResources>({
    cpu: 45,
    memory: 68,
    disk: 72,
    network: 35,
    connections: 156
  });

  // Mock data for recent benchmarks
  const results: CompactEntry[] = [
    { id: 'p1', country: 'US', host: 'smtp.us-east-1', type: 'SMTP', responseMs: 42, ssl: 'STARTTLS', aiPrediction: 'Excellent' },
    { id: 'p2', country: 'DE', host: 'imap.eu-central-1', type: 'IMAP', responseMs: 87, ssl: 'SSL', aiPrediction: 'Good' },
    { id: 'p3', country: 'JP', host: 'smtp.asia-pacific-1', type: 'SMTP', responseMs: 156, ssl: 'STARTTLS', aiPrediction: 'Fair' },
    { id: 'p4', country: 'AU', host: 'imap.australia-1', type: 'IMAP', responseMs: 203, ssl: 'SSL', aiPrediction: 'Poor' },
  ];

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMetrics(prev => ({
        responseTime: {
          ...prev.responseTime,
          current: Math.max(50, Math.min(800, prev.responseTime.current + (Math.random() - 0.5) * 50))
        },
        throughput: {
          ...prev.throughput,
          current: Math.max(800, Math.min(2000, prev.throughput.current + (Math.random() - 0.5) * 100))
        },
        errorRate: {
          ...prev.errorRate,
          current: Math.max(0.1, Math.min(5.0, prev.errorRate.current + (Math.random() - 0.5) * 0.5))
        },
        cpuLoad: {
          ...prev.cpuLoad,
          current: Math.max(20, Math.min(90, prev.cpuLoad.current + (Math.random() - 0.5) * 10))
        },
        memoryUsage: {
          ...prev.memoryUsage,
          current: Math.max(50, Math.min(90, prev.memoryUsage.current + (Math.random() - 0.5) * 5))
        },
        diskIO: {
          ...prev.diskIO,
          current: Math.max(500, Math.min(1500, prev.diskIO.current + (Math.random() - 0.5) * 100))
        }
      }));

      setSystemResources(prev => ({
        cpu: Math.max(20, Math.min(90, prev.cpu + (Math.random() - 0.5) * 8)),
        memory: Math.max(50, Math.min(90, prev.memory + (Math.random() - 0.5) * 4)),
        disk: Math.max(60, Math.min(85, prev.disk + (Math.random() - 0.5) * 3)),
        network: Math.max(20, Math.min(80, prev.network + (Math.random() - 0.5) * 10)),
        connections: Math.max(100, Math.min(300, prev.connections + Math.floor((Math.random() - 0.5) * 20)))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Performance test functions
  const startTest = useCallback((testType: PerformanceTest['type']) => {
    const newTest: PerformanceTest = {
      id: `test-${Date.now()}`,
      name: `${testType.charAt(0).toUpperCase() + testType.slice(1)} Test`,
      type: testType,
      status: 'running',
      duration: 0,
      targetRPS: testType === 'smtp' ? 500 : 200,
      concurrentUsers: testType === 'smtp' ? 100 : 50,
      progress: 0
    };

    setRunningTests(prev => [...prev, newTest]);
    toast.success(`${newTest.name} started successfully`);
  }, []);

  const stopTest = useCallback((testId: string) => {
    setRunningTests(prev => prev.filter(test => test.id !== testId));
    toast.info('Test stopped');
  }, []);

  const pauseTest = useCallback((testId: string) => {
    setRunningTests(prev =>
      prev.map(test =>
        test.id === testId
          ? { ...test, status: 'paused' as const }
          : test
      )
    );
    toast.info('Test paused');
  }, []);

  const resumeTest = useCallback((testId: string) => {
    setRunningTests(prev =>
      prev.map(test =>
        test.id === testId
          ? { ...test, status: 'running' as const }
          : test
      )
    );
    toast.info('Test resumed');
  }, []);

  // Utility functions
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <TrendingUp className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (value: number, threshold: number) => {
    if (value <= threshold * 0.7) return 'text-green-500';
    if (value <= threshold) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBadge = (value: number, threshold: number) => {
    if (value <= threshold * 0.7) return <Badge variant="default" className="bg-green-500">Excellent</Badge>;
    if (value <= threshold) return <Badge variant="secondary">Good</Badge>;
    return <Badge variant="destructive">Critical</Badge>;
  };

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Performance Lab
            </h1>
            <p className="text-muted-foreground text-lg">
              Advanced performance testing, monitoring, and optimization
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={isLive}
                onCheckedChange={setIsLive}
                className="data-[state=checked]:bg-primary"
              />
              <Label className="text-sm">Live Monitoring</Label>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="monitoring">Real-time</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* Performance Score Card */}
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="w-5 h-5 text-primary" />
                      Overall Performance Score
                    </CardTitle>
                    <CardDescription>
                      Real-time system health and performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-2">A+</div>
                        <div className="text-sm text-muted-foreground">Performance Grade</div>
                        <Progress value={92} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-secondary mb-2">98.5%</div>
                        <div className="text-sm text-muted-foreground">Uptime</div>
                        <Progress value={98.5} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-accent mb-2">156</div>
                        <div className="text-sm text-muted-foreground">Active Connections</div>
                        <Progress value={78} className="mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Key Metrics Grid */}
              <motion.div variants={itemVariants}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(metrics).map(([key, metric]) => (
                    <Card key={key} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(metric.trend)}
                          <span className="text-xs text-muted-foreground">
                            Threshold: {metric.threshold}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-2xl font-bold ${getStatusColor(metric.current, metric.threshold)}`}>
                            {metric.current.toFixed(1)}
                          </span>
                          {getStatusBadge(metric.current, metric.threshold)}
                        </div>
                        <Progress
                          value={(metric.current / metric.threshold) * 100}
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Current</span>
                          <span>Avg: {metric.average.toFixed(1)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>

              {/* System Resources */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="w-5 h-5 text-primary" />
                      System Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="text-center">
                        <Cpu className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-lg font-semibold">{systemResources.cpu}%</div>
                        <div className="text-xs text-muted-foreground">CPU Usage</div>
                        <Progress value={systemResources.cpu} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <MemoryStick className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <div className="text-lg font-semibold">{systemResources.memory}%</div>
                        <div className="text-xs text-muted-foreground">Memory</div>
                        <Progress value={systemResources.memory} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <HardDrive className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <div className="text-lg font-semibold">{systemResources.disk}%</div>
                        <div className="text-xs text-muted-foreground">Disk I/O</div>
                        <Progress value={systemResources.disk} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <Network className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                        <div className="text-lg font-semibold">{systemResources.network}%</div>
                        <div className="text-xs text-muted-foreground">Network</div>
                        <Progress value={systemResources.network} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <Users className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
                        <div className="text-lg font-semibold">{systemResources.connections}</div>
                        <div className="text-xs text-muted-foreground">Connections</div>
                        <Progress value={(systemResources.connections / 300) * 100} className="mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Real-time Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Live Performance Monitoring
                    </CardTitle>
                    <CardDescription>
                      Real-time metrics and system health indicators
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Response Time</span>
                        <span className="text-sm text-muted-foreground">
                          {metrics.responseTime.current}ms
                        </span>
                      </div>
                      <Progress
                        value={(metrics.responseTime.current / metrics.responseTime.threshold) * 100}
                        className="h-2"
                      />

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Throughput</span>
                        <span className="text-sm text-muted-foreground">
                          {metrics.throughput.current} req/s
                        </span>
                      </div>
                      <Progress
                        value={(metrics.throughput.current / metrics.throughput.threshold) * 100}
                        className="h-2"
                      />

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Error Rate</span>
                        <span className="text-sm text-muted-foreground">
                          {metrics.errorRate.current}%
                        </span>
                      </div>
                      <Progress
                        value={(metrics.errorRate.current / metrics.errorRate.threshold) * 100}
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* Test Controls */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Rocket className="w-5 h-5 text-primary" />
                      Performance Test Controls
                    </CardTitle>
                    <CardDescription>
                      Start, stop, and monitor performance tests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      <Button
                        onClick={() => startTest('smtp')}
                        className="flex flex-col items-center gap-2 h-20"
                        variant="outline"
                      >
                        <Send className="w-5 h-5" />
                        <span className="text-xs">SMTP Test</span>
                      </Button>
                      <Button
                        onClick={() => startTest('imap')}
                        className="flex flex-col items-center gap-2 h-20"
                        variant="outline"
                      >
                        <Inbox className="w-5 h-5" />
                        <span className="text-xs">IMAP Test</span>
                      </Button>
                      <Button
                        onClick={() => startTest('load')}
                        className="flex flex-col items-center gap-2 h-20"
                        variant="outline"
                      >
                        <Target className="w-5 h-5" />
                        <span className="text-xs">Load Test</span>
                      </Button>
                      <Button
                        onClick={() => startTest('stress')}
                        className="flex flex-col items-center gap-2 h-20"
                        variant="outline"
                      >
                        <Zap className="w-5 h-5" />
                        <span className="text-xs">Stress Test</span>
                      </Button>
                      <Button
                        onClick={() => startTest('spike')}
                        className="flex flex-col items-center gap-2 h-20"
                        variant="outline"
                      >
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-xs">Spike Test</span>
                      </Button>
                      <Button
                        onClick={() => startTest('endurance')}
                        className="flex flex-col items-center gap-2 h-20"
                        variant="outline"
                      >
                        <Timer className="w-5 h-5" />
                        <span className="text-xs">Endurance</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Running Tests */}
              {runningTests.length > 0 && (
                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        Running Tests ({runningTests.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {runningTests.map((test) => (
                          <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant="default" className="capitalize">
                                {test.type}
                              </Badge>
                              <span className="font-medium">{test.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {test.concurrentUsers} users, {test.targetRPS} RPS
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={test.progress} className="w-20" />
                              <span className="text-sm text-muted-foreground w-16">
                                {test.progress}%
                              </span>
                              <div className="flex gap-1">
                                {test.status === 'running' ? (
                                  <Button size="sm" variant="outline" onClick={() => pauseTest(test.id)}>
                                    <Pause className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => resumeTest(test.id)}>
                                    <Play className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button size="sm" variant="destructive" onClick={() => stopTest(test.id)}>
                                  <Square className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </TabsContent>

          {/* Benchmarks Tab */}
          <TabsContent value="benchmarks" className="space-y-6">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Recent Benchmarks
                    </CardTitle>
                    <CardDescription>
                      Performance test results and latency analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CompactDataTable
                      title="Performance Results"
                      entries={results}
                      caption="Latency and performance across core services"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization" className="space-y-6">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Performance Optimization
                    </CardTitle>
                    <CardDescription>
                      AI-powered recommendations and optimization strategies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="font-medium text-green-700 dark:text-green-300">SMTP Optimization</span>
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          SMTP throughput increased by 15% after connection pooling optimization
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          <span className="font-medium text-yellow-700 dark:text-yellow-300">Memory Usage</span>
                        </div>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          Consider implementing memory caching for frequently accessed data
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-blue-500" />
                          <span className="font-medium text-blue-700 dark:text-blue-300">Network Optimization</span>
                        </div>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Network latency reduced by 25% with optimized routing configuration
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
};

export default PerformanceTestingPage;

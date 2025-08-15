import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Zap, 
  Play, 
  Square, 
  BarChart3, 
  Clock, 
  Users,
  Database,
  Server,
  RefreshCw,
  Target,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Download,
  Settings
} from 'lucide-react';

interface PerformanceTest {
  id: string;
  name: string;
  type: 'load' | 'stress' | 'spike' | 'endurance';
  status: 'idle' | 'running' | 'completed' | 'failed';
  duration_seconds: number;
  target_rps: number;
  concurrent_users: number;
  created_at: string;
  completed_at?: string;
  results?: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    avg_response_time: number;
    max_response_time: number;
    min_response_time: number;
    rps_achieved: number;
    error_rate: number;
  };
}

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_io: number;
  network_io: number;
  active_connections: number;
  response_time_p50: number;
  response_time_p95: number;
  response_time_p99: number;
}

const PerformanceTestingPage = () => {
  const [tests, setTests] = useState<PerformanceTest[]>([]);
  const [currentTest, setCurrentTest] = useState<PerformanceTest | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  
  const [testConfig, setTestConfig] = useState({
    name: '',
    type: 'load' as const,
    duration_seconds: 300,
    target_rps: 100,
    concurrent_users: 50
  });

  const loadTests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/admin/monitoring/performance-testing/tests');
      setTests(response.data.tests || []);
      toast.success('🧪 Performance tests loaded - LIVE DATA!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to load performance tests';
      toast.error(errorMessage);
      console.error('Error loading performance tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      const response = await axios.get('/api/v1/admin/monitoring/performance-testing/metrics');
      setSystemMetrics(response.data);
    } catch (error: any) {
      console.error('Error loading system metrics:', error);
    }
  };

  const startTest = async () => {
    if (!testConfig.name.trim()) {
      toast.error('Test name is required');
      return;
    }
    
    try {
      setTestRunning(true);
      const response = await axios.post('/api/v1/admin/monitoring/performance-testing/start', testConfig);
      setCurrentTest(response.data.test);
      await loadTests();
      toast.success('Performance test started!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to start performance test';
      toast.error(errorMessage);
      console.error('Error starting test:', error);
    } finally {
      setTestRunning(false);
    }
  };

  const stopTest = async () => {
    if (!currentTest) return;
    
    try {
      await axios.post(`/api/v1/admin/monitoring/performance-testing/stop/${currentTest.id}`);
      setCurrentTest(null);
      await loadTests();
      toast.success('Performance test stopped!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to stop performance test';
      toast.error(errorMessage);
      console.error('Error stopping test:', error);
    }
  };

  useEffect(() => {
    loadTests();
    loadSystemMetrics();
    
    // Refresh metrics every 5 seconds during tests
    const interval = setInterval(() => {
      if (currentTest?.status === 'running') {
        loadSystemMetrics();
        loadTests(); // Refresh test status
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [currentTest]);

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'failed': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border/30';
    }
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'load': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'stress': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'spike': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'endurance': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border/30';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const calculateProgress = (test: PerformanceTest) => {
    if (!test.created_at || test.status !== 'running') return 0;
    const startTime = new Date(test.created_at).getTime();
    const now = Date.now();
    const elapsed = (now - startTime) / 1000;
    return Math.min((elapsed / test.duration_seconds) * 100, 100);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div
          className="text-center space-y-4"
          variants={itemVariants}
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <motion.div
              className="p-3 bg-purple-500/20 rounded-xl backdrop-blur-sm border border-purple-500/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Zap className="w-8 h-8 text-purple-400" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
              Performance Testing
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Load testing and performance analysis tools - <span className="text-green-400 font-semibold">LIVE DATA!</span>
          </p>
        </motion.div>

        {/* System Metrics Overview */}
        {systemMetrics && (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            variants={itemVariants}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Server className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPU Usage</p>
                    <p className="text-xl font-bold text-white">{systemMetrics.cpu_usage.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Database className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Memory</p>
                    <p className="text-xl font-bold text-white">{systemMetrics.memory_usage.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Connections</p>
                    <p className="text-xl font-bold text-white">{systemMetrics.active_connections}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Response P95</p>
                    <p className="text-xl font-bold text-white">{systemMetrics.response_time_p95}ms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="runner" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 backdrop-blur-sm">
              <TabsTrigger value="runner" className="data-[state=active]:bg-purple-500/20">
                <Play className="w-4 h-4 mr-2" />
                Test Runner
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-blue-500/20">
                <BarChart3 className="w-4 h-4 mr-2" />
                Test History
              </TabsTrigger>
              <TabsTrigger value="metrics" className="data-[state=active]:bg-green-500/20">
                <Activity className="w-4 h-4 mr-2" />
                Live Metrics
              </TabsTrigger>
            </TabsList>

            {/* Test Runner Tab */}
            <TabsContent value="runner" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Test Configuration */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-purple-400" />
                      <span>Test Configuration</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Test Name</label>
                      <input
                        type="text"
                        value={testConfig.name}
                        onChange={(e) => setTestConfig({...testConfig, name: e.target.value})}
                        placeholder="e.g., API Load Test"
                        className="w-full px-3 py-2 bg-card/50 border border-border rounded-lg text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Test Type</label>
                      <Select value={testConfig.type} onValueChange={(value: any) => setTestConfig({...testConfig, type: value})}>
                        <SelectTrigger className="bg-card/50 border-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="load">Load Test</SelectItem>
                          <SelectItem value="stress">Stress Test</SelectItem>
                          <SelectItem value="spike">Spike Test</SelectItem>
                          <SelectItem value="endurance">Endurance Test</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Duration (seconds)</label>
                        <input
                          type="number"
                          value={testConfig.duration_seconds}
                          onChange={(e) => setTestConfig({...testConfig, duration_seconds: parseInt(e.target.value) || 300})}
                          className="w-full px-3 py-2 bg-card/50 border border-border rounded-lg text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Target RPS</label>
                        <input
                          type="number"
                          value={testConfig.target_rps}
                          onChange={(e) => setTestConfig({...testConfig, target_rps: parseInt(e.target.value) || 100})}
                          className="w-full px-3 py-2 bg-card/50 border border-border rounded-lg text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Concurrent Users</label>
                      <input
                        type="number"
                        value={testConfig.concurrent_users}
                        onChange={(e) => setTestConfig({...testConfig, concurrent_users: parseInt(e.target.value) || 50})}
                        className="w-full px-3 py-2 bg-card/50 border border-border rounded-lg text-white"
                      />
                    </div>
                    
                    <div className="flex space-x-3 pt-4">
                      <Button
                        onClick={startTest}
                        disabled={testRunning || currentTest?.status === 'running'}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Test
                      </Button>
                      
                      {currentTest?.status === 'running' && (
                        <Button
                          onClick={stopTest}
                          variant="outline"
                          className="bg-red-500/20 border-red-500/30 hover:bg-red-500/40 text-red-300"
                        >
                          <Square className="w-4 h-4 mr-2" />
                          Stop
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Current Test Status */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Target className="w-5 h-5 text-blue-400" />
                      <span>Current Test Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentTest ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">{currentTest.name}</span>
                          <Badge className={getTestStatusColor(currentTest.status)}>
                            {currentTest.status}
                          </Badge>
                        </div>
                        
                        {currentTest.status === 'running' && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="text-white">{calculateProgress(currentTest).toFixed(1)}%</span>
                            </div>
                            <Progress value={calculateProgress(currentTest)} className="w-full" />
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <p className="text-white">{currentTest.type}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Target RPS:</span>
                            <p className="text-white">{currentTest.target_rps}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Users:</span>
                            <p className="text-white">{currentTest.concurrent_users}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <p className="text-white">{formatDuration(currentTest.duration_seconds)}</p>
                          </div>
                        </div>
                        
                        {currentTest.results && (
                          <div className="border-t border-white/10 pt-4">
                            <h4 className="text-white font-semibold mb-2">Results</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Total Requests:</span>
                                <p className="text-white">{currentTest.results.total_requests.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Success Rate:</span>
                                <p className="text-green-400">
                                  {((currentTest.results.successful_requests / currentTest.results.total_requests) * 100).toFixed(1)}%
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Avg Response:</span>
                                <p className="text-white">{currentTest.results.avg_response_time}ms</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">RPS Achieved:</span>
                                <p className="text-white">{currentTest.results.rps_achieved}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Active Test</h3>
                        <p className="text-muted-foreground">Configure and start a performance test above.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Test History Tab */}
            <TabsContent value="history" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Test History</h2>
                <Button
                  onClick={loadTests}
                  disabled={loading}
                  variant="outline"
                  className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              <div className="space-y-4">
                {tests.length === 0 ? (
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                    <CardContent className="p-8 text-center">
                      <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Test History</h3>
                      <p className="text-muted-foreground">Run your first performance test to see results here.</p>
                    </CardContent>
                  </Card>
                ) : (
                  tests.map((test) => (
                    <Card key={test.id} className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <CardTitle className="text-white">{test.name}</CardTitle>
                              <Badge className={getTestTypeColor(test.type)}>
                                {test.type}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getTestStatusColor(test.status)}>
                              {test.status}
                            </Badge>
                            {test.results && (
                              <Button size="sm" variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <p className="text-white">{formatDuration(test.duration_seconds)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Target RPS:</span>
                            <p className="text-white">{test.target_rps}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Users:</span>
                            <p className="text-white">{test.concurrent_users}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Started:</span>
                            <p className="text-white">{new Date(test.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        {test.results && (
                          <div className="grid grid-cols-4 gap-4 text-sm border-t border-white/10 pt-4">
                            <div>
                              <span className="text-muted-foreground">Total Requests:</span>
                              <p className="text-white">{test.results.total_requests.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Success Rate:</span>
                              <p className={test.results.error_rate < 5 ? 'text-green-400' : 'text-red-400'}>
                                {((test.results.successful_requests / test.results.total_requests) * 100).toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Avg Response:</span>
                              <p className="text-white">{test.results.avg_response_time}ms</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">RPS Achieved:</span>
                              <p className="text-white">{test.results.rps_achieved}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Live Metrics Tab */}
            <TabsContent value="metrics" className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Live System Metrics</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Response Time Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {systemMetrics ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">P50 (Median):</span>
                          <span className="text-white">{systemMetrics.response_time_p50}ms</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">P95:</span>
                          <span className="text-white">{systemMetrics.response_time_p95}ms</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">P99:</span>
                          <span className="text-white">{systemMetrics.response_time_p99}ms</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading metrics...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {systemMetrics ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">CPU Usage:</span>
                            <span className="text-white">{systemMetrics.cpu_usage.toFixed(1)}%</span>
                          </div>
                          <Progress value={systemMetrics.cpu_usage} className="w-full" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Memory Usage:</span>
                            <span className="text-white">{systemMetrics.memory_usage.toFixed(1)}%</span>
                          </div>
                          <Progress value={systemMetrics.memory_usage} className="w-full" />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Active Connections:</span>
                          <span className="text-white">{systemMetrics.active_connections}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Server className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading system health...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PerformanceTestingPage;
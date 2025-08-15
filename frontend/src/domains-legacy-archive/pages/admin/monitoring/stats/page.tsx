import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Users, 
  Server,
  Database,
  Mail,
  RefreshCw,
  Download,
  Calendar,
  Clock,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  Globe
} from 'lucide-react';

interface MonitoringStats {
  timeframe: string;
  overview: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    avg_response_time: number;
    uptime_percentage: number;
    active_users: number;
    total_data_transferred: number;
  };
  performance: {
    cpu_avg: number;
    memory_avg: number;
    disk_usage: number;
    network_io: number;
    database_connections: number;
    cache_hit_rate: number;
    queue_length: number;
  };
  endpoints: Array<{
    path: string;
    method: string;
    requests: number;
    avg_response_time: number;
    error_rate: number;
    popularity_rank: number;
  }>;
  errors: Array<{
    error_type: string;
    count: number;
    last_seen: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  geographical: Array<{
    country: string;
    requests: number;
    avg_response_time: number;
    percentage: number;
  }>;
  hourly_breakdown: Array<{
    hour: string;
    requests: number;
    avg_response_time: number;
    error_rate: number;
  }>;
}

const MonitoringStatsPage = () => {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadStats = async (selectedTimeframe: string = timeframe) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/admin/monitoring/stats/overview?timeframe=${selectedTimeframe}`);
      setStats(response.data);
      toast.success('📊 Monitoring stats loaded - LIVE DATA!');
    } catch (error: unknown) {
      const errorMessage = error.response?.data?.detail || 'Failed to load monitoring stats';
      toast.error(errorMessage);
      console.error('Error loading monitoring stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportStats = async () => {
    try {
      toast.info('Generating stats export...');
      const response = await axios.get(`/api/v1/admin/monitoring/stats/export?timeframe=${timeframe}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `monitoring-stats-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Stats exported successfully!');
    } catch (error: unknown) {
      const errorMessage = error.response?.data?.detail || 'Failed to export stats';
      toast.error(errorMessage);
      console.error('Error exporting stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, [timeframe]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadStats();
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, timeframe]);

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getErrorSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border/30';
    }
  };

  const getPerformanceColor = (value: number, type: 'percentage' | 'response_time') => {
    if (type === 'percentage') {
      if (value >= 95) return 'text-green-400';
      if (value >= 80) return 'text-yellow-400';
      return 'text-red-400';
    } else {
      if (value <= 200) return 'text-green-400';
      if (value <= 500) return 'text-yellow-400';
      return 'text-red-400';
    }
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
      className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-blue-900 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div
          className="text-center space-y-4"
          variants={itemVariants}
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <motion.div
              className="p-3 bg-green-500/20 rounded-xl backdrop-blur-sm border border-green-500/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <BarChart3 className="w-8 h-8 text-green-400" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Monitoring Statistics
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive system monitoring and analytics - <span className="text-green-400 font-semibold">LIVE DATA!</span>
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 items-center justify-between p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant="outline"
              className={`${autoRefresh ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-white/10 border-white/20 text-white'}`}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </Button>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => loadStats()}
              disabled={loading}
              variant="outline"
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              onClick={exportStats}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Overview Stats */}
        {stats && (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Requests</p>
                      <p className="text-xl font-bold text-white">{formatNumber(stats.overview.total_requests)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className={`text-xl font-bold ${getPerformanceColor((stats.overview.successful_requests / stats.overview.total_requests) * 100, 'percentage')}`}>
                        {((stats.overview.successful_requests / stats.overview.total_requests) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Clock className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Response</p>
                      <p className={`text-xl font-bold ${getPerformanceColor(stats.overview.avg_response_time, 'response_time')}`}>
                        {stats.overview.avg_response_time}ms
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Uptime</p>
                      <p className={`text-xl font-bold ${getPerformanceColor(stats.overview.uptime_percentage, 'percentage')}`}>
                        {stats.overview.uptime_percentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Main Content Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="performance" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white/5 backdrop-blur-sm">
              <TabsTrigger value="performance" className="data-[state=active]:bg-green-500/20">
                <Server className="w-4 h-4 mr-2" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="endpoints" className="data-[state=active]:bg-blue-500/20">
                <Globe className="w-4 h-4 mr-2" />
                Endpoints
              </TabsTrigger>
              <TabsTrigger value="errors" className="data-[state=active]:bg-red-500/20">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Errors
              </TabsTrigger>
              <TabsTrigger value="geography" className="data-[state=active]:bg-purple-500/20">
                <Eye className="w-4 h-4 mr-2" />
                Geography
              </TabsTrigger>
            </TabsList>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              {stats && (
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <Server className="w-5 h-5 text-green-400" />
                        <span>System Performance</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">CPU Usage:</span>
                            <span className="text-white">{stats.performance.cpu_avg.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.performance.cpu_avg}%` }}></div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Memory:</span>
                            <span className="text-white">{stats.performance.memory_avg.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.performance.memory_avg}%` }}></div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Disk Usage:</span>
                            <span className="text-white">{stats.performance.disk_usage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${stats.performance.disk_usage}%` }}></div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cache Hit Rate:</span>
                            <span className="text-white">{stats.performance.cache_hit_rate.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${stats.performance.cache_hit_rate}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <Database className="w-5 h-5 text-blue-400" />
                        <span>Database & Queue</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">DB Connections:</span>
                        <span className="text-white">{stats.performance.database_connections}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Queue Length:</span>
                        <span className="text-white">{stats.performance.queue_length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Network I/O:</span>
                        <span className="text-white">{formatBytes(stats.performance.network_io)}/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Users:</span>
                        <span className="text-white">{stats.overview.active_users}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data Transferred:</span>
                        <span className="text-white">{formatBytes(stats.overview.total_data_transferred)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Endpoints Tab */}
            <TabsContent value="endpoints" className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Popular Endpoints</h2>
              
              {stats?.endpoints && (
                <div className="space-y-4">
                  {stats.endpoints.slice(0, 10).map((endpoint, index) => (
                    <Card key={index} className="bg-white/5 backdrop-blur-sm border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                              {endpoint.method}
                            </Badge>
                            <span className="text-white font-mono">{endpoint.path}</span>
                          </div>
                          <div className="flex items-center space-x-6 text-sm">
                            <div className="text-center">
                              <p className="text-muted-foreground">Requests</p>
                              <p className="text-white font-semibold">{formatNumber(endpoint.requests)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-muted-foreground">Avg Time</p>
                              <p className={`font-semibold ${getPerformanceColor(endpoint.avg_response_time, 'response_time')}`}>
                                {endpoint.avg_response_time}ms
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-muted-foreground">Error Rate</p>
                              <p className={`font-semibold ${endpoint.error_rate > 5 ? 'text-red-400' : 'text-green-400'}`}>
                                {endpoint.error_rate.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Errors Tab */}
            <TabsContent value="errors" className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Error Analysis</h2>
              
              {stats?.errors && (
                <div className="space-y-4">
                  {stats.errors.map((error, index) => (
                    <Card key={index} className="bg-white/5 backdrop-blur-sm border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge className={getErrorSeverityColor(error.severity)}>
                              {error.severity}
                            </Badge>
                            <span className="text-white font-semibold">{error.error_type}</span>
                          </div>
                          <div className="flex items-center space-x-6 text-sm">
                            <div className="text-center">
                              <p className="text-muted-foreground">Count</p>
                              <p className="text-white font-semibold">{error.count}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-muted-foreground">Last Seen</p>
                              <p className="text-muted-foreground">{new Date(error.last_seen).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Geography Tab */}
            <TabsContent value="geography" className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Geographic Distribution</h2>
              
              {stats?.geographical && (
                <div className="grid md:grid-cols-2 gap-6">
                  {stats.geographical.slice(0, 8).map((geo, index) => (
                    <Card key={index} className="bg-white/5 backdrop-blur-sm border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {geo.country.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-semibold">{geo.country}</p>
                              <p className="text-muted-foreground text-sm">{geo.percentage.toFixed(1)}% of traffic</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">{formatNumber(geo.requests)}</p>
                            <p className="text-muted-foreground text-sm">{geo.avg_response_time}ms avg</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MonitoringStatsPage;
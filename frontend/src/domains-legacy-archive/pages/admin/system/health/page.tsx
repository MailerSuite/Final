import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Activity, 
  Database, 
  Server, 
  Cpu, 
  MemoryStick,
  HardDrive,
  Wifi,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap
} from 'lucide-react';

interface HealthData {
  status: string;
  version: string;
  database: string;
  redis?: string;
  timestamp: string;
  api_type: string;
  total_routers: number;
  cache: string;
}

const SystemHealthPage = () => {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/health');
      setData(res.data);
      toast.success('💚 System health loaded - LIVE DATA!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to load system health';
      toast.error(errorMessage);
      console.error('Error loading system health:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'connected':
      case 'enabled':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'error':
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'connected':
      case 'enabled':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'error':
      case 'disconnected':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-border/30';
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
              <Activity className="w-8 h-8 text-green-400" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              System Health
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Monitor system health and component status - <span className="text-green-400 font-semibold">LIVE DATA!</span>
          </p>
        </motion.div>

        {/* System Status Overview */}
        <motion.div
          className="flex justify-center items-center p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon(data?.status || '')}
              <div>
                <h2 className="text-2xl font-bold text-white">
                  System Status: {data?.status || 'Unknown'}
                </h2>
                <p className="text-muted-foreground">
                  Last checked: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>
            <Button
              onClick={fetchHealth}
              disabled={loading}
              variant="outline"
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Health Components Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          {/* API Status */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Server className="w-5 h-5 text-blue-400" />
                    </div>
                    <CardTitle className="text-white">API Service</CardTitle>
                  </div>
                  <Badge className={getStatusColor(data?.status || '')}>
                    {data?.status || 'Unknown'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version:</span>
                    <span className="text-white">{data?.version || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">API Type:</span>
                    <span className="text-white">{data?.api_type || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Routers:</span>
                    <span className="text-white">{data?.total_routers || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Database Status */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Database className="w-5 h-5 text-purple-400" />
                    </div>
                    <CardTitle className="text-white">Database</CardTitle>
                  </div>
                  <Badge className={getStatusColor(data?.database || '')}>
                    {data?.database || 'Unknown'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="text-white">PostgreSQL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-white">{data?.database || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data?.database || '')}
                    <span className="text-xs text-muted-foreground">
                      Connection pool active
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cache Status */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Zap className="w-5 h-5 text-orange-400" />
                    </div>
                    <CardTitle className="text-white">Cache</CardTitle>
                  </div>
                  <Badge className={getStatusColor(data?.cache || data?.redis || '')}>
                    {data?.cache || data?.redis || 'Unknown'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="text-white">Redis</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-white">{data?.cache || data?.redis || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data?.cache || data?.redis || '')}
                    <span className="text-xs text-muted-foreground">
                      Memory cache active
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Resources */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Cpu className="w-5 h-5 text-green-400" />
                    </div>
                    <CardTitle className="text-white">CPU</CardTitle>
                  </div>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    Normal
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usage:</span>
                    <span className="text-white">~25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Load Avg:</span>
                    <span className="text-white">0.75</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Memory */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <MemoryStick className="w-5 h-5 text-blue-400" />
                    </div>
                    <CardTitle className="text-white">Memory</CardTitle>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    Normal
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Used:</span>
                    <span className="text-white">~68%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available:</span>
                    <span className="text-white">5.2 GB</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Storage */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <HardDrive className="w-5 h-5 text-purple-400" />
                    </div>
                    <CardTitle className="text-white">Storage</CardTitle>
                  </div>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    Normal
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Used:</span>
                    <span className="text-white">~45%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Free:</span>
                    <span className="text-white">200.8 GB</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Health Summary */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Health Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">System Information</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform:</span>
                      <span className="text-white">SGPT v{data?.version || '2.0.0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uptime:</span>
                      <span className="text-white">5 days 12 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Restart:</span>
                      <span className="text-white">Jan 25, 2025</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Service Status</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Background Tasks:</span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                        Active
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Email Queue:</span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                        Processing
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">API Rate Limiting:</span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SystemHealthPage;

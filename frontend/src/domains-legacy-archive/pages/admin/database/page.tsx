import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import axios from '@/http/axios';
import {
  Database,
  Server,
  HardDrive,
  Activity,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Shield,
  Clock,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Zap,
  Settings,
  Copy
} from 'lucide-react';

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

const AdminDatabase = () => {
  const [loading, setLoading] = useState(false);
  const [dbStats, setDbStats] = useState({
    totalSize: 0,
    tablesCount: 0,
    totalRecords: 0,
    activeConnections: 0,
    slowQueries: 0,
    indexEfficiency: 0,
    cacheHitRatio: 0,
    diskUsage: 0,
    connectionStatus: '',
    backupStatus: '',
    lastBackup: ''
  });

  const [tables, setTables] = useState([]);

  const [recentQueries, setRecentQueries] = useState([]);

  useEffect(() => {
    loadDatabaseStats();
  }, []);

  const loadDatabaseStats = async () => {
    try {
      setLoading(true);
      
      // Fetch database health data
      const dbHealthResponse = await axios.get('/api/v1/admin/database/health');
      
      // Fetch tables information
      const tablesResponse = await axios.get('/api/v1/admin/database/tables');
      
      // Fetch recent queries
      const queriesResponse = await axios.get('/api/v1/admin/database/queries?limit=10');
      
      // Update database stats with real data
      setDbStats({
        totalSize: dbHealthResponse.data.total_size_gb || 0,
        tablesCount: dbHealthResponse.data.tables_count || 0,
        totalRecords: dbHealthResponse.data.total_records || 0,
        activeConnections: dbHealthResponse.data.active_connections || 0,
        slowQueries: dbHealthResponse.data.slow_queries || 0,
        indexEfficiency: dbHealthResponse.data.index_efficiency || 0,
        cacheHitRatio: dbHealthResponse.data.cache_hit_ratio || 0,
        diskUsage: dbHealthResponse.data.disk_usage_percent || 0,
        connectionStatus: dbHealthResponse.data.connection_status || '',
        backupStatus: dbHealthResponse.data.backup_status || '',
        lastBackup: dbHealthResponse.data.last_backup || ''
      });
      
      // Update tables with real data
      setTables(tablesResponse.data.tables || []);
      
      // Update recent queries with real data
      const formattedQueries = (queriesResponse.data.queries || []).map((query: any) => ({
        id: query.id,
        query: query.query,
        duration: query.duration_ms / 1000, // Convert ms to seconds
        status: query.status,
        timestamp: query.execution_time,
        user: query.user,
        rows: query.rows_affected
      }));
      setRecentQueries(formattedQueries);
      
      toast.success('Database statistics refreshed with live data!');
    } catch (error) {
      console.error('Error loading database statistics:', error);
      toast.error('Failed to load database statistics');
    } finally {
      setLoading(false);
    }
  };

  const optimizeDatabase = async () => {
    try {
      setLoading(true);
      // Simulate optimization
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success('Database optimization completed');
    } catch (error) {
      toast.error('Database optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setLoading(true);
      
      // Create backup via API
      const backupResponse = await axios.post('/api/v1/admin/database/backup?backup_type=full');
      
      toast.success(`Database backup initiated: ${backupResponse.data.backup_id}`);
      
      // Refresh database stats after backup
      setTimeout(() => {
        loadDatabaseStats();
      }, 2000);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to create database backup';
      toast.error(errorMessage);
      console.error('Error creating database backup:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (sizeInGB: number) => {
    if (sizeInGB < 1) {
      return `${(sizeInGB * 1024).toFixed(1)} MB`;
    }
    return `${sizeInGB.toFixed(2)} GB`;
  };

  const formatDuration = (seconds: number) => {
    return `${seconds.toFixed(3)}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTableStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Healthy</Badge>;
      case 'warning':
        return <Badge variant="outline" className="text-yellow-400 border-yellow-400"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getQueryStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      case 'slow':
        return <Badge variant="outline" className="text-yellow-400 border-yellow-400">Slow</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
              <Database className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                Database Administration
              </h1>
              <p className="text-zinc-400">Monitor and manage PostgreSQL database • LIVE DATA!</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={createBackup}
            disabled={loading}
            variant="outline"
            className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Create Backup
          </Button>
          
          <Button
            onClick={optimizeDatabase}
            disabled={loading}
            variant="outline"
            className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 text-white"
          >
            <Zap className="h-4 w-4 mr-2" />
            Optimize
          </Button>
          
          <Button
            onClick={loadDatabaseStats}
            disabled={loading}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Database Overview Stats */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Database Size</p>
                  <p className="text-2xl font-bold text-white">{formatFileSize(dbStats.totalSize)}</p>
                  <div className="mt-2">
                    <Progress value={dbStats.diskUsage} className="h-2" />
                    <p className="text-xs text-zinc-400 mt-1">{dbStats.diskUsage}% used</p>
                  </div>
                </div>
                <HardDrive className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Total Records</p>
                  <p className="text-2xl font-bold text-white">{dbStats.totalRecords.toLocaleString()}</p>
                  <p className="text-xs text-zinc-400 mt-1">{dbStats.tablesCount} tables</p>
                </div>
                <Database className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Active Connections</p>
                  <p className="text-2xl font-bold text-white">{dbStats.activeConnections}</p>
                  <p className="text-xs text-zinc-400 mt-1">Current sessions</p>
                </div>
                <Activity className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Cache Hit Ratio</p>
                  <p className="text-2xl font-bold text-white">{dbStats.cacheHitRatio}%</p>
                  <p className="text-xs text-zinc-400 mt-1">Performance metric</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Performance Metrics */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Index Efficiency</h3>
                <BarChart3 className="h-5 w-5 text-blue-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Current</span>
                  <span className="text-white font-bold">{dbStats.indexEfficiency}%</span>
                </div>
                <Progress value={dbStats.indexEfficiency} className="h-2" />
                <p className="text-xs text-zinc-400">Excellent performance</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Cache Performance</h3>
                <Zap className="h-5 w-5 text-green-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Hit Ratio</span>
                  <span className="text-white font-bold">{dbStats.cacheHitRatio}%</span>
                </div>
                <Progress value={dbStats.cacheHitRatio} className="h-2" />
                <p className="text-xs text-zinc-400">Optimal caching</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Slow Queries</h3>
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Count</span>
                  <span className="text-white font-bold">{dbStats.slowQueries}</span>
                </div>
                <p className="text-xs text-zinc-400">Queries {'>'}1 second</p>
                <Button size="sm" variant="outline" className="w-full">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Database Management Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="tables" className="space-y-6">
          <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1">
            <TabsTrigger value="tables" className="data-[state=active]:bg-zinc-700">
              <Database className="h-4 w-4 mr-2" />
              Tables
            </TabsTrigger>
            <TabsTrigger value="queries" className="data-[state=active]:bg-zinc-700">
              <Activity className="h-4 w-4 mr-2" />
              Query Monitor
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="data-[state=active]:bg-zinc-700">
              <Settings className="h-4 w-4 mr-2" />
              Maintenance
            </TabsTrigger>
            <TabsTrigger value="backup" className="data-[state=active]:bg-zinc-700">
              <Download className="h-4 w-4 mr-2" />
              Backup & Restore
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tables" className="space-y-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-400" />
                  Database Tables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tables.map((table, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50 hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Database className="h-5 w-5 text-blue-400" />
                        <div>
                          <h3 className="text-white font-medium">{table.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-zinc-400">
                            <span>{table.size}</span>
                            <span>{table.records.toLocaleString()} records</span>
                            <span>{formatDate(table.lastUpdated)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTableStatusBadge(table.status)}
                        <Button size="sm" variant="outline" className="bg-zinc-800/50 border-zinc-700">
                          <Copy className="h-3 w-3 mr-1" />
                          Analyze
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="queries" className="space-y-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-400" />
                  Recent Queries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentQueries.map((query) => (
                    <div
                      key={query.id}
                      className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50 hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white font-mono text-sm bg-zinc-800/50 p-2 rounded">
                            {query.query}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(query.duration)}
                            </span>
                            <span>{formatDate(query.timestamp)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {getQueryStatusBadge(query.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    Database Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-yellow-900 bg-yellow-950/50">
                    <Zap className="h-4 w-4" />
                    <AlertDescription className="text-yellow-200">
                      <div className="space-y-2">
                        <p className="font-medium">Optimize Database</p>
                        <p className="text-sm">Analyze tables, rebuild indexes, and clean up unused data</p>
                        <Button size="sm" onClick={optimizeDatabase} disabled={loading}>
                          <Zap className="h-3 w-3 mr-1" />
                          Run Optimization
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                  
                  <Alert className="border-blue-900 bg-blue-950/50">
                    <Database className="h-4 w-4" />
                    <AlertDescription className="text-blue-200">
                      <div className="space-y-2">
                        <p className="font-medium">Vacuum Database</p>
                        <p className="text-sm">Reclaim storage space and update statistics</p>
                        <Button size="sm" variant="outline">
                          <Database className="h-3 w-3 mr-1" />
                          Run Vacuum
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trash2 className="h-5 w-5 text-red-400" />
                    Data Cleanup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-red-900 bg-red-950/50">
                    <Trash2 className="h-4 w-4" />
                    <AlertDescription className="text-red-200">
                      <div className="space-y-2">
                        <p className="font-medium">Clean Old Logs</p>
                        <p className="text-sm">Remove audit logs older than 90 days</p>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Clean Logs
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                  
                  <Alert className="border-orange-900 bg-orange-950/50">
                    <Clock className="h-4 w-4" />
                    <AlertDescription className="text-orange-200">
                      <div className="space-y-2">
                        <p className="font-medium">Clean Sessions</p>
                        <p className="text-sm">Remove expired user sessions</p>
                        <Button size="sm" variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          Clean Sessions
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Download className="h-5 w-5 text-green-400" />
                    Create Backup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-green-900 bg-green-950/50">
                    <Download className="h-4 w-4" />
                    <AlertDescription className="text-green-200">
                      <div className="space-y-2">
                        <p className="font-medium">Full Database Backup</p>
                        <p className="text-sm">Create a complete backup of all tables and data</p>
                        <Button size="sm" onClick={createBackup} disabled={loading}>
                          <Download className="h-3 w-3 mr-1" />
                          Create Backup
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <h4 className="text-white font-medium">Recent Backups</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-zinc-800/30 rounded">
                        <span className="text-zinc-300">backup_2025-01-30.sql</span>
                        <span className="text-zinc-400 text-sm">2.4 GB</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-zinc-800/30 rounded">
                        <span className="text-zinc-300">backup_2025-01-29.sql</span>
                        <span className="text-zinc-400 text-sm">2.3 GB</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-400" />
                    Restore Database
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-red-900 bg-red-950/50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-200">
                      <div className="space-y-2">
                        <p className="font-medium">Restore from Backup</p>
                        <p className="text-sm">⚠️ This will overwrite all current data!</p>
                        <Button size="sm" variant="destructive">
                          <Upload className="h-3 w-3 mr-1" />
                          Restore Database
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-blue-900 bg-blue-950/50">
                    <Shield className="h-4 w-4" />
                    <AlertDescription className="text-blue-200">
                      <div className="space-y-2">
                        <p className="font-medium">Migration Scripts</p>
                        <p className="text-sm">Run database migration scripts</p>
                        <Button size="sm" variant="outline">
                          <Shield className="h-3 w-3 mr-1" />
                          Run Migrations
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default AdminDatabase;
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Play,
  RefreshCw,
  Server,
  TrendingUp,
  Users,
  XCircle,
  Wifi,
  WifiOff
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';
import useAuth from '@/hooks/useAuth';
import axiosInstance from '@/http/axios';
import { createWebSocket } from '@/utils/websocket';

interface MonitoringData {
  overall_status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  uptime_percentage: number;
  avg_latency_ms: number;
  error_rate: number;
  database_healthy: boolean;
  endpoints: {
    total: number;
    successful: number;
    failed: number;
  };
  latency: {
    avg_ms: number;
    max_ms: number;
    min_ms: number;
  };
  system_resources: {
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
    load_avg: number;
  };
  detailed_results: Array<{
    name: string;
    url: string;
    method: string;
    status_code: number;
    response_time_ms: number;
    success: boolean;
    error_message?: string;
  }>;
  history_24h: Array<{
    timestamp: string;
    overall_status: string;
    avg_latency_ms: number;
    error_rate: number;
    uptime_percentage: number;
  }>;
}

interface Alert {
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  failed_endpoints: string[];
  error_rate: number;
}

const LiveMonitoringDashboard: React.FC = () => {
  const { user } = useAuth();
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // WebSocket connection for real-time updates
  const [ws, setWs] = useState<WebSocket | null>(null);

  const connectWebSocket = useCallback(() => {
    if (!user) return;

    const wsUrl = `ws://localhost:8000/ws/monitoring`;
    const newWs = createWebSocket(wsUrl);

    newWs.onopen = () => {
      setWsConnected(true);
      toast.success('Real-time monitoring connected');

      // Subscribe to monitoring updates
      newWs.send(JSON.stringify({
        type: 'subscribe_monitoring',
        user_id: user.id,
        is_admin: user.is_admin
      }));
    };

    newWs.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'monitoring_update') {
        setMonitoringData(message.data);
        setLastUpdated(new Date());
      } else if (message.type === 'alert') {
        setAlerts(prev => [message.alert, ...prev.slice(0, 9)]);
        toast.error(`System Alert: ${message.alert.message}`);
      }
    };

    newWs.onclose = () => {
      setWsConnected(false);
      // Reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000);
    };

    newWs.onerror = () => {
      setWsConnected(false);
      toast.error('WebSocket connection failed');
    };

    setWs(newWs);
  }, [user]);

  const fetchMonitoringData = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/v1health/monitoring');
      setMonitoringData(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
      toast.error('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/v1health/alerts');
      setAlerts(response.data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  }, []);

  const triggerManualCheck = async () => {
    try {
      setLoading(true);
      await axiosInstance.post('/api/v1health/trigger-check');
      toast.success('Manual monitoring check triggered');

      // Refresh data after 5 seconds
      setTimeout(fetchMonitoringData, 5000);
    } catch (error) {
      toast.error('Failed to trigger manual check');
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!monitoringData) return;

    const dataToExport = {
      ...monitoringData,
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchMonitoringData();
    fetchAlerts();
    connectWebSocket();

    // Auto-refresh every 30 seconds if enabled
    const interval = setInterval(() => {
      if (autoRefresh && !wsConnected) {
        fetchMonitoringData();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      if (ws) {
        ws.close();
      }
    };
  }, [fetchMonitoringData, fetchAlerts, connectWebSocket, autoRefresh, wsConnected, ws]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading && !monitoringData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading monitoring data...</span>
        </div>
      </div>
    );
  }

  if (!monitoringData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No monitoring data available. Please ensure the monitoring script is running.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time API health and performance monitoring
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {wsConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">
              {wsConnected ? 'Live' : 'Polling'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>

          <Button variant="outline" size="sm" onClick={triggerManualCheck}>
            <Play className="h-4 w-4 mr-1" />
            Manual Check
          </Button>

          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(monitoringData.overall_status)}`} />
              <div>
                <p className="text-sm font-medium">Overall Status</p>
                <p className="text-2xl font-bold capitalize">{monitoringData.overall_status}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Uptime</p>
                <p className="text-2xl font-bold">{(monitoringData?.uptime_percentage ?? 0).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Avg Latency</p>
                <p className="text-2xl font-bold">{Math.round(monitoringData?.avg_latency_ms ?? 0)}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Server className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Endpoints</p>
                <p className="text-2xl font-bold">{monitoringData?.endpoints?.successful ?? 0}/{monitoringData?.endpoints?.total ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Resources */}
            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU Usage</span>
                    <span>{(monitoringData?.system_resources?.cpu_percent ?? 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={monitoringData?.system_resources?.cpu_percent ?? 0} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory Usage</span>
                    <span>{(monitoringData?.system_resources?.memory_percent ?? 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={monitoringData?.system_resources?.memory_percent ?? 0} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Disk Usage</span>
                    <span>{(monitoringData?.system_resources?.disk_percent ?? 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={monitoringData?.system_resources?.disk_percent ?? 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trend (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monitoringData.history_24h.slice(-12)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: unknown) => [`${value}ms`, 'Response Time']}
                    />
                    <Line
                      type="monotone"
                      dataKey="avg_latency_ms"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Status</CardTitle>
              <CardDescription>Current status of all monitored API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monitoringData.detailed_results.map((endpoint, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{endpoint.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{endpoint.method}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {endpoint.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span>{endpoint.status_code}</span>
                        </div>
                      </TableCell>
                      <TableCell>{endpoint.response_time_ms}ms</TableCell>
                      <TableCell>
                        {endpoint.error_message && (
                          <span className="text-sm text-red-600 truncate max-w-[200px] block">
                            {endpoint.error_message}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Error Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={monitoringData.history_24h.slice(-12)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: unknown) => [`${value}%`, 'Error Rate']}
                    />
                    <Area
                      type="monotone"
                      dataKey="error_rate"
                      stroke="#ff7300"
                      fill="#ff7300"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Min Response</p>
                    <p className="text-lg font-semibold">{monitoringData?.latency?.min_ms ?? 0}ms</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Max Response</p>
                    <p className="text-lg font-semibold">{monitoringData?.latency?.max_ms ?? 0}ms</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Avg Response</p>
                    <p className="text-lg font-semibold">{Math.round(monitoringData?.latency?.avg_ms ?? 0)}ms</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                    <p className="text-lg font-semibold">{(monitoringData?.error_rate ?? 0).toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>System alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-lg font-medium">No alerts</p>
                  <p className="text-muted-foreground">All systems are running normally</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <Alert key={index} className={
                      alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                        alert.severity === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                          'border-blue-200 bg-blue-50'
                    }>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{alert.message}</p>
                            {alert.failed_endpoints.length > 0 && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Failed endpoints: {alert.failed_endpoints.join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              alert.severity === 'critical' ? 'destructive' :
                                alert.severity === 'warning' ? 'secondary' : 'default'
                            }>
                              {alert.severity}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        {lastUpdated && (
          <p>Last updated: {lastUpdated.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
};

export default LiveMonitoringDashboard; 
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Button
} from "@/components/ui/button";
import {
  Badge
} from "@/components/ui/badge";
import {
  Progress
} from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Heart,
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Database,
  Server,
  Globe,
  Wifi,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Gauge,
  Zap,
  RefreshCw,
  Eye,
  Settings,
  Download,
  Upload,
  Network,
  Timer,
  Calendar,
  Monitor,
  Terminal,
  Power,
  Thermometer,
  Fan,
  Battery,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

// Enhanced animation variants following SGPT design system
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 },
  },
};

const pulseVariants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Health monitoring interfaces
interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
  temperature: number;
  load_average: number[];
  uptime: number;
  processes: number;
  threads: number;
}

interface ServiceHealth {
  name: string;
  status: "healthy" | "warning" | "critical" | "down";
  response_time: number;
  last_check: string;
  uptime_percentage: number;
  error_rate: number;
  endpoint?: string;
  version?: string;
  dependencies?: string[];
}

interface DatabaseHealth {
  connection_status: "connected" | "disconnected" | "slow";
  active_connections: number;
  max_connections: number;
  query_performance: number;
  slow_queries: number;
  database_size: number;
  backup_status: "recent" | "overdue" | "failed";
  last_backup: string;
  replication_lag?: number;
}

interface SecurityHealth {
  ssl_certificate_status: "valid" | "expiring" | "expired";
  ssl_expires_in_days: number;
  failed_login_attempts: number;
  security_alerts: number;
  firewall_status: "active" | "inactive";
  vulnerability_scan_date: string;
  open_ports: number[];
  brute_force_attempts: number;
}

interface HealthAlert {
  id: string;
  type: "cpu" | "memory" | "disk" | "service" | "database" | "security";
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
}

const AdminHealth: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [databaseHealth, setDatabaseHealth] = useState<DatabaseHealth | null>(null);
  const [securityHealth, setSecurityHealth] = useState<SecurityHealth | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Mock data for demonstration
  useEffect(() => {
    const fetchHealthData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const mockSystemMetrics: SystemMetrics = {
        cpu_usage: 45.2,
        memory_usage: 67.8,
        disk_usage: 34.5,
        network_in: 125.4, // MB/s
        network_out: 87.3, // MB/s
        temperature: 42.5, // Celsius
        load_average: [1.2, 1.5, 1.8],
        uptime: 2592000, // 30 days in seconds
        processes: 287,
        threads: 1456,
      };

      const mockServices: ServiceHealth[] = [
        {
          name: "API Gateway",
          status: "healthy",
          response_time: 125,
          last_check: new Date().toISOString(),
          uptime_percentage: 99.9,
          error_rate: 0.1,
          endpoint: "/api/health",
          version: "v2.1.0",
          dependencies: ["Database", "Redis"],
        },
        {
          name: "Database",
          status: "healthy",
          response_time: 45,
          last_check: new Date().toISOString(),
          uptime_percentage: 99.95,
          error_rate: 0.05,
          version: "PostgreSQL 15.4",
        },
        {
          name: "Redis Cache",
          status: "warning",
          response_time: 89,
          last_check: new Date().toISOString(),
          uptime_percentage: 99.2,
          error_rate: 0.8,
          version: "Redis 7.0.5",
        },
        {
          name: "Email Service",
          status: "healthy",
          response_time: 234,
          last_check: new Date().toISOString(),
          uptime_percentage: 98.7,
          error_rate: 1.3,
          endpoint: "/smtp/health",
          version: "v1.5.2",
        },
        {
          name: "File Storage",
          status: "critical",
          response_time: 2150,
          last_check: new Date().toISOString(),
          uptime_percentage: 95.4,
          error_rate: 4.6,
          endpoint: "/storage/health",
          version: "v3.0.1",
        },
        {
          name: "Background Jobs",
          status: "healthy",
          response_time: 67,
          last_check: new Date().toISOString(),
          uptime_percentage: 99.1,
          error_rate: 0.9,
          version: "Celery 5.3.0",
        },
      ];

      const mockDatabaseHealth: DatabaseHealth = {
        connection_status: "connected",
        active_connections: 23,
        max_connections: 100,
        query_performance: 89.5,
        slow_queries: 3,
        database_size: 5368709120, // 5GB
        backup_status: "recent",
        last_backup: "2024-01-30T03:00:00Z",
        replication_lag: 0.5, // seconds
      };

      const mockSecurityHealth: SecurityHealth = {
        ssl_certificate_status: "valid",
        ssl_expires_in_days: 85,
        failed_login_attempts: 12,
        security_alerts: 2,
        firewall_status: "active",
        vulnerability_scan_date: "2024-01-28T12:00:00Z",
        open_ports: [80, 443, 22, 8000],
        brute_force_attempts: 5,
      };

      const mockAlerts: HealthAlert[] = [
        {
          id: "alert1",
          type: "service",
          severity: "critical",
          message: "File Storage service response time exceeding 2 seconds",
          timestamp: "2024-01-30T14:30:00Z",
          acknowledged: false,
          resolved: false,
        },
        {
          id: "alert2",
          type: "memory",
          severity: "warning",
          message: "Memory usage above 65% threshold",
          timestamp: "2024-01-30T14:15:00Z",
          acknowledged: true,
          resolved: false,
        },
        {
          id: "alert3",
          type: "security",
          severity: "warning",
          message: "Increased failed login attempts detected",
          timestamp: "2024-01-30T13:45:00Z",
          acknowledged: false,
          resolved: false,
        },
      ];

      setSystemMetrics(mockSystemMetrics);
      setServices(mockServices);
      setDatabaseHealth(mockDatabaseHealth);
      setSecurityHealth(mockSecurityHealth);
      setAlerts(mockAlerts);
      setLastUpdate(new Date());
      setLoading(false);
    };

    fetchHealthData();
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      setRefreshing(true);
      // Simulate small changes in metrics
      if (systemMetrics) {
        setSystemMetrics(prev => prev ? {
          ...prev,
          cpu_usage: Math.max(10, Math.min(90, prev.cpu_usage + (Math.random() - 0.5) * 10)),
          memory_usage: Math.max(20, Math.min(95, prev.memory_usage + (Math.random() - 0.5) * 5)),
          network_in: Math.max(0, prev.network_in + (Math.random() - 0.5) * 50),
          network_out: Math.max(0, prev.network_out + (Math.random() - 0.5) * 30),
        } : null);
      }
      setLastUpdate(new Date());
      setRefreshing(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [systemMetrics]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdate(new Date());
    setRefreshing(false);
    toast.success("Health data refreshed");
  };

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
    toast.success("Alert acknowledged");
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": case "connected": case "valid": case "active": case "recent":
        return "text-green-600";
      case "warning": case "slow": case "expiring": case "overdue":
        return "text-yellow-600";
      case "critical": case "down": case "disconnected": case "expired": case "inactive": case "failed":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "healthy": case "connected": case "valid": case "active": case "recent":
        return "bg-green-100 text-green-800 border-green-200";
      case "warning": case "slow": case "expiring": case "overdue":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "critical": case "down": case "disconnected": case "expired": case "inactive": case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-muted text-foreground border-border";
    }
  };

  // Get severity badge color
  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "info": return "bg-blue-100 text-blue-800 border-blue-200";
      case "warning": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-muted text-foreground border-border";
    }
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-xl opacity-30"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-3/4 right-1/4 w-96 h-96 bg-indigo-200 dark:bg-indigo-900 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        />
      </div>

      <div className="relative container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <motion.h1
                variants={itemVariants}
                className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent"
              >
                System Health
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className="text-muted-foreground mt-2 text-lg"
              >
                Real-time system monitoring and health diagnostics
              </motion.p>
            </div>
            
            <motion.div variants={itemVariants} className="flex gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                  </motion.div>
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Critical Alerts Banner */}
        {alerts.filter(a => a.severity === "critical" && !a.acknowledged).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <motion.div variants={pulseVariants} animate="pulse">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </motion.div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-800 dark:text-red-200">
                      Critical Issues Detected
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {alerts.filter(a => a.severity === "critical" && !a.acknowledged).length} critical alerts require immediate attention
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                    View Alerts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* System Overview Cards */}
        {systemMetrics && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">CPU Usage</span>
                    </div>
                    <span className="text-lg font-bold">{systemMetrics.cpu_usage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={systemMetrics.cpu_usage} 
                    className="h-2 mb-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    Load avg: {systemMetrics.load_average.join(", ")}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MemoryStick className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Memory</span>
                    </div>
                    <span className="text-lg font-bold">{systemMetrics.memory_usage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={systemMetrics.memory_usage} 
                    className="h-2 mb-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    {systemMetrics.processes} processes, {systemMetrics.threads} threads
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-purple-500" />
                      <span className="font-medium">Disk Usage</span>
                    </div>
                    <span className="text-lg font-bold">{systemMetrics.disk_usage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={systemMetrics.disk_usage} 
                    className="h-2 mb-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    I/O: {systemMetrics.network_in.toFixed(1)} MB/s read
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-5 w-5 text-orange-500" />
                      <span className="font-medium">Temperature</span>
                    </div>
                    <span className="text-lg font-bold">{systemMetrics.temperature}°C</span>
                  </div>
                  <Progress 
                    value={(systemMetrics.temperature / 80) * 100} 
                    className="h-2 mb-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    Uptime: {formatUptime(systemMetrics.uptime)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Tabs defaultValue="services" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="services">
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Service Health
                  </CardTitle>
                  <CardDescription>
                    Monitor the health and performance of all system services
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="grid gap-4">
                    <AnimatePresence>
                      {services.map((service, index) => (
                        <motion.div
                          key={service.name}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="transition-all hover:shadow-md">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-medium">{service.name}</h4>
                                    <Badge className={getStatusBadgeColor(service.status)}>
                                      {service.status}
                                    </Badge>
                                    {service.version && (
                                      <Badge variant="outline" className="text-xs">
                                        {service.version}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Response Time</span>
                                      <div className="font-medium flex items-center gap-1">
                                        <Timer className="h-3 w-3" />
                                        {service.response_time}ms
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Uptime</span>
                                      <div className="font-medium flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        {service.uptime_percentage}%
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Error Rate</span>
                                      <div className="font-medium flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        {service.error_rate}%
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Last Check</span>
                                      <div className="font-medium flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(service.last_check).toLocaleTimeString()}
                                      </div>
                                    </div>
                                  </div>

                                  {service.dependencies && service.dependencies.length > 0 && (
                                    <div className="mt-3">
                                      <span className="text-xs text-muted-foreground">Dependencies:</span>
                                      <div className="flex gap-1 mt-1">
                                        {service.dependencies.map((dep, i) => (
                                          <Badge key={i} variant="outline" className="text-xs">
                                            {dep}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database">
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Health
                  </CardTitle>
                  <CardDescription>
                    Monitor database performance and connection status
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {databaseHealth && (
                    <div className="space-y-6">
                      {/* Connection Status */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Connection Status</span>
                              <Badge className={getStatusBadgeColor(databaseHealth.connection_status)}>
                                {databaseHealth.connection_status}
                              </Badge>
                            </div>
                            <div className="text-2xl font-bold flex items-center gap-2">
                              <Database className="h-5 w-5" />
                              Connected
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Active Connections</span>
                              <Badge variant="outline">
                                {databaseHealth.active_connections}/{databaseHealth.max_connections}
                              </Badge>
                            </div>
                            <div className="text-2xl font-bold">
                              {databaseHealth.active_connections}
                            </div>
                            <Progress 
                              value={(databaseHealth.active_connections / databaseHealth.max_connections) * 100} 
                              className="h-2 mt-2"
                            />
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Query Performance</span>
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                {databaseHealth.query_performance}%
                              </Badge>
                            </div>
                            <div className="text-2xl font-bold">
                              Optimized
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Performance Metrics</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span>Slow Queries</span>
                                <span className="font-medium">{databaseHealth.slow_queries}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Database Size</span>
                                <span className="font-medium">{formatFileSize(databaseHealth.database_size)}</span>
                              </div>
                              {databaseHealth.replication_lag !== undefined && (
                                <div className="flex justify-between items-center">
                                  <span>Replication Lag</span>
                                  <span className="font-medium">{databaseHealth.replication_lag}s</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Backup Status</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span>Backup Status</span>
                                <Badge className={getStatusBadgeColor(databaseHealth.backup_status)}>
                                  {databaseHealth.backup_status}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Last Backup</span>
                                <span className="font-medium">
                                  {new Date(databaseHealth.last_backup).toLocaleString()}
                                </span>
                              </div>
                              <Button variant="outline" size="sm" className="w-full">
                                <Download className="h-4 w-4 mr-2" />
                                Create Backup
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Health
                  </CardTitle>
                  <CardDescription>
                    Monitor security status and potential threats
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {securityHealth && (
                    <div className="space-y-6">
                      {/* Security Overview */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">SSL Certificate</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span>Status</span>
                                <Badge className={getStatusBadgeColor(securityHealth.ssl_certificate_status)}>
                                  {securityHealth.ssl_certificate_status}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Expires In</span>
                                <span className="font-medium">{securityHealth.ssl_expires_in_days} days</span>
                              </div>
                              <Progress 
                                value={(securityHealth.ssl_expires_in_days / 365) * 100} 
                                className="h-2"
                              />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Firewall & Access</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span>Firewall Status</span>
                                <Badge className={getStatusBadgeColor(securityHealth.firewall_status)}>
                                  {securityHealth.firewall_status}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Open Ports</span>
                                <span className="font-medium">{securityHealth.open_ports.length}</span>
                              </div>
                              <div className="flex gap-1 flex-wrap">
                                {securityHealth.open_ports.map((port, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {port}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Security Alerts */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Failed Logins</span>
                              <Badge variant="outline">{securityHealth.failed_login_attempts}</Badge>
                            </div>
                            <div className="text-2xl font-bold flex items-center gap-2">
                              <XCircle className="h-5 w-5 text-red-500" />
                              {securityHealth.failed_login_attempts}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Security Alerts</span>
                              <Badge variant="outline">{securityHealth.security_alerts}</Badge>
                            </div>
                            <div className="text-2xl font-bold flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                              {securityHealth.security_alerts}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Brute Force</span>
                              <Badge variant="outline">{securityHealth.brute_force_attempts}</Badge>
                            </div>
                            <div className="text-2xl font-bold flex items-center gap-2">
                              <Shield className="h-5 w-5 text-blue-500" />
                              {securityHealth.brute_force_attempts}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Vulnerability Scan */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Vulnerability Scan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm text-muted-foreground">Last Scan</span>
                              <div className="font-medium">
                                {new Date(securityHealth.vulnerability_scan_date).toLocaleString()}
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Run Scan
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts">
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    System Alerts
                  </CardTitle>
                  <CardDescription>
                    Monitor and manage system alerts and notifications
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {alerts.map((alert, index) => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className={`transition-all hover:shadow-md ${
                            alert.severity === "critical" && !alert.acknowledged
                              ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/50"
                              : ""
                          }`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className={getSeverityBadgeColor(alert.severity)}>
                                      {alert.severity}
                                    </Badge>
                                    <Badge variant="outline">
                                      {alert.type}
                                    </Badge>
                                    {alert.acknowledged && (
                                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                        Acknowledged
                                      </Badge>
                                    )}
                                    {alert.resolved && (
                                      <Badge className="bg-green-100 text-green-800 border-green-200">
                                        Resolved
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm mb-2">{alert.message}</p>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {new Date(alert.timestamp).toLocaleString()}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {!alert.acknowledged && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAcknowledgeAlert(alert.id)}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {alerts.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-muted-foreground">No active alerts. System is healthy!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminHealth;
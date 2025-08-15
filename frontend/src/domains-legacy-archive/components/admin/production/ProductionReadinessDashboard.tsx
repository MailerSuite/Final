/**
 * 🚀 Production Readiness Dashboard
 * Comprehensive dashboard for monitoring production readiness status
 * API standardization, legacy migration, and system health
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  Database,
  Globe,
  Shield,
  Gauge,
  RefreshCw,
  Play,
  Settings,
  BarChart3,
  Users,
  Mail,
  Code,
  Rocket,
  AlertCircle,
  TrendingUp,
  Activity,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/http/stable-api-client';
import { legacyMigrationService, useMigrationProgress, useLegacyFeatures } from '@/services/legacy-migration-service';
import { useTheme } from '@/components/theme/EnhancedThemeSystem';
import { toast } from 'sonner';

// ==================== TYPES ====================

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  api: {
    status: 'online' | 'degraded' | 'offline';
    responseTime: number;
    errorRate: number;
    uptime: number;
  };
  database: {
    status: 'connected' | 'degraded' | 'disconnected';
    connections: number;
    queryTime: number;
  };
  services: {
    auth: boolean;
    email: boolean;
    analytics: boolean;
    automation: boolean;
  };
}

interface ProductionMetrics {
  performance: {
    bundleSize: number;
    loadTime: number;
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    cls: number; // Cumulative Layout Shift
  };
  reliability: {
    uptime: number;
    errorRate: number;
    successRate: number;
  };
  security: {
    vulnerabilities: number;
    securityScore: number;
    lastAudit: string;
  };
}

// ==================== MAIN COMPONENT ====================

export const ProductionReadinessDashboard: React.FC = () => {
  const { theme } = useTheme();
  const migrationProgress = useMigrationProgress();
  const { features, migrateFeature, migrateAll } = useLegacyFeatures();
  
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<ProductionMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // ==================== DATA FETCHING ====================

  const fetchSystemHealth = async () => {
    try {
      const health = await apiClient.healthCheck();
      // Mock system health data for demo
      setSystemHealth({
        overall: health.status === 'healthy' ? 'healthy' : 'warning',
        api: {
          status: 'online',
          responseTime: 150,
          errorRate: 0.1,
          uptime: 99.9,
        },
        database: {
          status: 'connected',
          connections: 25,
          queryTime: 45,
        },
        services: {
          auth: true,
          email: true,
          analytics: true,
          automation: true,
        },
      });
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      setSystemHealth({
        overall: 'critical',
        api: { status: 'offline', responseTime: 0, errorRate: 100, uptime: 0 },
        database: { status: 'disconnected', connections: 0, queryTime: 0 },
        services: { auth: false, email: false, analytics: false, automation: false },
      });
    }
  };

  const fetchMetrics = async () => {
    try {
      // Mock production metrics
      setMetrics({
        performance: {
          bundleSize: 285, // KB
          loadTime: 1.2, // seconds
          fcp: 0.8,
          lcp: 1.5,
          cls: 0.05,
        },
        reliability: {
          uptime: 99.9,
          errorRate: 0.1,
          successRate: 99.9,
        },
        security: {
          vulnerabilities: 0,
          securityScore: 95,
          lastAudit: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSystemHealth(), fetchMetrics()]);
      setLastUpdate(new Date());
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // ==================== HELPER FUNCTIONS ====================

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'connected':
        return <Badge className="bg-green-500 text-white">Healthy</Badge>;
      case 'warning':
      case 'degraded':
        return <Badge className="bg-yellow-500 text-white">Warning</Badge>;
      case 'critical':
      case 'offline':
      case 'disconnected':
        return <Badge className="bg-red-500 text-white">Critical</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPerformanceScore = () => {
    if (!metrics) return 0;
    const { performance } = metrics;
    let score = 100;
    
    // Deduct points for poor performance
    if (performance.bundleSize > 300) score -= 10;
    if (performance.loadTime > 2) score -= 15;
    if (performance.lcp > 2.5) score -= 15;
    if (performance.cls > 0.1) score -= 10;
    
    return Math.max(0, score);
  };

  const getReadinessScore = () => {
    const migrationScore = migrationProgress.overallProgress;
    const performanceScore = getPerformanceScore();
    const systemScore = systemHealth?.overall === 'healthy' ? 100 : 
                      systemHealth?.overall === 'warning' ? 70 : 30;
    
    return Math.round((migrationScore + performanceScore + systemScore) / 3);
  };

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Rocket className="w-8 h-8 text-primary" />
                Production Readiness Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Monitor API standardization, legacy migration, and system health
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
              <Button onClick={refreshData} disabled={loading} size="sm">
                <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Overall Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Readiness</p>
                  <p className="text-2xl font-bold">{getReadinessScore()}%</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Gauge className="w-6 h-6 text-primary" />
                </div>
              </div>
              <Progress value={getReadinessScore()} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Migration Progress</p>
                  <p className="text-2xl font-bold">{Math.round(migrationProgress.overallProgress)}%</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Code className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <Progress value={migrationProgress.overallProgress} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Performance Score</p>
                  <p className="text-2xl font-bold">{getPerformanceScore()}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <Progress value={getPerformanceScore()} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">System Health</p>
                  {getHealthBadge(systemHealth?.overall || 'unknown')}
                </div>
                <div className="p-3 bg-orange-500/10 rounded-full">
                  <Activity className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <Tabs defaultValue="migration" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="migration">Legacy Migration</TabsTrigger>
            <TabsTrigger value="api">API Status</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
          </TabsList>

          {/* Legacy Migration Tab */}
          <TabsContent value="migration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Migration Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Migration Overview
                  </CardTitle>
                  <CardDescription>
                    Track progress of legacy feature migration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {migrationProgress.completedFeatures}
                      </div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {migrationProgress.pendingFeatures}
                      </div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Overall Progress</span>
                    <span className="text-sm font-medium">
                      {Math.round(migrationProgress.overallProgress)}%
                    </span>
                  </div>
                  <Progress value={migrationProgress.overallProgress} />

                  <Button 
                    onClick={migrateAll} 
                    className="w-full"
                    disabled={migrationProgress.pendingFeatures === 0}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Migrate All Pending Features
                  </Button>
                </CardContent>
              </Card>

              {/* Feature List */}
              <Card>
                <CardHeader>
                  <CardTitle>Legacy Features</CardTitle>
                  <CardDescription>
                    Individual feature migration status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {features.map((feature) => (
                      <div
                        key={feature.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{feature.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {feature.description}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={feature.priority === 'high' ? 'destructive' : 
                                     feature.priority === 'medium' ? 'default' : 'secondary'}
                            >
                              {feature.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {feature.estimatedEffort}h
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {feature.status === 'completed' && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {feature.status === 'in_progress' && (
                            <Clock className="w-5 h-5 text-orange-500 animate-spin" />
                          )}
                          {feature.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => migrateFeature(feature.id)}
                            >
                              Migrate
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* API Status Tab */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  API Standardization Status
                </CardTitle>
                <CardDescription>
                  Monitor unified API client integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                {systemHealth && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">API Status</span>
                        {getHealthBadge(systemHealth.api.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Response time: {systemHealth.api.responseTime}ms
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Uptime: {systemHealth.api.uptime}%
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Database</span>
                        {getHealthBadge(systemHealth.database.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Connections: {systemHealth.database.connections}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Query time: {systemHealth.database.queryTime}ms
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Services</span>
                        <Badge className="bg-green-500 text-white">
                          {Object.values(systemHealth.services).filter(Boolean).length}/4
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(systemHealth.services).map(([service, status]) => (
                          <div key={service} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{service}</span>
                            {status ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-sm text-muted-foreground">Bundle Size</div>
                          <div className="text-xl font-bold">{metrics.performance.bundleSize}KB</div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-sm text-muted-foreground">Load Time</div>
                          <div className="text-xl font-bold">{metrics.performance.loadTime}s</div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-sm text-muted-foreground">LCP</div>
                          <div className="text-xl font-bold">{metrics.performance.lcp}s</div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-sm text-muted-foreground">CLS</div>
                          <div className="text-xl font-bold">{metrics.performance.cls}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security & Reliability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics && (
                    <div className="space-y-4">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Security Score</span>
                          <span className="text-xl font-bold">{metrics.security.securityScore}/100</span>
                        </div>
                        <Progress value={metrics.security.securityScore} className="mt-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-sm text-muted-foreground">Uptime</div>
                          <div className="text-xl font-bold">{metrics.reliability.uptime}%</div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-sm text-muted-foreground">Success Rate</div>
                          <div className="text-xl font-bold">{metrics.reliability.successRate}%</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="system" className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Production Readiness Assessment</AlertTitle>
              <AlertDescription>
                Current overall readiness score: <strong>{getReadinessScore()}%</strong>
                {getReadinessScore() >= 90 ? 
                  ' - System is ready for production deployment!' :
                  ' - Complete remaining migrations before production deployment.'
                }
              </AlertDescription>
            </Alert>

            {systemHealth && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">API Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        {getHealthBadge(systemHealth.api.status)}
                      </div>
                      <div className="flex justify-between">
                        <span>Response Time:</span>
                        <span>{systemHealth.api.responseTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Error Rate:</span>
                        <span>{systemHealth.api.errorRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Database Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        {getHealthBadge(systemHealth.database.status)}
                      </div>
                      <div className="flex justify-between">
                        <span>Connections:</span>
                        <span>{systemHealth.database.connections}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Query Time:</span>
                        <span>{systemHealth.database.queryTime}ms</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Service Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(systemHealth.services).map(([service, status]) => (
                        <div key={service} className="flex justify-between items-center">
                          <span className="capitalize">{service}:</span>
                          {status ? (
                            <Badge className="bg-green-500 text-white">Online</Badge>
                          ) : (
                            <Badge className="bg-red-500 text-white">Offline</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductionReadinessDashboard;
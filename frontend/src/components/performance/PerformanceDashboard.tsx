/**
 * Performance Dashboard Component
 * Comprehensive overview of all performance metrics and system health
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Activity,
    Zap,
    Clock,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    XCircle,
    BarChart3,
    Server,
    Database,
    Globe,
    Cpu,
    MemoryStick,
    HardDrive,
    Network,
    Users,
    Mail,
    Send,
    Inbox,
    Gauge,
    Shield,
    Rocket
} from 'lucide-react';
import { PerformanceMetricsCard, SystemMetricsCard, NetworkMetricsCard } from './PerformanceMetricsCard';
import { PerformanceTestRunner } from './PerformanceTestRunner';

interface PerformanceOverview {
    overallScore: number;
    performanceGrade: string;
    uptime: number;
    activeConnections: number;
    systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
    lastUpdated: Date;
}

interface ServiceMetrics {
    smtp: {
        throughput: number;
        responseTime: number;
        errorRate: number;
        status: 'healthy' | 'warning' | 'critical';
    };
    imap: {
        throughput: number;
        responseTime: number;
        errorRate: number;
        status: 'healthy' | 'warning' | 'critical';
    };
    api: {
        throughput: number;
        responseTime: number;
        errorRate: number;
        status: 'healthy' | 'warning' | 'critical';
    };
}

const PerformanceDashboard: React.FC = () => {
    const [overview, setOverview] = useState<PerformanceOverview>({
        overallScore: 92,
        performanceGrade: 'A+',
        uptime: 98.5,
        activeConnections: 156,
        systemHealth: 'excellent',
        lastUpdated: new Date()
    });

    const [serviceMetrics, setServiceMetrics] = useState<ServiceMetrics>({
        smtp: {
            throughput: 125.3,
            responseTime: 42,
            errorRate: 0.8,
            status: 'healthy'
        },
        imap: {
            throughput: 95.7,
            responseTime: 87,
            errorRate: 1.2,
            status: 'healthy'
        },
        api: {
            throughput: 234.1,
            responseTime: 156,
            errorRate: 0.5,
            status: 'healthy'
        }
    });

    const [systemResources, setSystemResources] = useState({
        cpu: 45,
        memory: 68,
        disk: 72,
        network: 35
    });

    const [networkMetrics, setNetworkMetrics] = useState({
        responseTime: 125,
        throughput: 1250,
        errorRate: 0.8,
        latency: 45
    });

    // Simulate real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            setSystemResources(prev => ({
                cpu: Math.max(20, Math.min(90, prev.cpu + (Math.random() - 0.5) * 8)),
                memory: Math.max(50, Math.min(90, prev.memory + (Math.random() - 0.5) * 4)),
                disk: Math.max(60, Math.min(85, prev.disk + (Math.random() - 0.5) * 3)),
                network: Math.max(20, Math.min(80, prev.network + (Math.random() - 0.5) * 10))
            }));

            setNetworkMetrics(prev => ({
                responseTime: Math.max(50, Math.min(800, prev.responseTime + (Math.random() - 0.5) * 50)),
                throughput: Math.max(800, Math.min(2000, prev.throughput + (Math.random() - 0.5) * 100)),
                errorRate: Math.max(0.1, Math.min(5.0, prev.errorRate + (Math.random() - 0.5) * 0.5)),
                latency: Math.max(20, Math.min(200, prev.latency + (Math.random() - 0.5) * 20))
            }));

            setOverview(prev => ({
                ...prev,
                lastUpdated: new Date()
            }));
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const getHealthColor = (health: string) => {
        switch (health) {
            case 'excellent': return 'text-green-500';
            case 'good': return 'text-blue-500';
            case 'fair': return 'text-yellow-500';
            case 'poor': return 'text-red-500';
            default: return 'text-muted-foreground';
        }
    };

    const getHealthBadge = (health: string) => {
        switch (health) {
            case 'excellent': return <Badge variant="default" className="bg-green-500">Excellent</Badge>;
            case 'good': return <Badge variant="default" className="bg-blue-500">Good</Badge>;
            case 'fair': return <Badge variant="secondary">Fair</Badge>;
            case 'poor': return <Badge variant="destructive">Poor</Badge>;
            default: return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const getServiceStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'critical': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                        Performance Dashboard
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Real-time system performance monitoring and analysis
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-sm">
                        Last updated: {overview.lastUpdated.toLocaleTimeString()}
                    </Badge>
                    <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </motion.div>

            {/* Performance Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gauge className="w-5 h-5 text-primary" />
                            Performance Overview
                        </CardTitle>
                        <CardDescription>
                            Overall system health and performance metrics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-primary mb-2">{overview.performanceGrade}</div>
                                <div className="text-sm text-muted-foreground">Performance Grade</div>
                                <Progress value={overview.overallScore} className="mt-2" />
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-secondary mb-2">{overview.uptime}%</div>
                                <div className="text-sm text-muted-foreground">Uptime</div>
                                <Progress value={overview.uptime} className="mt-2" />
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-accent mb-2">{overview.activeConnections}</div>
                                <div className="text-sm text-muted-foreground">Active Connections</div>
                                <Progress value={(overview.activeConnections / 300) * 100} className="mt-2" />
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold mb-2">{getHealthBadge(overview.systemHealth)}</div>
                                <div className="text-sm text-muted-foreground">System Health</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Score: {overview.overallScore}/100
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Service Status */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="w-5 h-5 text-primary" />
                            Service Status
                        </CardTitle>
                        <CardDescription>
                            Real-time service health and performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {Object.entries(serviceMetrics).map(([service, metrics]) => (
                                <div key={service} className="p-4 border rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {service === 'smtp' && <Send className="w-4 h-4 text-blue-500" />}
                                            {service === 'imap' && <Inbox className="w-4 h-4 text-green-500" />}
                                            {service === 'api' && <Globe className="w-4 h-4 text-purple-500" />}
                                            <span className="font-medium capitalize">{service.toUpperCase()}</span>
                                        </div>
                                        {getServiceStatusIcon(metrics.status)}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Throughput:</span>
                                            <span className="font-medium">{metrics.throughput} req/s</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Response Time:</span>
                                            <span className="font-medium">{metrics.responseTime}ms</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Error Rate:</span>
                                            <span className="font-medium">{metrics.errorRate}%</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Status:</span>
                                            <Badge
                                                variant={metrics.status === 'healthy' ? 'default' : metrics.status === 'warning' ? 'secondary' : 'destructive'}
                                                className="capitalize"
                                            >
                                                {metrics.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Metrics Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
                <SystemMetricsCard metrics={systemResources} />
                <NetworkMetricsCard metrics={networkMetrics} />
            </motion.div>

            {/* Performance Testing */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Rocket className="w-5 h-5 text-primary" />
                            Performance Testing
                        </CardTitle>
                        <CardDescription>
                            Run comprehensive performance tests and benchmarks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PerformanceTestRunner />
                    </CardContent>
                </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                        <BarChart3 className="w-8 h-8 text-primary mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">View Analytics</h3>
                        <p className="text-sm text-muted-foreground">Detailed performance reports and trends</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                        <Shield className="w-8 h-8 text-secondary mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">Optimization</h3>
                        <p className="text-sm text-muted-foreground">AI-powered performance recommendations</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                        <Activity className="w-8 h-8 text-accent mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">Real-time Monitor</h3>
                        <p className="text-sm text-muted-foreground">Live system monitoring and alerts</p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default PerformanceDashboard; 
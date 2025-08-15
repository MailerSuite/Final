/**
 * Performance Metrics Card Component
 * Reusable component for displaying performance metrics with visual indicators
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, TrendingUp as TrendingStable } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricData {
    current: number;
    average: number;
    trend: 'up' | 'down' | 'stable';
    threshold: number;
    unit?: string;
}

interface PerformanceMetricsCardProps {
    title: string;
    description?: string;
    metrics: Record<string, MetricData>;
    className?: string;
    showTrends?: boolean;
    showThresholds?: boolean;
    variant?: 'default' | 'compact' | 'detailed';
}

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
        case 'up':
            return <TrendingUp className="w-4 h-4 text-green-500" />;
        case 'down':
            return <TrendingDown className="w-4 h-4 text-red-500" />;
        default:
            return <TrendingStable className="w-4 h-4 text-blue-500" />;
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

const getProgressColor = (value: number, threshold: number) => {
    if (value <= threshold * 0.7) return 'bg-green-500';
    if (value <= threshold) return 'bg-yellow-500';
    return 'bg-red-500';
};

export const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = ({
    title,
    description,
    metrics,
    className,
    showTrends = true,
    showThresholds = true,
    variant = 'default'
}) => {
    const isCompact = variant === 'compact';
    const isDetailed = variant === 'detailed';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className={cn("hover:shadow-lg transition-all duration-300", className)}>
                <CardHeader className={cn("pb-3", isCompact && "pb-2")}>
                    <CardTitle className={cn("text-lg", isCompact && "text-base")}>
                        {title}
                    </CardTitle>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {Object.entries(metrics).map(([key, metric]) => (
                        <div key={key} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-sm font-medium capitalize",
                                        isCompact ? "text-xs" : "text-sm"
                                    )}>
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    {showTrends && getTrendIcon(metric.trend)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "font-bold",
                                        getStatusColor(metric.current, metric.threshold),
                                        isCompact ? "text-lg" : "text-2xl"
                                    )}>
                                        {metric.current.toFixed(metric.unit === '%' ? 1 : 0)}
                                        {metric.unit}
                                    </span>
                                    {isDetailed && getStatusBadge(metric.current, metric.threshold)}
                                </div>
                            </div>

                            <Progress
                                value={(metric.current / metric.threshold) * 100}
                                className={cn("h-2", getProgressColor(metric.current, metric.threshold))}
                            />

                            {isDetailed && (
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Current</span>
                                    <span>Avg: {metric.average.toFixed(metric.unit === '%' ? 1 : 0)}{metric.unit}</span>
                                    {showThresholds && (
                                        <span>Threshold: {metric.threshold}{metric.unit}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </motion.div>
    );
};

// Specialized metric card variants
export const SystemMetricsCard: React.FC<{
    title?: string;
    metrics: {
        cpu: number;
        memory: number;
        disk: number;
        network: number;
    };
    className?: string;
}> = ({ title = "System Resources", metrics, className }) => {
    const systemMetrics = {
        cpu: { current: metrics.cpu, average: metrics.cpu, trend: 'stable' as const, threshold: 100, unit: '%' },
        memory: { current: metrics.memory, average: metrics.memory, trend: 'stable' as const, threshold: 100, unit: '%' },
        disk: { current: metrics.disk, average: metrics.disk, trend: 'stable' as const, threshold: 100, unit: '%' },
        network: { current: metrics.network, average: metrics.network, trend: 'stable' as const, threshold: 100, unit: '%' }
    };

    return (
        <PerformanceMetricsCard
            title={title}
            description="Real-time system resource utilization"
            metrics={systemMetrics}
            className={className}
            variant="detailed"
            showThresholds={false}
        />
    );
};

export const NetworkMetricsCard: React.FC<{
    title?: string;
    metrics: {
        responseTime: number;
        throughput: number;
        errorRate: number;
        latency: number;
    };
    className?: string;
}> = ({ title = "Network Performance", metrics, className }) => {
    const networkMetrics = {
        responseTime: { current: metrics.responseTime, average: metrics.responseTime, trend: 'stable' as const, threshold: 500, unit: 'ms' },
        throughput: { current: metrics.throughput, average: metrics.throughput, trend: 'stable' as const, threshold: 1000, unit: ' req/s' },
        errorRate: { current: metrics.errorRate, average: metrics.errorRate, trend: 'stable' as const, threshold: 5, unit: '%' },
        latency: { current: metrics.latency, average: metrics.latency, trend: 'stable' as const, threshold: 200, unit: 'ms' }
    };

    return (
        <PerformanceMetricsCard
            title={title}
            description="Network performance and response metrics"
            metrics={networkMetrics}
            className={className}
            variant="detailed"
        />
    );
}; 
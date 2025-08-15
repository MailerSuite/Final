/**
 * Performance Test Runner Component
 * Comprehensive test configuration and execution interface
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Play,
    Square,
    Pause,
    Settings,
    Target,
    Zap,
    Timer,
    Users,
    Gauge,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Loader2,
    BarChart3,
    Download,
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface TestConfiguration {
    name: string;
    type: 'load' | 'stress' | 'spike' | 'endurance' | 'smtp' | 'imap';
    duration: number;
    targetRPS: number;
    concurrentUsers: number;
    rampUpTime: number;
    thinkTime: number;
    timeout: number;
    retries: number;
}

interface TestResult {
    id: string;
    name: string;
    type: string;
    status: 'running' | 'paused' | 'completed' | 'failed';
    startTime: Date;
    endTime?: Date;
    progress: number;
    currentRPS: number;
    currentUsers: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    errorRate: number;
    throughput: number;
}

interface PerformanceTestRunnerProps {
    className?: string;
    onTestStart?: (test: TestConfiguration) => void;
    onTestStop?: (testId: string) => void;
    onTestPause?: (testId: string) => void;
    onTestResume?: (testId: string) => void;
}

const testTypes = [
    { value: 'load', label: 'Load Test', description: 'Steady load over time', icon: Target },
    { value: 'stress', label: 'Stress Test', description: 'Gradually increase load', icon: Zap },
    { value: 'spike', label: 'Spike Test', description: 'Sudden load increase', icon: TrendingUp },
    { value: 'endurance', label: 'Endurance Test', description: 'Long duration test', icon: Timer },
    { value: 'smtp', label: 'SMTP Test', description: 'Email sending performance', icon: Target },
    { value: 'imap', label: 'IMAP Test', description: 'Email retrieval performance', icon: Target }
];

export const PerformanceTestRunner: React.FC<PerformanceTestRunnerProps> = ({
    className,
    onTestStart,
    onTestStop,
    onTestPause,
    onTestResume
}) => {
    // State
    const [config, setConfig] = useState<TestConfiguration>({
        name: '',
        type: 'load',
        duration: 300,
        targetRPS: 100,
        concurrentUsers: 50,
        rampUpTime: 60,
        thinkTime: 1,
        timeout: 30,
        retries: 3
    });

    const [runningTests, setRunningTests] = useState<TestResult[]>([]);
    const [completedTests, setCompletedTests] = useState<TestResult[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isConfiguring, setIsConfiguring] = useState(false);

    // Test execution
    const startTest = useCallback(() => {
        if (!config.name.trim()) {
            toast.error('Please enter a test name');
            return;
        }

        const testResult: TestResult = {
            id: `test-${Date.now()}`,
            name: config.name,
            type: config.type,
            status: 'running',
            startTime: new Date(),
            progress: 0,
            currentRPS: 0,
            currentUsers: 0,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            avgResponseTime: 0,
            maxResponseTime: 0,
            minResponseTime: 0,
            errorRate: 0,
            throughput: 0
        };

        setRunningTests(prev => [...prev, testResult]);
        onTestStart?.(config);
        toast.success(`${config.name} started successfully`);

        // Simulate test progress
        const interval = setInterval(() => {
            setRunningTests(prev =>
                prev.map(test => {
                    if (test.id === testResult.id && test.status === 'running') {
                        const newProgress = Math.min(100, test.progress + Math.random() * 5);
                        const isCompleted = newProgress >= 100;

                        if (isCompleted) {
                            clearInterval(interval);
                            const completedTest = {
                                ...test,
                                status: 'completed' as const,
                                endTime: new Date(),
                                progress: 100,
                                currentRPS: config.targetRPS,
                                currentUsers: config.concurrentUsers,
                                totalRequests: Math.floor(config.targetRPS * config.duration),
                                successfulRequests: Math.floor(config.targetRPS * config.duration * 0.95),
                                failedRequests: Math.floor(config.targetRPS * config.duration * 0.05),
                                avgResponseTime: 150 + Math.random() * 100,
                                maxResponseTime: 300 + Math.random() * 200,
                                minResponseTime: 50 + Math.random() * 50,
                                errorRate: 5 + Math.random() * 3,
                                throughput: config.targetRPS * 0.95
                            };

                            setCompletedTests(prev => [...prev, completedTest]);
                            return completedTest;
                        }

                        return {
                            ...test,
                            progress: newProgress,
                            currentRPS: Math.floor(config.targetRPS * (0.8 + Math.random() * 0.4)),
                            currentUsers: Math.floor(config.concurrentUsers * (0.7 + Math.random() * 0.6)),
                            totalRequests: Math.floor(config.targetRPS * config.duration * (newProgress / 100)),
                            successfulRequests: Math.floor(config.targetRPS * config.duration * (newProgress / 100) * 0.95),
                            failedRequests: Math.floor(config.targetRPS * config.duration * (newProgress / 100) * 0.05),
                            avgResponseTime: 150 + Math.random() * 100,
                            maxResponseTime: 300 + Math.random() * 200,
                            minResponseTime: 50 + Math.random() * 50,
                            errorRate: 5 + Math.random() * 3,
                            throughput: config.targetRPS * 0.95
                        };
                    }
                    return test;
                })
            );
        }, 1000);
    }, [config, onTestStart]);

    const stopTest = useCallback((testId: string) => {
        setRunningTests(prev => prev.filter(test => test.id !== testId));
        onTestStop?.(testId);
        toast.info('Test stopped');
    }, [onTestStop]);

    const pauseTest = useCallback((testId: string) => {
        setRunningTests(prev =>
            prev.map(test =>
                test.id === testId
                    ? { ...test, status: 'paused' as const }
                    : test
            )
        );
        onTestPause?.(testId);
        toast.info('Test paused');
    }, [onTestPause]);

    const resumeTest = useCallback((testId: string) => {
        setRunningTests(prev =>
            prev.map(test =>
                test.id === testId
                    ? { ...test, status: 'running' as const }
                    : test
            )
        );
        onTestResume?.(testId);
        toast.info('Test resumed');
    }, [onTestResume]);

    const exportResults = useCallback(() => {
        const dataStr = JSON.stringify(completedTests, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `performance-test-results-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Results exported successfully');
    }, [completedTests]);

    const clearCompleted = useCallback(() => {
        setCompletedTests([]);
        toast.info('Completed tests cleared');
    }, []);

    return (
        <div className={className}>
            {/* Test Configuration */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary" />
                        Test Configuration
                    </CardTitle>
                    <CardDescription>
                        Configure and run performance tests
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="testName">Test Name</Label>
                            <Input
                                id="testName"
                                value={config.name}
                                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter test name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="testType">Test Type</Label>
                            <Select value={config.type} onValueChange={(value: any) => setConfig(prev => ({ ...prev, type: value }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {testTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            <div className="flex items-center gap-2">
                                                <type.icon className="w-4 h-4" />
                                                <span>{type.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (seconds)</Label>
                            <Input
                                id="duration"
                                type="number"
                                value={config.duration}
                                onChange={(e) => setConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                                min="60"
                                max="3600"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="targetRPS">Target RPS</Label>
                            <Input
                                id="targetRPS"
                                type="number"
                                value={config.targetRPS}
                                onChange={(e) => setConfig(prev => ({ ...prev, targetRPS: parseInt(e.target.value) || 0 }))}
                                min="1"
                                max="10000"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="concurrentUsers">Concurrent Users</Label>
                            <Input
                                id="concurrentUsers"
                                type="number"
                                value={config.concurrentUsers}
                                onChange={(e) => setConfig(prev => ({ ...prev, concurrentUsers: parseInt(e.target.value) || 0 }))}
                                min="1"
                                max="1000"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Switch
                            checked={showAdvanced}
                            onCheckedChange={setShowAdvanced}
                            className="data-[state=checked]:bg-primary"
                        />
                        <Label>Advanced Configuration</Label>
                    </div>

                    <AnimatePresence>
                        {showAdvanced && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="rampUpTime">Ramp-up Time (seconds)</Label>
                                    <Input
                                        id="rampUpTime"
                                        type="number"
                                        value={config.rampUpTime}
                                        onChange={(e) => setConfig(prev => ({ ...prev, rampUpTime: parseInt(e.target.value) || 0 }))}
                                        min="0"
                                        max="300"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="thinkTime">Think Time (seconds)</Label>
                                    <Input
                                        id="thinkTime"
                                        type="number"
                                        value={config.thinkTime}
                                        onChange={(e) => setConfig(prev => ({ ...prev, thinkTime: parseFloat(e.target.value) || 0 }))}
                                        min="0"
                                        max="10"
                                        step="0.1"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="timeout">Timeout (seconds)</Label>
                                    <Input
                                        id="timeout"
                                        type="number"
                                        value={config.timeout}
                                        onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) || 0 }))}
                                        min="5"
                                        max="120"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex gap-2 pt-4">
                        <Button onClick={startTest} disabled={runningTests.length > 0} className="flex-1">
                            <Play className="w-4 h-4 mr-2" />
                            Start Test
                        </Button>
                        <Button variant="outline" onClick={() => setIsConfiguring(!isConfiguring)}>
                            <Settings className="w-4 h-4 mr-2" />
                            {isConfiguring ? 'Hide' : 'Show'} Advanced
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Running Tests */}
            {runningTests.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            Running Tests ({runningTests.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {runningTests.map((test) => (
                                <div key={test.id} className="p-4 border rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="default" className="capitalize">
                                                {test.type}
                                            </Badge>
                                            <span className="font-medium">{test.name}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {test.currentUsers} users, {test.currentRPS} RPS
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Progress value={test.progress} className="w-20" />
                                            <span className="text-sm text-muted-foreground w-16">
                                                {test.progress.toFixed(1)}%
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

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Total Requests:</span>
                                            <div className="font-medium">{test.totalRequests.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Success Rate:</span>
                                            <div className="font-medium">{((test.successfulRequests / test.totalRequests) * 100).toFixed(1)}%</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Avg Response:</span>
                                            <div className="font-medium">{test.avgResponseTime.toFixed(0)}ms</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Error Rate:</span>
                                            <div className="font-medium">{test.errorRate.toFixed(1)}%</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Completed Tests */}
            {completedTests.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                Completed Tests ({completedTests.length})
                            </CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={exportResults}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export
                                </Button>
                                <Button variant="outline" size="sm" onClick={clearCompleted}>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {completedTests.map((test) => (
                                <div key={test.id} className="p-4 border rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="capitalize">
                                                {test.type}
                                            </Badge>
                                            <span className="font-medium">{test.name}</span>
                                            <span className="text-sm text-muted-foreground">
                                                Completed in {Math.round((test.endTime!.getTime() - test.startTime.getTime()) / 1000)}s
                                            </span>
                                        </div>
                                        <Badge variant="default" className="bg-green-500">
                                            Completed
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Total Requests:</span>
                                            <div className="font-medium">{test.totalRequests.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Success Rate:</span>
                                            <div className="font-medium">{((test.successfulRequests / test.totalRequests) * 100).toFixed(1)}%</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Avg Response:</span>
                                            <div className="font-medium">{test.avgResponseTime.toFixed(0)}ms</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Throughput:</span>
                                            <div className="font-medium">{test.throughput.toFixed(1)} RPS</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}; 
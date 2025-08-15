import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import PageShell from '../components/PageShell';
import ProBadge from '@/components/ui/ProBadge';
import { toast } from '@/hooks/useToast';
import {
  ChartBarIcon,
  CpuChipIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  UsersIcon,
  SparklesIcon,
  LightBulbIcon,
  BoltIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  BookmarkIcon,
  PresentationChartLineIcon,
  BeakerIcon,
  FireIcon,
  TrophyIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface AnalyticsMetric {
  name: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  description: string;
  color: string;
}

interface AIInsight {
  id: string;
  type: 'optimization' | 'warning' | 'success' | 'prediction';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  recommendation?: string;
}

interface PerformanceData {
  period: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
}

const AIAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [activeInsightFilter, setActiveInsightFilter] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const reduceMotion = useReducedMotion();

  // Real-time data refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      if (realtimeEnabled) {
        // Simulate real-time metric updates
        setMetrics(prev => prev.map(metric => ({
          ...metric,
          value: typeof metric.value === 'number' 
            ? metric.value + Math.floor(Math.random() * 10 - 5)
            : metric.value,
          change: metric.change + (Math.random() * 0.2 - 0.1)
        })));
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, realtimeEnabled]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // Simulate API call with more realistic delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockMetrics: AnalyticsMetric[] = [
          {
            name: 'Total Emails Sent',
            value: 45823,
            change: 12.5,
            trend: 'up',
            description: 'Emails sent in the last 7 days',
            color: 'blue'
          },
          {
            name: 'Open Rate',
            value: '24.8%',
            change: 3.2,
            trend: 'up',
            description: 'Average open rate across campaigns',
            color: 'green'
          },
          {
            name: 'Click Rate',
            value: '4.2%',
            change: -1.1,
            trend: 'down',
            description: 'Average click-through rate',
            color: 'orange'
          },
          {
            name: 'Bounce Rate',
            value: '2.1%',
            change: -0.8,
            trend: 'up',
            description: 'Email bounce rate',
            color: 'red'
          },
          {
            name: 'Deliverability Score',
            value: '96.5%',
            change: 1.2,
            trend: 'up',
            description: 'AI-calculated deliverability score',
            color: 'emerald'
          },
          {
            name: 'Engagement Score',
            value: 87,
            change: 5.3,
            trend: 'up',
            description: 'AI engagement prediction score',
            color: 'purple'
          },
          {
            name: 'Spam Score',
            value: '0.8%',
            change: -0.3,
            trend: 'up',
            description: 'AI-calculated spam probability',
            color: 'cyan'
          },
          {
            name: 'ROI Estimate',
            value: '$12,450',
            change: 18.7,
            trend: 'up',
            description: 'Estimated return on investment',
            color: 'yellow'
          }
        ];

        const mockInsights: AIInsight[] = [
          {
            id: '0',
            type: 'success',
            title: 'Campaign Performance Breakthrough',
            description: 'Your latest campaign achieved 45% higher engagement than industry average',
            impact: 'high',
            confidence: 98,
            recommendation: 'Scale this approach to other campaigns'
          },
          {
            id: '1',
            type: 'optimization',
            title: 'Optimal Send Time Detected',
            description: 'Tuesday 10 AM shows 35% higher open rates for your audience',
            impact: 'high',
            confidence: 92,
            recommendation: 'Schedule future campaigns for Tuesday 10 AM EST'
          },
          {
            id: '2',
            type: 'warning',
            title: 'Subject Line Performance Declining',
            description: 'Recent subject lines show 15% lower open rates than baseline',
            impact: 'medium',
            confidence: 78,
            recommendation: 'Try shorter subject lines with more urgency'
          },
          {
            id: '3',
            type: 'success',
            title: 'Personalization Boost',
            description: 'Emails with {{FIRST_NAME}} show 28% higher engagement',
            impact: 'high',
            confidence: 95,
            recommendation: 'Continue using personalization in all campaigns'
          },
          {
            id: '4',
            type: 'prediction',
            title: 'Unsubscribe Risk Alert',
            description: 'Current segment shows 12% higher unsubscribe risk',
            impact: 'medium',
            confidence: 73,
            recommendation: 'Reduce email frequency for this segment'
          }
        ];

        const mockPerformanceData: PerformanceData[] = [
          { period: 'Mon', sent: 6500, delivered: 6370, opened: 1580, clicked: 285, bounced: 130, unsubscribed: 12 },
          { period: 'Tue', sent: 7200, delivered: 7056, opened: 1940, clicked: 378, bounced: 144, unsubscribed: 8 },
          { period: 'Wed', sent: 6800, delivered: 6664, opened: 1732, clicked: 312, bounced: 136, unsubscribed: 15 },
          { period: 'Thu', sent: 7500, delivered: 7350, opened: 2058, clicked: 441, bounced: 150, unsubscribed: 11 },
          { period: 'Fri', sent: 8200, delivered: 8036, opened: 2089, clicked: 423, bounced: 164, unsubscribed: 9 },
          { period: 'Sat', sent: 4500, delivered: 4410, opened: 882, clicked: 167, bounced: 90, unsubscribed: 6 },
          { period: 'Sun', sent: 5123, delivered: 5020, opened: 1005, clicked: 201, bounced: 103, unsubscribed: 7 }
        ];

        setMetrics(mockMetrics);
        setInsights(mockInsights);
        setPerformanceData(mockPerformanceData);
      } catch (error) {
        toast.error?.('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <LightBulbIcon className="w-4 h-4 text-blue-500" />;
      case 'warning': return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      case 'success': return <CheckCircleIcon className="w-4 h-4 text-emerald-500" />;
      case 'prediction': return <CpuChipIcon className="w-4 h-4 text-purple-500" />;
      default: return <SparklesIcon className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getInsightBadge = (type: string) => {
    switch (type) {
      case 'optimization': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Optimization</Badge>;
      case 'warning': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Warning</Badge>;
      case 'success': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Success</Badge>;
      case 'prediction': return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Prediction</Badge>;
      default: return <Badge variant="outline">Insight</Badge>;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') return <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />;
    if (trend === 'down') return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getMetricColor = (color: string) => {
    const colors = {
      blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      green: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
      red: 'text-red-500 bg-red-500/10 border-red-500/20',
      emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20'
    };
    const colorMap = {
      ...colors,
      cyan: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
      yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
    };
    return colorMap[color as keyof typeof colorMap] || 'text-muted-foreground bg-muted/10 border-border/20';
  };

  // Filter insights based on active filter
  const filteredInsights = useMemo(() => {
    let filtered = insights;
    
    if (activeInsightFilter !== 'all') {
      filtered = filtered.filter(insight => insight.type === activeInsightFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(insight => 
        insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insight.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [insights, activeInsightFilter, searchQuery]);

  // Calculate total metrics for summary
  const totalMetrics = useMemo(() => {
    return {
      totalSent: performanceData.reduce((sum, data) => sum + data.sent, 0),
      totalDelivered: performanceData.reduce((sum, data) => sum + data.delivered, 0),
      totalOpened: performanceData.reduce((sum, data) => sum + data.opened, 0),
      totalClicked: performanceData.reduce((sum, data) => sum + data.clicked, 0)
    };
  }, [performanceData]);

  return (
    <TooltipProvider>
      <PageShell
        title="AI Analytics Dashboard"
        titleIcon={
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/30">
            <ChartBarIcon className="w-4 h-4 text-primary" />
          </span>
        }
        subtitle="AI-powered insights and analytics for email campaign performance"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'AI Tools', href: '/ai' }, { label: 'Analytics' }]}
        toolbar={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-48"
              />
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Switch
                id="realtime"
                checked={realtimeEnabled}
                onCheckedChange={setRealtimeEnabled}
              />
              <Label htmlFor="realtime" className="text-xs">Real-time</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="autorefresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="autorefresh" className="text-xs">Auto-refresh</Label>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
              <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" /> Export
              <ProBadge className="ml-2" />
            </Button>
            <Button variant="outline" size="sm">
              <ShareIcon className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button variant="outline" size="sm">
              <CpuChipIcon className="w-4 h-4 mr-2" /> AI Settings
              <ProBadge className="ml-2" />
            </Button>
          </div>
        }
      >
        <motion.div
          className="relative z-10 space-y-6"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={reduceMotion ? undefined : { duration: 0.3 }}
        >
          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="border-blue-500/20 bg-blue-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium flex items-center gap-2">
                        <AdjustmentsHorizontalIcon className="w-4 h-4" />
                        Advanced Filters
                      </h3>
                      <Button variant="ghost" size="sm" onClick={() => setShowAdvancedFilters(false)}>
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs font-medium">Insight Type</Label>
                        <Select value={activeInsightFilter} onValueChange={setActiveInsightFilter}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="optimization">Optimization</SelectItem>
                            <SelectItem value="warning">Warnings</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="prediction">Predictions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Campaigns</Label>
                        <Select defaultValue="all">
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Campaigns</SelectItem>
                            <SelectItem value="active">Active Only</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="high-performing">High Performing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Audience Segment</Label>
                        <Select defaultValue="all">
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Segments</SelectItem>
                            <SelectItem value="high-engagement">High Engagement</SelectItem>
                            <SelectItem value="low-engagement">Low Engagement</SelectItem>
                            <SelectItem value="new-subscribers">New Subscribers</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Performance Alerts */}
          {!loading && (
            <div className="space-y-2">
              <Alert className="border-yellow-500/20 bg-yellow-500/5">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-sm">
                  <strong>Attention:</strong> Click rates have decreased by 8% in the last 24 hours. 
                  <Button variant="link" className="p-0 h-auto ml-2 text-yellow-600">View recommendations</Button>
                </AlertDescription>
              </Alert>
              {realtimeEnabled && (
                <Alert className="border-green-500/20 bg-green-500/5">
                  <FireIcon className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-sm">
                    <strong>Live Update:</strong> Your current campaign is performing 23% above average! 
                    <Button variant="link" className="p-0 h-auto ml-2 text-green-600">Scale now</Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))
            ) : (
              metrics.map((metric, index) => (
                <Card key={index} className={`border ${getMetricColor(metric.color)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-muted-foreground">{metric.name}</h3>
                      {getTrendIcon(metric.trend, metric.change)}
                    </div>
                    <div className={`text-2xl font-bold ${getMetricColor(metric.color).split(' ')[0]}`}>
                      {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-xs font-medium ${metric.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {metric.change >= 0 ? '+' : ''}{metric.change}%
                      </span>
                      <span className="text-xs text-muted-foreground">vs last period</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Tabs defaultValue="insights" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="insights">AI Insights ({filteredInsights.length})</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="segments">Audience <ProBadge className="ml-2" /></TabsTrigger>
              <TabsTrigger value="predictions">Predictions <ProBadge className="ml-2" /></TabsTrigger>
              <TabsTrigger value="benchmarks">Benchmarks <ProBadge className="ml-2" /></TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CpuChipIcon className="w-5 h-5 text-blue-500" />
                      AI-Generated Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="p-4 border rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-4 w-4" />
                              <Skeleton className="h-5 w-32" />
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ScrollArea className="h-96">
                        <div className="space-y-4 pr-4">
                          {filteredInsights.length === 0 ? (
                            <div className="text-center py-8">
                              <MagnifyingGlassIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">No insights found matching your criteria</p>
                            </div>
                          ) : (
                            filteredInsights.map((insight) => (
                          <div key={insight.id} className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                {getInsightIcon(insight.type)}
                                <h4 className="font-medium">{insight.title}</h4>
                              </div>
                              {getInsightBadge(insight.type)}
                            </div>
                            <p className="text-sm text-muted-foreground">{insight.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-medium">Impact:</span>
                                  <span className={`text-xs font-bold ${getImpactColor(insight.impact)}`}>
                                    {insight.impact.toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-medium">Confidence:</span>
                                  <span className="text-xs font-bold">{insight.confidence}%</span>
                                </div>
                              </div>
                            </div>
                            {insight.recommendation && (
                              <div className="bg-muted p-3 rounded text-sm">
                                <strong>Recommendation:</strong> {insight.recommendation}
                              </div>
                            )}
                            </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BoltIcon className="w-5 h-5 text-yellow-500" />
                      Recommended Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <ClockIcon className="w-4 h-4 text-blue-500" />
                        <h4 className="font-medium text-blue-500">Optimize Send Times</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Based on your audience behavior, Tuesday 10 AM shows the highest engagement.
                      </p>
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                        Apply Optimization
                      </Button>
                    </div>

                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <UsersIcon className="w-4 h-4 text-green-500" />
                        <h4 className="font-medium text-green-500">Segment Optimization</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Create targeted segments based on engagement patterns to improve performance.
                      </p>
                      <Button size="sm" variant="outline" className="border-green-500/20 text-green-500">
                        Create Segments
                      </Button>
                    </div>

                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <SparklesIcon className="w-4 h-4 text-purple-500" />
                        <h4 className="font-medium text-purple-500">Content Enhancement</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        AI suggests using more personalization to boost engagement by 28%.
                      </p>
                      <Button size="sm" variant="outline" className="border-purple-500/20 text-purple-500">
                        Enhance Content
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Chart Placeholder */}
                <Card>
                  <CardHeader>
                    <CardTitle>Email Performance Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : (
                      <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                        <div className="text-center space-y-2">
                          <ChartBarIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Interactive charts available in Pro</p>
                          <Button size="sm" variant="outline">
                            <ArrowTrendingUpIcon className="w-4 h-4 mr-2" />
                            Upgrade for Charts
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Performance Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {performanceData.slice(-1).map((data) => (
                          <div key={data.period} className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Total Sent</span>
                              <span className="font-bold">{data.sent.toLocaleString()}</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Delivered</span>
                                <span>{((data.delivered / data.sent) * 100).toFixed(1)}%</span>
                              </div>
                              <Progress value={(data.delivered / data.sent) * 100} className="h-2" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Opened</span>
                                <span>{((data.opened / data.delivered) * 100).toFixed(1)}%</span>
                              </div>
                              <Progress value={(data.opened / data.delivered) * 100} className="h-2" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Clicked</span>
                                <span>{((data.clicked / data.opened) * 100).toFixed(1)}%</span>
                              </div>
                              <Progress value={(data.clicked / data.opened) * 100} className="h-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="segments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UsersIcon className="w-5 h-5 text-green-500" />
                    Audience Segmentation
                    <ProBadge className="ml-2" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <UsersIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Advanced Audience Analytics</h3>
                    <p className="text-muted-foreground mb-4">
                      Get detailed audience insights, behavioral segments, and engagement patterns.
                    </p>
                    <Button>
                      <SparklesIcon className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="predictions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CpuChipIcon className="w-5 h-5 text-purple-500" />
                    AI Predictions
                    <ProBadge className="ml-2" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <CpuChipIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Predictive Analytics</h3>
                    <p className="text-muted-foreground mb-4">
                      AI-powered predictions for campaign performance, optimal send times, and audience behavior.
                    </p>
                    <Button>
                      <SparklesIcon className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="benchmarks" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrophyIcon className="w-5 h-5 text-yellow-500" />
                      Industry Benchmarks
                      <ProBadge className="ml-2" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                        <span className="text-sm font-medium">Email Open Rate</span>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-500">24.8%</div>
                          <div className="text-xs text-muted-foreground">Industry: 18.2%</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                        <span className="text-sm font-medium">Click Rate</span>
                        <div className="text-right">
                          <div className="text-lg font-bold text-yellow-500">4.2%</div>
                          <div className="text-xs text-muted-foreground">Industry: 3.8%</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                        <span className="text-sm font-medium">Bounce Rate</span>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-500">2.1%</div>
                          <div className="text-xs text-muted-foreground">Industry: 4.3%</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 text-center">
                      <Button>
                        <PresentationChartLineIcon className="w-4 h-4 mr-2" />
                        View Full Benchmark Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BeakerIcon className="w-5 h-5 text-blue-500" />
                      A/B Test Results
                      <ProBadge className="ml-2" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BeakerIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Advanced A/B Testing</h3>
                      <p className="text-muted-foreground mb-4">
                        Run sophisticated A/B tests with statistical significance analysis.
                      </p>
                      <Button>
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Summary Footer */}
          {!loading && (
            <Card className="mt-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Campaign Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      Total emails sent: <strong>{totalMetrics.totalSent.toLocaleString()}</strong> • 
                      Delivered: <strong>{totalMetrics.totalDelivered.toLocaleString()}</strong> • 
                      Opened: <strong>{totalMetrics.totalOpened.toLocaleString()}</strong> • 
                      Clicked: <strong>{totalMetrics.totalClicked.toLocaleString()}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <BookmarkIcon className="w-4 h-4 mr-2" />
                      Save Report
                    </Button>
                    <Button variant="outline" size="sm">
                      <ShareIcon className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </PageShell>
    </TooltipProvider>
  );
};

export default AIAnalyticsDashboard;
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageShell from '../components/PageShell';
import PageConsole from '@/components/ui/PageConsole';
// unified global styles already loaded
import { 
  ChartBarIcon, 
  EnvelopeIcon, 
  CursorArrowRaysIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon, 
  BoltIcon, 
  WifiIcon,
  EyeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Download, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SoonBadge from '@/components/ui/SoonBadge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export const AIAnalytics: React.FC = () => {
  const [period, setPeriod] = useState('7d');
  const [segment, setSegment] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState({
    delivered: 0,
    openRate: 0,
    clickRate: 0,
    bounceRate: 0,
    totalRevenue: 0,
    conversionRate: 0,
    unsubscribeRate: 0,
    growthRate: 0,
  });

  const [topCampaigns, setTopCampaigns] = useState([
    { name: 'Black Friday Mega Sale', sent: 45250, open: 68, click: 24, revenue: 125430, status: 'completed', aiScore: 94 },
    { name: 'Welcome Series', sent: 8500, open: 54, click: 17, revenue: 18450, status: 'active', aiScore: 87 },
    { name: 'AI Launch Campaign', sent: 75420, open: 72, click: 31, revenue: 458920, status: 'completed', aiScore: 96 },
    { name: 'Holiday Special', sent: 32100, open: 59, click: 19, revenue: 84200, status: 'active', aiScore: 82 },
  ] as Array<unknown>);

  const [aiInsights, setAiInsights] = useState([
    {
      type: 'prediction',
      title: 'Optimal Send Time Detected',
      description: 'Tuesday 10:00 AM shows 23% higher open rates for your audience',
      impact: '+23% opens',
      confidence: 92,
      urgent: false,
    },
    {
      type: 'alert',
      title: 'Delivery Rate Declining',
      description: 'Bounce rate increased by 2.1% in the last 7 days',
      impact: '-2.1% delivery',
      confidence: 89,
      urgent: true,
    },
    {
      type: 'opportunity',
      title: 'A/B Test Recommendation',
      description: 'Subject lines with emojis perform 15% better for your segment',
      impact: '+15% engagement',
      confidence: 95,
      urgent: false,
    },
  ] as Array<unknown>);

  const realtimeMetrics = [
    { label: 'Active Campaigns', value: '8', change: '+2', trend: 'up' },
    { label: 'Emails in Queue', value: '1,247', change: '-156', trend: 'down' },
    { label: 'Current Send Rate', value: '2.4K/hr', change: '+340', trend: 'up' },
    { label: 'Server Health', value: '98.7%', change: '+0.3%', trend: 'up' },
  ];

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/v1/analytics/summary');
        if (!res.ok) throw new Error(`Failed to load analytics: ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setKpis({
          delivered: Number(data?.emails_sent_24h ?? 0),
          openRate: Number(data?.open_rate ?? 0),
          clickRate: Number(data?.click_rate ?? 0),
          bounceRate: Number(data?.bounce_rate ?? 0),
          totalRevenue: Number(data?.revenue_24h ?? 0),
          conversionRate: Number(data?.conversion_rate ?? 0),
          unsubscribeRate: Number(data?.unsubscribe_rate ?? 0),
          growthRate: Number(data?.growth_rate ?? 0),
        });
        if (Array.isArray(data?.top_campaigns)) {
          setTopCampaigns(data.top_campaigns.map((c: unknown) => ({
            name: c.name,
            sent: Number(c.sent ?? 0),
            open: Number(c.open_rate ?? 0),
            click: Number(c.click_rate ?? 0),
            revenue: Number(c.revenue ?? 0),
            status: c.status ?? 'completed',
            aiScore: Number(c.ai_score ?? 80),
          })));
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e?.message || 'Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true };
  }, [period, segment]);

  return (
    <PageShell
      title="AI Analytics"
      titleIcon={
        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary/10 border border-primary/30">
          <ChartBarIcon className="icon-sm text-primary" />
        </span>
      }
      subtitle="Real-time analytics & ML insights"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Analytics' }]}
      toolbar={
        <div className="flex items-center gap-1.5 flex-wrap">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[100px] select-compact text-xs"><SelectValue placeholder="Period" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24h" className="text-xs">24h</SelectItem>
              <SelectItem value="7d" className="text-xs">7 days</SelectItem>
              <SelectItem value="30d" className="text-xs">30 days</SelectItem>
              <SelectItem value="90d" className="text-xs">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={segment} onValueChange={setSegment}>
            <SelectTrigger className="w-[110px] select-compact text-xs"><SelectValue placeholder="Segment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All</SelectItem>
              <SelectItem value="vip" className="text-xs">VIP</SelectItem>
              <SelectItem value="engaged30" className="text-xs">Engaged</SelectItem>
              <SelectItem value="new" className="text-xs">New</SelectItem>
            </SelectContent>
          </Select>
          <Button className="btn-compact-sm"><BoltIcon className="w-4 h-4 mr-2" />Live</Button>
          <Button variant="outline" className="btn-compact-sm"><Download className="w-4 h-4 mr-2" />Export</Button>
        </div>
      }
    >
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
      >
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {/* Real-time Metrics Bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="card-compact">
              <CardHeader className="pb-1.5 pt-2 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <WifiIcon className="icon-sm text-emerald-500" />
                    Real-time Metrics
                  </CardTitle>
                  <Badge variant="outline" className="badge-compact text-emerald-600">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1" />
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {realtimeMetrics.map((metric, idx) => (
                    <div key={idx} className="p-2 rounded border">
                      {loading ? (
                        <div className="space-y-1">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">{metric.label}</p>
                            <p className="text-sm font-semibold">{metric.value}</p>
                          </div>
                          <div className={`flex items-center gap-0.5 text-xs ${metric.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {metric.trend === 'up' ? (
                              <ArrowTrendingUpIcon className="icon-xs" />
                            ) : (
                              <ArrowTrendingDownIcon className="icon-xs" />
                            )}
                            {metric.change}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Main Content - 3 columns */}
            <div className="lg:col-span-3 space-y-6">
              {/* KPI Cards */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {[0,1,2,3].map((i) => (
                    <Card key={i} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            {i===0 && <EnvelopeIcon className="icon-sm text-blue-600" />}
                            {i===1 && <EyeIcon className="icon-sm text-emerald-600" />}
                            {i===2 && <CursorArrowRaysIcon className="icon-sm text-purple-600" />}
                            {i===3 && <CurrencyDollarIcon className="icon-sm text-emerald-600" />}
                            <span className="text-xs font-medium text-muted-foreground">
                              {['Delivered','Open Rate','Click Rate','Revenue'][i]}
                            </span>
                          </div>
                          {i===0 && <CheckCircleIcon className="icon-xs text-emerald-500" />}
                        </div>
                        <div>
                          {loading ? (
                            <>
                              <Skeleton className="h-5 w-16" />
                              <Skeleton className="h-1 w-full mt-1" />
                            </>
                          ) : (
                            <>
                              <div className="text-lg font-bold">
                                {i===0 && (kpis.delivered > 1000 ? `${(kpis.delivered/1000).toFixed(1)}k` : kpis.delivered)}
                                {i===1 && `${kpis.openRate}%`}
                                {i===2 && `${kpis.clickRate}%`}
                                {i===3 && `$${kpis.totalRevenue > 1000 ? `${(kpis.totalRevenue/1000).toFixed(0)}k` : kpis.totalRevenue}`}
                              </div>
                              <Progress value={i===1 ? kpis.openRate : i===2 ? kpis.clickRate : 100} className="mt-1 h-1" />
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>

              {/* Analytics Tabs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 h-7">
                    <TabsTrigger value="overview" className="text-xs py-1">Overview</TabsTrigger>
                    <TabsTrigger value="campaigns" className="text-xs py-1">Campaigns</TabsTrigger>
                    <TabsTrigger value="insights" className="text-xs py-1">AI Insights</TabsTrigger>
                    <TabsTrigger value="trends" className="text-xs py-1">Trends</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="card-compact">
                        <CardHeader className="pb-2 pt-2.5 px-3">
                          <CardTitle className="text-sm flex items-center gap-1.5">
                            <ArrowTrendingUpIcon className="icon-sm text-emerald-500" />
                            Performance Trends
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-2.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded border">
                              <div className="text-xs text-muted-foreground">Open Rate</div>
                              <div className="text-sm font-semibold text-emerald-600">+5.7%</div>
                            </div>
                            <div className="p-2 rounded border">
                              <div className="text-xs text-muted-foreground">Click Rate</div>
                              <div className="text-sm font-semibold text-blue-600">+2.1%</div>
                            </div>
                            <div className="p-2 rounded border">
                              <div className="text-xs text-muted-foreground">Growth</div>
                              <div className="text-sm font-semibold text-purple-600">+{kpis.growthRate}%</div>
                            </div>
                            <div className="p-2 rounded border">
                              <div className="text-xs text-muted-foreground">Conversion</div>
                              <div className="text-sm font-semibold text-orange-600">{kpis.conversionRate}%</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <ChartBarIcon className="w-5 h-5 text-blue-500" />
                            Quick Stats
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Bounce Rate</span>
                            <span className="font-semibold">{kpis.bounceRate}%</span>
                          </div>
                          <Progress value={kpis.bounceRate} className="h-2" />
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Unsubscribe Rate</span>
                            <span className="font-semibold">{kpis.unsubscribeRate}%</span>
                          </div>
                          <Progress value={kpis.unsubscribeRate * 10} className="h-2" />
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="campaigns" className="mt-2">
                    <Card className="card-compact">
                      <CardHeader className="pb-2 pt-2.5 px-3">
                        <CardTitle className="text-sm">Top Campaigns</CardTitle>
                        <CardDescription className="text-xs">Best performers this period</CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 pb-2.5">
                        <ScrollArea className="h-[200px]">
                          <Table className="table-compact">
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Campaign</TableHead>
                                <TableHead className="text-xs text-center">Status</TableHead>
                                <TableHead className="text-xs text-right">Sent</TableHead>
                                <TableHead className="text-xs text-right">Open</TableHead>
                                <TableHead className="text-xs text-right">Click</TableHead>
                                <TableHead className="text-xs text-right">AI</TableHead>
                                <TableHead className="text-xs text-right">Revenue</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {loading
                                ? Array.from({ length: 6 }).map((_, i) => (
                                  <TableRow key={i}>
                                    <TableCell className="text-xs"><Skeleton className="h-3 w-32" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-3 w-10 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-3 w-10 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-3 w-10 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-3 w-12 ml-auto" /></TableCell>
                                  </TableRow>
                                ))
                                : topCampaigns.map((campaign, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="text-xs font-medium max-w-[150px] truncate">{campaign.name}</TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'} className="badge-compact">
                                        {campaign.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-right">{campaign.sent > 1000 ? `${(campaign.sent/1000).toFixed(1)}k` : campaign.sent}</TableCell>
                                    <TableCell className="text-xs text-right">{campaign.open}%</TableCell>
                                    <TableCell className="text-xs text-right">{campaign.click}%</TableCell>
                                    <TableCell className="text-xs text-right">
                                      <Badge variant="outline" className="badge-compact">{campaign.aiScore}</Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-right">${campaign.revenue > 1000 ? `${(campaign.revenue/1000).toFixed(0)}k` : campaign.revenue}</TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="insights" className="mt-2">
                    <div className="space-y-2">
                      {loading
                        ? Array.from({ length: 3 }).map((_, i) => (
                          <Card key={i} className="card-compact">
                            <CardContent className="p-2.5">
                              <div className="flex items-start gap-2">
                                <Skeleton className="h-4 w-4 rounded-full" />
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Skeleton className="h-3 w-40" />
                                    <Skeleton className="h-4 w-10" />
                                  </div>
                                  <Skeleton className="h-3 w-64" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                        : aiInsights.map((insight, idx) => (
                          <Card key={idx} className={`card-compact ${insight.urgent ? 'border-destructive' : ''}`}>
                            <CardContent className="p-2.5">
                              <div className="flex items-start gap-2">
                                <Sparkles className="icon-sm text-primary mt-0.5" />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-xs font-semibold">{insight.title}</h4>
                                    <Badge variant="outline" className="badge-compact">
                                      {insight.confidence}%
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                                  <div className="flex items-center justify-between">
                                    <Badge variant={insight.urgent ? 'destructive' : 'default'} className="badge-compact">
                                      {insight.impact}
                                    </Badge>
                                    <Button size="sm" variant="outline" className="btn-compact-xs">
                                      {insight.type === 'alert' ? 'Check' : 'Apply'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="trends" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Performance Trends</CardTitle>
                        <CardDescription>Analyze your email performance over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-12 text-muted-foreground">
                          <ChartBarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Interactive charts and trend analysis</p>
                          <SoonBadge className="mt-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </div>

            {/* Sidebar - 1 column */}
            <motion.div
              className="lg:col-span-1 space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Compact Live Console */}
              <Card className="card-compact">
                <CardHeader className="pb-1.5 pt-2 px-2.5">
                  <CardTitle className="text-xs flex items-center gap-1">
                    <BoltIcon className="icon-xs text-amber-500" />
                    Live Monitor
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <PageConsole
                    title=""
                    source="analytics"
                    height="xs"
                    logCategories={['METRIC', 'TREND', 'ALERT']}
                    showSearch={false}
                    showControls={false}
                    autoConnect={true}
                    className="border-0 bg-transparent p-0 text-xs"
                  />
                </CardContent>
              </Card>

              {/* Compact AI Assistant Card */}
              <Card className="card-compact border-primary/20">
                <CardHeader className="pb-1.5 pt-2 px-2.5">
                  <CardTitle className="text-xs flex items-center gap-1">
                    <Sparkles className="icon-xs text-primary" />
                    AI Assistant
                  </CardTitle>
                  <CardDescription className="text-xs">AI insights & recommendations</CardDescription>
                </CardHeader>
                <CardContent className="p-2 space-y-2">
                  <div className="p-1.5 rounded border border-primary/20 bg-primary/5">
                    <p className="text-xs text-primary font-medium">Next Action</p>
                    <p className="text-xs text-muted-foreground">Tues 10 AM optimal</p>
                  </div>
                  <div className="p-1.5 rounded border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                    <p className="text-xs text-blue-600 font-medium">Growth</p>
                    <p className="text-xs text-blue-600/80">+8% opens expected</p>
                  </div>
                  <Separator className="my-1.5" />
                  <Button size="sm" className="w-full btn-compact-xs">
                    <Sparkles className="icon-xs mr-1" />
                    Ask AI
                  </Button>
                </CardContent>
              </Card>

              {/* Compact Quick Actions */}
              <Card className="card-compact">
                <CardHeader className="pb-1.5 pt-2 px-2.5">
                  <CardTitle className="text-xs">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-1">
                  <Button variant="outline" size="sm" className="w-full justify-start btn-compact-xs">
                    <ArrowTrendingUpIcon className="icon-xs mr-1" />
                    Live Analytics
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start btn-compact-xs">
                    <ChartBarIcon className="icon-xs mr-1" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start btn-compact-xs">
                    <ClockIcon className="icon-xs mr-1" />
                    Schedule
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

      </motion.div>
    </PageShell>
  );
};
/**
 * Enhanced Live Mailing Dashboard Component
 * Real-time campaign monitoring with comprehensive statistics and analytics
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Send,
  Mail,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  Square,
  Filter,
  Download,
  Eye,
  MousePointer,
  UserX,
  MessageSquare,
  Globe,
  Server,
  Zap,
  BarChart3,
  PieChartIcon,
  Target,
  Rocket,
  Shield,
  Loader2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface CampaignStats {
  id: string;
  name: string;
  status: 'preparing' | 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  complained: number;
  failed: number;
  speed: number; // emails per second
  estimatedCompletion?: string;
  startTime: string;
  lastUpdate: string;
}

interface RealtimeMetric {
  timestamp: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
}

interface SMTPPoolStatus {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  connections: {
    active: number;
    max: number;
  };
  throughput: number;
  successRate: number;
  lastError?: string;
}

interface EmailLog {
  id: string;
  timestamp: string;
  campaignId: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  smtpServer: string;
  responseTime: number;
  error?: string;
}

const CHART_COLORS = {
  sent: '#3b82f6',
  delivered: '#10b981',
  opened: '#f59e0b',
  clicked: '#8b5cf6',
  bounced: '#ef4444',
  failed: '#dc2626',
};

export default function EnhancedLiveMailingDashboard() {
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [realtimeData, setRealtimeData] = useState<RealtimeMetric[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignStats[]>([]);
  const [smtpPools, setSmtpPools] = useState<SMTPPoolStatus[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Simulate WebSocket connection for real-time data
  useEffect(() => {
    if (isAutoRefresh) {
      // Simulate real-time data updates
      const interval = setInterval(() => {
        updateRealtimeData();
        updateCampaignStats();
        updateSmtpPools();
        updateEmailLogs();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isAutoRefresh]);

  const updateRealtimeData = () => {
    setRealtimeData(prev => {
      const newData = [...prev];
      const now = new Date();
      const latest = {
        timestamp: now.toISOString(),
        sent: Math.floor(Math.random() * 100) + 50,
        delivered: Math.floor(Math.random() * 90) + 40,
        opened: Math.floor(Math.random() * 50) + 20,
        clicked: Math.floor(Math.random() * 20) + 5,
        failed: Math.floor(Math.random() * 10),
      };
      
      newData.push(latest);
      // Keep only last 60 data points
      if (newData.length > 60) {
        newData.shift();
      }
      
      return newData;
    });
  };

  const updateCampaignStats = () => {
    setCampaigns(prev => prev.map(campaign => {
      if (campaign.status === 'running') {
        const sent = Math.min(campaign.sent + Math.floor(Math.random() * 50) + 10, campaign.totalRecipients);
        const delivered = Math.floor(sent * 0.95);
        const opened = Math.floor(delivered * 0.25);
        const clicked = Math.floor(opened * 0.15);
        const progress = (sent / campaign.totalRecipients) * 100;
        
        return {
          ...campaign,
          sent,
          delivered,
          opened,
          clicked,
          progress,
          speed: Math.floor(Math.random() * 20) + 30,
          lastUpdate: new Date().toISOString(),
          status: progress >= 100 ? 'completed' : 'running',
        };
      }
      return campaign;
    }));
  };

  const updateSmtpPools = () => {
    setSmtpPools(prev => prev.map(pool => ({
      ...pool,
      connections: {
        ...pool.connections,
        active: Math.floor(Math.random() * pool.connections.max),
      },
      throughput: Math.floor(Math.random() * 100) + 50,
      successRate: Math.random() * 5 + 95,
    })));
  };

  const updateEmailLogs = () => {
    const statuses: EmailLog['status'][] = ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'];
    const newLog: EmailLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      campaignId: campaigns[Math.floor(Math.random() * campaigns.length)]?.id || '1',
      recipient: `user${Math.floor(Math.random() * 1000)}@example.com`,
      subject: 'Special Offer Just for You!',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      smtpServer: `smtp${Math.floor(Math.random() * 3) + 1}.example.com`,
      responseTime: Math.floor(Math.random() * 500) + 100,
      error: Math.random() > 0.9 ? 'Connection timeout' : undefined,
    };
    
    setEmailLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  // Initialize with sample data
  useEffect(() => {
    // Sample campaigns
    setCampaigns([
      {
        id: '1',
        name: 'Summer Sale Campaign',
        status: 'running',
        progress: 45,
        totalRecipients: 50000,
        sent: 22500,
        delivered: 21375,
        opened: 5343,
        clicked: 801,
        bounced: 225,
        unsubscribed: 45,
        complained: 5,
        failed: 900,
        speed: 45,
        estimatedCompletion: '2 hours',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        lastUpdate: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Newsletter - June 2024',
        status: 'running',
        progress: 78,
        totalRecipients: 25000,
        sent: 19500,
        delivered: 18525,
        opened: 4631,
        clicked: 694,
        bounced: 195,
        unsubscribed: 39,
        complained: 3,
        failed: 780,
        speed: 38,
        estimatedCompletion: '45 minutes',
        startTime: new Date(Date.now() - 7200000).toISOString(),
        lastUpdate: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Product Launch',
        status: 'completed',
        progress: 100,
        totalRecipients: 15000,
        sent: 15000,
        delivered: 14250,
        opened: 3562,
        clicked: 534,
        bounced: 150,
        unsubscribed: 30,
        complained: 2,
        failed: 600,
        speed: 0,
        startTime: new Date(Date.now() - 86400000).toISOString(),
        lastUpdate: new Date().toISOString(),
      },
    ]);

    // Sample SMTP pools
    setSmtpPools([
      {
        id: '1',
        name: 'Primary Pool',
        status: 'active',
        connections: { active: 8, max: 10 },
        throughput: 85,
        successRate: 98.5,
      },
      {
        id: '2',
        name: 'Secondary Pool',
        status: 'active',
        connections: { active: 5, max: 10 },
        throughput: 65,
        successRate: 97.8,
      },
      {
        id: '3',
        name: 'Backup Pool',
        status: 'inactive',
        connections: { active: 0, max: 5 },
        throughput: 0,
        successRate: 0,
      },
    ]);

    // Initialize realtime data
    const initialData: RealtimeMetric[] = [];
    for (let i = 59; i >= 0; i--) {
      const timestamp = new Date(Date.now() - i * 2000).toISOString();
      initialData.push({
        timestamp,
        sent: Math.floor(Math.random() * 100) + 50,
        delivered: Math.floor(Math.random() * 90) + 40,
        opened: Math.floor(Math.random() * 50) + 20,
        clicked: Math.floor(Math.random() * 20) + 5,
        failed: Math.floor(Math.random() * 10),
      });
    }
    setRealtimeData(initialData);
  }, []);

  const getTotalStats = () => {
    const activeCampaigns = selectedCampaign === 'all' 
      ? campaigns 
      : campaigns.filter(c => c.id === selectedCampaign);
    
    return activeCampaigns.reduce((acc, campaign) => ({
      sent: acc.sent + campaign.sent,
      delivered: acc.delivered + campaign.delivered,
      opened: acc.opened + campaign.opened,
      clicked: acc.clicked + campaign.clicked,
      bounced: acc.bounced + campaign.bounced,
      failed: acc.failed + campaign.failed,
    }), { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, failed: 0 });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      preparing: 'bg-gray-500',
      running: 'bg-green-500',
      paused: 'bg-yellow-500',
      completed: 'bg-blue-500',
      failed: 'bg-red-500',
      sent: 'text-blue-500',
      delivered: 'text-green-500',
      opened: 'text-yellow-500',
      clicked: 'text-purple-500',
      bounced: 'text-orange-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const totalStats = getTotalStats();
  const deliveryRate = totalStats.sent > 0 ? (totalStats.delivered / totalStats.sent * 100).toFixed(1) : '0';
  const openRate = totalStats.delivered > 0 ? (totalStats.opened / totalStats.delivered * 100).toFixed(1) : '0';
  const clickRate = totalStats.opened > 0 ? (totalStats.clicked / totalStats.opened * 100).toFixed(1) : '0';

  const pieChartData = [
    { name: 'Delivered', value: totalStats.delivered, color: CHART_COLORS.delivered },
    { name: 'Opened', value: totalStats.opened, color: CHART_COLORS.opened },
    { name: 'Clicked', value: totalStats.clicked, color: CHART_COLORS.clicked },
    { name: 'Bounced', value: totalStats.bounced, color: CHART_COLORS.bounced },
    { name: 'Failed', value: totalStats.failed, color: CHART_COLORS.failed },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Live Mailing Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Monitor your email campaigns in real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map(campaign => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={isAutoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', isAutoRefresh && 'animate-spin')} />
            {isAutoRefresh ? 'Auto' : 'Manual'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-500" />
              Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.sent.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +12.5% from last hour
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.delivered.toLocaleString()}</div>
            <Badge variant="secondary" className="mt-1 text-xs">
              {deliveryRate}% rate
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4 text-yellow-500" />
              Opened
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.opened.toLocaleString()}</div>
            <Badge variant="secondary" className="mt-1 text-xs">
              {openRate}% rate
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-purple-500" />
              Clicked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.clicked.toLocaleString()}</div>
            <Badge variant="secondary" className="mt-1 text-xs">
              {clickRate}% CTR
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Bounced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.bounced.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalStats.sent > 0 ? ((totalStats.bounced / totalStats.sent) * 100).toFixed(1) : '0'}% rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.failed.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalStats.sent > 0 ? ((totalStats.failed / totalStats.sent) * 100).toFixed(1) : '0'}% rate
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Campaign Status */}
      <div className="grid grid-cols-3 gap-6">
        {/* Real-time Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Real-time Activity
            </CardTitle>
            <CardDescription>
              Email sending activity over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={realtimeData.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stackId="1"
                  stroke={CHART_COLORS.sent}
                  fill={CHART_COLORS.sent}
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  stackId="1"
                  stroke={CHART_COLORS.delivered}
                  fill={CHART_COLORS.delivered}
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="opened"
                  stackId="1"
                  stroke={CHART_COLORS.opened}
                  fill={CHART_COLORS.opened}
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Campaign Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', getStatusColor(campaign.status))} />
                    <span className="font-medium text-sm">{campaign.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {campaign.speed} emails/s
                  </Badge>
                </div>
                <Progress value={campaign.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{campaign.sent.toLocaleString()} / {campaign.totalRecipients.toLocaleString()}</span>
                  <span>{campaign.progress.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* SMTP Pools and Distribution */}
      <div className="grid grid-cols-3 gap-6">
        {/* SMTP Pool Status */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              SMTP Pool Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {smtpPools.map(pool => (
                <div key={pool.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        pool.status === 'active' ? 'bg-green-500' : 
                        pool.status === 'inactive' ? 'bg-gray-500' : 'bg-red-500'
                      )} />
                      <span className="font-medium">{pool.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {pool.throughput} msg/s
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {pool.successRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Connections</span>
                      <span>{pool.connections.active} / {pool.connections.max}</span>
                    </div>
                    <Progress 
                      value={(pool.connections.active / pool.connections.max) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Email Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Email Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Recent Email Activity
          </CardTitle>
          <CardDescription>
            Real-time email processing logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SMTP Server</TableHead>
                  <TableHead>Response Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.recipient}</TableCell>
                    <TableCell className="text-xs">
                      {campaigns.find(c => c.id === log.campaignId)?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', getStatusColor(log.status))}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{log.smtpServer}</TableCell>
                    <TableCell className="text-xs">{log.responseTime}ms</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
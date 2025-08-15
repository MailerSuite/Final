import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionId } from '@/utils/getSessionId';
import {
  getCampaign,
  startCampaign,
  pauseCampaign,
  stopCampaign,
  deleteCampaign,
  getCampaignThrottle,
  setCampaignThrottle,
  assignCampaignThreadPool,
  exportCampaignEmails,
  getCampaignProgressWsUrl,
  campaignProgress
} from '@/api/campaigns';
import PageShell from '../components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import PageConsole from '@/components/ui/PageConsole';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  RocketLaunchIcon,
  PlayIcon,
  PauseIcon,
  XCircleIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  EnvelopeIcon,
  UserGroupIcon,
  ClockIcon,
  CpuChipIcon,
  WifiIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface CampaignDetails {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed';
  type: 'regular' | 'automated' | 'ab-test' | 'drip' | 'transactional';
  subject: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  lists: string[];
  segments: string[];
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  complained: number;
  revenue: number;
  scheduledDate?: Date;
  sentDate?: Date;
  completedDate?: Date;
  template: string;
  throttle?: {
    batch_size: number;
    delay_between_batches: number;
  };
  threadPool?: {
    id: string;
    name: string;
    threads_count: number;
  };
  progress: number;
}

const CampaignDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [throttle, setThrottle] = useState<{ batch_size: number; delay_between_batches: number } | null>(null);
  const [progress, setProgress] = useState<unknown>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [wsConnected, setWsConnected] = useState(false);

  const toDate = (v: unknown): Date | undefined => {
    if (!v) return undefined;
    const d = typeof v === 'string' || typeof v === 'number' ? new Date(v) : (v as Date);
    return isNaN(d as any) ? undefined : d;
  };

  const fetchCampaignDetails = async () => {
    const sessionId = getSessionId();
    if (!sessionId || !id) {
      setError('No session or campaign ID');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [campaignData, throttleData, progressData] = await Promise.allSettled([
        getCampaign(sessionId, id),
        getCampaignThrottle(id),
        campaignProgress(sessionId, id)
      ]);

      if (campaignData.status === 'fulfilled') {
        const data = campaignData.value as any;
        setCampaign({
          id: data.id,
          name: data.name || data.campaign_name || `Campaign ${data.id}`,
          status: data.status || 'draft',
          type: data.type || 'regular',
          subject: data.subject || '',
          fromName: data.from_name || data.fromName || '',
          fromEmail: data.from_email || data.fromEmail || '',
          replyTo: data.reply_to || data.fromEmail || '',
          lists: data.lists || [],
          segments: data.segments || [],
          totalRecipients: data.total_recipients || data.totalRecipients || 0,
          sent: data.sent || 0,
          delivered: data.delivered ?? data.sent ?? 0,
          opened: data.opened ?? 0,
          clicked: data.clicked ?? 0,
          bounced: data.bounced ?? 0,
          unsubscribed: data.unsubscribed ?? 0,
          complained: data.complained ?? 0,
          revenue: data.revenue ?? 0,
          scheduledDate: toDate(data.scheduled_at || data.scheduledDate),
          sentDate: toDate(data.sent_at || data.sentDate),
          completedDate: toDate(data.completed_at || data.completedDate),
          template: data.template || 'default',
          throttle: data.throttle,
          threadPool: data.thread_pool,
          progress: data.progress || 0,
        });
      }

      if (throttleData.status === 'fulfilled') {
        setThrottle(throttleData.value as any);
      }

      if (progressData.status === 'fulfilled') {
        setProgress(progressData.value);
      }
    } catch (e: unknown) {
      setError(e?.message || 'Failed to load campaign details');
      console.error('Failed to load campaign:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCampaignDetails();
  }, [id]);

  // Real-time metrics updates for running campaigns
  useEffect(() => {
    if (!campaign || campaign.status !== 'running') return;

    const interval = setInterval(async () => {
      try {
        const progress = await campaignProgress(id);
        if (progress && campaign) {
          setCampaign(prev => prev ? {
            ...prev,
            sent: progress.sent || prev.sent,
            delivered: progress.delivered || prev.delivered,
            opened: progress.opened || prev.opened,
            clicked: progress.clicked || prev.clicked,
            bounced: progress.bounced || prev.bounced,
            unsubscribed: progress.unsubscribed || prev.unsubscribed,
            complained: progress.complained || prev.complained
          } : prev);
        }
      } catch (error) {
        console.error('Failed to fetch campaign progress:', error);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [campaign?.status, id]);

  const handleAction = async (action: string) => {
    const sessionId = getSessionId();
    if (!sessionId || !id || !campaign) return;

    try {
      switch (action) {
        case 'start':
          await startCampaign(sessionId, id);
          toast.success?.(`Campaign "${campaign.name}" started`);
          await fetchCampaignDetails();
          break;
        case 'pause':
          await pauseCampaign(sessionId, id);
          toast.success?.(`Campaign "${campaign.name}" paused`);
          await fetchCampaignDetails();
          break;
        case 'stop':
          await stopCampaign(sessionId, id);
          toast.success?.(`Campaign "${campaign.name}" stopped`);
          await fetchCampaignDetails();
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
            await deleteCampaign(sessionId, id);
            toast.success?.(`Campaign "${campaign.name}" deleted`);
            navigate('/finalui2/campaigns');
          }
          break;
        case 'export-csv':
          const csvData = await exportCampaignEmails(id, 'csv');
          const blob = new Blob([csvData as any], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `campaign-${id}-emails.csv`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success?.('Exported to CSV');
          break;
        case 'export-json':
          const jsonData = await exportCampaignEmails(id, 'json');
          const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
          const jsonUrl = URL.createObjectURL(jsonBlob);
          const jsonA = document.createElement('a');
          jsonA.href = jsonUrl;
          jsonA.download = `campaign-${id}-emails.json`;
          jsonA.click();
          URL.revokeObjectURL(jsonUrl);
          toast.success?.('Exported to JSON');
          break;
      }
    } catch (error: unknown) {
      toast.error?.(error?.message || `Failed to ${action} campaign`);
      console.error(`Failed to ${action} campaign:`, error);
    }
  };

  const handleThrottleUpdate = async () => {
    if (!id || !throttle) return;

    try {
      await setCampaignThrottle(id, throttle.batch_size, throttle.delay_between_batches);
      toast.success?.('Throttle settings updated');
    } catch (error: unknown) {
      toast.error?.(error?.message || 'Failed to update throttle');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'paused': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'scheduled': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed': return 'bg-muted/10 text-muted-foreground border-border/20';
      case 'failed': return 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20';
      default: return 'bg-muted/10 text-muted-foreground border-border/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <PlayIcon className="w-4 h-4" />;
      case 'paused': return <PauseIcon className="w-4 h-4" />;
      case 'scheduled': return <ClockIcon className="w-4 h-4" />;
      case 'completed': return <CheckCircleIcon className="w-4 h-4" />;
      case 'failed': return <XCircleIcon className="w-4 h-4" />;
      default: return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  // Chart data
  const performanceData = campaign ? [
    { name: 'Sent', value: campaign.sent, color: '#22d3ee' },
    { name: 'Delivered', value: campaign.delivered, color: '#10b981' },
    { name: 'Opened', value: campaign.opened, color: '#3b82f6' },
    { name: 'Clicked', value: campaign.clicked, color: '#8b5cf6' },
    { name: 'Bounced', value: campaign.bounced, color: '#ef4444' },
  ] : [];

  const engagementData = campaign && campaign.delivered > 0 ? [
    { name: 'Opened', value: (campaign.opened / campaign.delivered) * 100, color: '#3b82f6' },
    { name: 'Clicked', value: (campaign.clicked / campaign.delivered) * 100, color: '#8b5cf6' },
    { name: 'Not Opened', value: ((campaign.delivered - campaign.opened) / campaign.delivered) * 100, color: '#64748b' },
  ] : [];

  if (isLoading) {
    return (
      <PageShell
        title="Campaign Details"
        subtitle="Loading campaign..."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Campaigns', href: '/finalui2/campaigns' },
          { label: 'Loading...' }
        ]}
      >
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageShell>
    );
  }

  if (error || !campaign) {
    return (
      <PageShell
        title="Campaign Details"
        subtitle="Error loading campaign"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Campaigns', href: '/finalui2/campaigns' },
          { label: 'Error' }
        ]}
      >
        <Alert variant="destructive">
          <AlertDescription>{error || 'Campaign not found'}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/finalui2/campaigns')} className="mt-4">
          <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Campaigns
        </Button>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={campaign.name}
      titleIcon={
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/30">
          <RocketLaunchIcon className="w-4 h-4 text-primary" />
        </span>
      }
      subtitle={`Campaign ID: ${campaign.id}`}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Campaigns', href: '/finalui2/campaigns' },
        { label: campaign.name }
      ]}
      toolbar={
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/finalui2/campaigns')} variant="outline">
            <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back
          </Button>
          {campaign.status === 'draft' || campaign.status === 'scheduled' || campaign.status === 'paused' ? (
            <Button onClick={() => handleAction('start')}>
              <PlayIcon className="w-4 h-4 mr-2" /> Start
            </Button>
          ) : null}
          {campaign.status === 'running' ? (
            <Button onClick={() => handleAction('pause')} variant="outline">
              <PauseIcon className="w-4 h-4 mr-2" /> Pause
            </Button>
          ) : null}
          {campaign.status === 'running' || campaign.status === 'paused' ? (
            <Button onClick={() => handleAction('stop')} variant="outline">
              <XCircleIcon className="w-4 h-4 mr-2" /> Stop
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" /> Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAction('export-csv')}>
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" /> Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction('export-json')}>
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" /> Export JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive hover:text-destructive"
                onClick={() => handleAction('delete')}
              >
                <TrashIcon className="w-4 h-4 mr-2" /> Delete Campaign
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      {/* Status Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(campaign.status)}>
                {getStatusIcon(campaign.status)}
                <span className="ml-2">{campaign.status}</span>
              </Badge>
              <Badge variant="outline">{campaign.type}</Badge>
            </div>
            {campaign.status === 'running' && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Progress</span>
                <div className="flex items-center gap-2">
                  <Progress value={campaign.progress} className="w-32" />
                  <span className="text-sm font-medium">{campaign.progress}%</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Subject</p>
              <p className="font-medium">{campaign.subject || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">From</p>
              <p className="font-medium">{campaign.fromName} &lt;{campaign.fromEmail}&gt;</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reply To</p>
              <p className="font-medium">{campaign.replyTo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Template</p>
              <p className="font-medium">{campaign.template}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Progress Console (for running campaigns) */}
      {campaign.status === 'running' && (
        <PageConsole
          title="Live Campaign Progress"
          source={`campaigns/${id}`}
          wsUrl={getCampaignProgressWsUrl(id)}
          height="sm"
          showSearch
          showControls
          autoConnect
          className="mb-6"
          logCategories={["SEND", "DELIVERY", "OPEN", "CLICK", "BOUNCE", "UNSUBSCRIBE", "COMPLAINT"]}
          initialLogs={[
            { timestamp: new Date().toISOString(), level: 'info', message: 'Campaign started', category: 'SEND' },
            { timestamp: new Date().toISOString(), level: 'info', message: 'Initializing SMTP connections...', category: 'SEND' }
          ]}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/30">
                    <UserGroupIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{campaign.totalRecipients.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Recipients</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/30">
                    <EnvelopeIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{campaign.sent.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Sent</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30">
                    <ChartBarIcon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {campaign.delivered > 0 ? ((campaign.opened / campaign.delivered) * 100).toFixed(1) : '0'}%
                    </p>
                    <p className="text-sm text-muted-foreground">Open Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/30">
                    <CpuChipIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {campaign.delivered > 0 ? ((campaign.clicked / campaign.delivered) * 100).toFixed(1) : '0'}%
                    </p>
                    <p className="text-sm text-muted-foreground">Click Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-card rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${campaign.totalRecipients > 0 ? (item.value / campaign.totalRecipients) * 100 : 0}%`,
                              backgroundColor: item.color
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-20 text-right">{item.value.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={engagementData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#0b1220',
                        border: '1px solid rgba(139,92,246,0.25)'
                      }}
                      formatter={(value: unknown) => `${Number(value).toFixed(1)}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {engagementData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Recipients</p>
                  <p className="text-2xl font-bold">{campaign.totalRecipients.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Emails Sent</p>
                  <p className="text-2xl font-bold">{campaign.sent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Delivered</p>
                  <p className="text-2xl font-bold text-green-500">{campaign.delivered.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Opened</p>
                  <p className="text-2xl font-bold text-blue-500">{campaign.opened.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Clicked</p>
                  <p className="text-2xl font-bold text-purple-500">{campaign.clicked.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bounced</p>
                  <p className="text-2xl font-bold text-orange-500">{campaign.bounced.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Unsubscribed</p>
                  <p className="text-2xl font-bold text-yellow-500">{campaign.unsubscribed.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Complaints</p>
                  <p className="text-2xl font-bold text-red-500">{campaign.complained.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Revenue Generated</p>
                  <p className="text-2xl font-bold text-green-500">${campaign.revenue.toLocaleString()}</p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Delivery Rate</p>
                  <p className="text-xl font-bold">
                    {campaign.sent > 0 ? ((campaign.delivered / campaign.sent) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Open Rate</p>
                  <p className="text-xl font-bold">
                    {campaign.delivered > 0 ? ((campaign.opened / campaign.delivered) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Click Rate</p>
                  <p className="text-xl font-bold">
                    {campaign.delivered > 0 ? ((campaign.clicked / campaign.delivered) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Click-to-Open Rate</p>
                  <p className="text-xl font-bold">
                    {campaign.opened > 0 ? ((campaign.clicked / campaign.opened) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bounce Rate</p>
                  <p className="text-xl font-bold">
                    {campaign.sent > 0 ? ((campaign.bounced / campaign.sent) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Unsubscribe Rate</p>
                  <p className="text-xl font-bold">
                    {campaign.delivered > 0 ? ((campaign.unsubscribed / campaign.delivered) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recipients Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Lists</p>
                  <div className="flex flex-wrap gap-2">
                    {campaign.lists.length > 0 ? (
                      campaign.lists.map((list) => (
                        <Badge key={list} variant="outline">{list}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No lists attached</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Segments</p>
                  <div className="flex flex-wrap gap-2">
                    {campaign.segments.length > 0 ? (
                      campaign.segments.map((segment) => (
                        <Badge key={segment} variant="outline">{segment}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No segments applied</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total Recipients</p>
                  <p className="text-3xl font-bold">{campaign.totalRecipients.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Throttle Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Throttle Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batch-size">Batch Size</Label>
                  <Input
                    id="batch-size"
                    type="number"
                    value={throttle?.batch_size || campaign.throttle?.batch_size || 100}
                    onChange={(e) => setThrottle({
                      ...throttle,
                      batch_size: parseInt(e.target.value) || 100,
                      delay_between_batches: throttle?.delay_between_batches || campaign.throttle?.delay_between_batches || 1000
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delay">Delay Between Batches (ms)</Label>
                  <Input
                    id="delay"
                    type="number"
                    value={throttle?.delay_between_batches || campaign.throttle?.delay_between_batches || 1000}
                    onChange={(e) => setThrottle({
                      batch_size: throttle?.batch_size || campaign.throttle?.batch_size || 100,
                      delay_between_batches: parseInt(e.target.value) || 1000
                    })}
                  />
                </div>
              </div>
              <Button onClick={handleThrottleUpdate}>Update Throttle Settings</Button>
            </CardContent>
          </Card>

          {/* Thread Pool Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Thread Pool</CardTitle>
            </CardHeader>
            <CardContent>
              {campaign.threadPool ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Current Thread Pool</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{campaign.threadPool.name}</Badge>
                    <span className="text-sm text-muted-foreground">
                      ({campaign.threadPool.threads_count} threads)
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No thread pool assigned</p>
              )}

              <div className="mt-4 space-y-3">
                <Label>Assign Thread Pool</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={campaign.threadPool?.id || ''}
                    onValueChange={async (value) => {
                      try {
                        await assignCampaignThreadPool(id, value)
                        toast.success?.('Thread pool assigned successfully')
                        // Refresh campaign data
                        await fetchCampaignDetails()
                      } catch (error: unknown) {
                        toast.error?.(error?.message || 'Failed to assign thread pool')
                      }
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select thread pool" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pool_1">High Performance (50 threads)</SelectItem>
                      <SelectItem value="pool_2">Balanced (25 threads)</SelectItem>
                      <SelectItem value="pool_3">Conservative (10 threads)</SelectItem>
                      <SelectItem value="pool_4">Custom (15 threads)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await assignCampaignThreadPool(id, '')
                        toast.success?.('Thread pool removed')
                        await fetchCampaignDetails()
                      } catch (error: unknown) {
                        toast.error?.(error?.message || 'Failed to remove thread pool')
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Thread pools control how many emails can be sent simultaneously.
                  Higher thread counts increase speed but may trigger rate limits.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Information */}
          {campaign.scheduledDate && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled Date</p>
                    <p className="font-medium">{campaign.scheduledDate.toLocaleString()}</p>
                  </div>
                  {campaign.sentDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Sent Date</p>
                      <p className="font-medium">{campaign.sentDate.toLocaleString()}</p>
                    </div>
                  )}
                  {campaign.completedDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Completed Date</p>
                      <p className="font-medium">{campaign.completedDate.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <PageConsole
            title="Campaign Logs"
            source={`campaigns/${id}/logs`}
            height="lg"
            showSearch
            showControls
            autoConnect={false}
            logCategories={['SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'ERROR']}
          />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
};

export default CampaignDetailsPage;
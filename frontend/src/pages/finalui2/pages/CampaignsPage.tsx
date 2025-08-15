import React, { useState, useEffect } from 'react';
import { getSessionId } from '@/utils/getSessionId';
import { listCampaigns } from '@/api/campaigns';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { generateCampaignData } from '@/services/mockData';
// Using MainLayout globally; no local layout wrapper
import PageConsole from '@/components/ui/PageConsole';
import PageShell from '../components/PageShell';
// Replaced design-system GlassPanel with Card equivalents
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProBadge from '@/components/ui/ProBadge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getSessionId as getSid } from '@/utils/getSessionId';
import {
  createCampaign as apiCreateCampaign,
  startCampaign,
  pauseCampaign,
  stopCampaign,
  deleteCampaign
} from '@/api/campaigns';
  import { apiClient } from '@/http/stable-api-client'
// Error presentation moved to stable API client
// For now, using simple error handling
const presentErrorToUser = (error: unknown) => console.error('Error:', error);
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox'

import { Separator } from '@/components/ui/separator';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeletonRow } from '@/components/table-skeleton';
import { toast } from '@/hooks/useToast';
// Removed legacy ui-kit ActionButton; using shadcn Button variants exclusively
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  RocketLaunchIcon,
  ChartBarIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  FunnelIcon,
  UserGroupIcon,
  EnvelopeIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  CpuChipIcon,
  CursorArrowRaysIcon,
  DocumentTextIcon,
  WifiIcon,
  PaintBrushIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { Download, Sparkles, Mail, Send, XCircle as XCircleLucide, RefreshCcw, Server, Eye, MousePointerClick, AlertOctagon } from 'lucide-react'
import AnalyticsAPI, { type BusinessMetrics } from '@/api/analytics-api'
import { getSessionStats, type SessionStats } from '@/api/sessionStats'
import {
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid
} from '@heroicons/react/24/solid';

interface Campaign {
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
  aiScore: number;
  aiSuggestions: string[];
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  template: string;
  abVariants?: {
    id: string;
    name: string;
    subject: string;
    performance: number;
    winner?: boolean;
  }[];
}

const CampaignsPage: React.FC = () => {
  const toDate = (v: unknown): Date | undefined => {
    if (!v) return undefined
    const d = typeof v === 'string' || typeof v === 'number' ? new Date(v) : (v as Date)
    return isNaN(d as any) ? undefined : d
  }

  const defaultMockCampaigns: Campaign[] = [
    {
      id: 'demo-1',
      name: 'Welcome Series',
      status: 'running',
      type: 'automated',
      subject: 'Welcome to SpamGPT!',
      fromName: 'Marketing',
      fromEmail: 'marketing@example.com',
      replyTo: 'marketing@example.com',
      lists: ['All Users'],
      segments: [],
      totalRecipients: 12500,
      sent: 8200,
      delivered: 8000,
      opened: 4200,
      clicked: 1100,
      bounced: 50,
      unsubscribed: 12,
      complained: 0,
      revenue: 0,
      scheduledDate: undefined,
      sentDate: toDate(Date.now() - 1000 * 60 * 60 * 2),
      completedDate: undefined,
      aiScore: 88,
      aiSuggestions: ['Try personalization', 'Send earlier in the day'],
      tags: ['welcome', 'automation'],
      priority: 'medium',
      progress: 65,
      template: 'welcome',
      abVariants: []
    },
    {
      id: 'demo-2',
      name: 'Black Friday Teaser',
      status: 'scheduled',
      type: 'regular',
      subject: 'Something big is coming…',
      fromName: 'Sales',
      fromEmail: 'sales@example.com',
      replyTo: 'sales@example.com',
      lists: ['Newsletter'],
      segments: [],
      totalRecipients: 58000,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
      complained: 0,
      revenue: 0,
      scheduledDate: toDate(Date.now() + 1000 * 60 * 60 * 24),
      sentDate: undefined,
      completedDate: undefined,
      aiScore: 92,
      aiSuggestions: ['Test emoji in subject'],
      tags: ['bf', 'promo'],
      priority: 'high',
      progress: 0,
      template: 'promo',
      abVariants: []
    }
  ]
  // Load mock campaigns by default so UI is never empty/broken in dev
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const fetchCampaigns = async () => {
    const sessionId = getSessionId();
    try {
      setIsLoading(true);
      setError(null);
      if (!sessionId) {
        // Use faker-generated campaigns instead of static mock data
        const mockData = generateCampaignData();
        const fakerCampaigns = mockData.campaigns.map(c => ({
          id: c.id,
          name: c.name,
          status: c.status as Campaign['status'],
          type: 'regular' as Campaign['type'],
          subject: c.subject,
          fromName: c.fromName,
          fromEmail: c.fromEmail,
          replyTo: c.replyTo,
          lists: [],
          segments: [],
          totalRecipients: c.recipients,
          sent: c.sent,
          delivered: c.sent - c.bounced,
          opened: c.opened,
          clicked: c.clicked,
          bounced: c.bounced,
          unsubscribed: c.unsubscribed,
          complained: 0,
          revenue: Math.random() * 10000,
          scheduledDate: c.scheduledFor ? new Date(c.scheduledFor) : undefined,
          sentDate: c.completedAt ? new Date(c.completedAt) : undefined,
          completedDate: c.completedAt ? new Date(c.completedAt) : undefined,
          aiScore: Math.floor(Math.random() * 30) + 70,
          aiSuggestions: [],
          tags: c.tags,
          priority: 'medium' as Campaign['priority'],
          progress: c.status === 'sent' ? 100 : c.status === 'sending' ? 50 : 0,
          template: 'default',
          abVariants: []
        }));
        setCampaigns(fakerCampaigns);
        toast.info?.('Using realistic demo campaigns');
        return;
      }
      const data = await listCampaigns(sessionId);
      const rows = Array.isArray((data as any)?.data) ? (data as any).data : data;
      if (Array.isArray(rows) && rows.length > 0) {
        setCampaigns(
          rows.map((c: unknown) => ({
            id: c.id,
            name: c.name || c.campaign_name || `Campaign ${c.id}`,
            status: c.status || 'draft',
            type: c.type || 'regular',
            subject: c.subject || '',
            fromName: c.from_name || c.fromName || '',
            fromEmail: c.from_email || c.fromEmail || '',
            replyTo: c.reply_to || c.fromEmail || '',
            lists: c.lists || [],
            segments: c.segments || [],
            totalRecipients: c.total_recipients || c.totalRecipients || 0,
            sent: c.sent || 0,
            delivered: c.delivered ?? c.sent ?? 0,
            opened: c.opened ?? 0,
            clicked: c.clicked ?? 0,
            bounced: c.bounced ?? 0,
            unsubscribed: c.unsubscribed ?? 0,
            complained: c.complained ?? 0,
            revenue: c.revenue ?? 0,
            scheduledDate: toDate(c.scheduled_at || c.scheduledDate),
            sentDate: toDate(c.sent_at || c.sentDate),
            completedDate: toDate(c.completed_at || c.completedDate),
            aiScore: c.ai_score ?? c.aiScore ?? 0,
            aiSuggestions: c.ai_suggestions || c.aiSuggestions || [],
            tags: c.tags || [],
            priority: (['low', 'medium', 'high', 'urgent'] as const).includes(c.priority) ? c.priority : 'medium',
            progress: c.progress || 0,
            template: c.template || 'default',
            abVariants: c.ab_variants || c.abVariants || [],
          }))
        );
      } else {
        // Use faker-generated campaigns when no data found
        const mockData = generateCampaignData();
        const fakerCampaigns = mockData.campaigns.map(c => ({
          id: c.id,
          name: c.name,
          status: c.status as Campaign['status'],
          type: 'regular' as Campaign['type'],
          subject: c.subject,
          fromName: c.fromName,
          fromEmail: c.fromEmail,
          replyTo: c.replyTo,
          lists: [],
          segments: [],
          totalRecipients: c.recipients,
          sent: c.sent,
          delivered: c.sent - c.bounced,
          opened: c.opened,
          clicked: c.clicked,
          bounced: c.bounced,
          unsubscribed: c.unsubscribed,
          complained: 0,
          revenue: Math.random() * 10000,
          scheduledDate: c.scheduledFor ? new Date(c.scheduledFor) : undefined,
          sentDate: c.completedAt ? new Date(c.completedAt) : undefined,
          completedDate: c.completedAt ? new Date(c.completedAt) : undefined,
          aiScore: Math.floor(Math.random() * 30) + 70,
          aiSuggestions: [],
          tags: c.tags,
          priority: 'medium' as Campaign['priority'],
          progress: c.status === 'sent' ? 100 : c.status === 'sending' ? 50 : 0,
          template: 'default',
          abVariants: []
        }));
        setCampaigns(fakerCampaigns);
        toast.info?.('No campaigns found, showing realistic demo data');
      }
    } catch (e: unknown) {
      setError('Failed to load campaigns');
      // Use faker-generated campaigns on error
      const mockData = generateCampaignData();
      const fakerCampaigns = mockData.campaigns.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status as Campaign['status'],
        type: 'regular' as Campaign['type'],
        subject: c.subject,
        fromName: c.fromName,
        fromEmail: c.fromEmail,
        replyTo: c.replyTo,
        lists: [],
        segments: [],
        totalRecipients: c.recipients,
        sent: c.sent,
        delivered: c.sent - c.bounced,
        opened: c.opened,
        clicked: c.clicked,
        bounced: c.bounced,
        unsubscribed: c.unsubscribed,
        complained: 0,
        revenue: Math.random() * 10000,
        scheduledDate: c.scheduledFor ? new Date(c.scheduledFor) : undefined,
        sentDate: c.completedAt ? new Date(c.completedAt) : undefined,
        completedDate: c.completedAt ? new Date(c.completedAt) : undefined,
        aiScore: Math.floor(Math.random() * 30) + 70,
        aiSuggestions: [],
        tags: c.tags,
        priority: 'medium' as Campaign['priority'],
        progress: c.status === 'sent' ? 100 : c.status === 'sending' ? 50 : 0,
        template: 'default',
        abVariants: []
      }));
      setCampaigns(fakerCampaigns);
      toast.error?.(e?.message || 'Failed to load campaigns - showing demo data');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => { void fetchCampaigns(); }, [])

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSubject, setCreateSubject] = useState("");
  const [createType, setCreateType] = useState("regular");
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data for large charts under the top monitor
  const performanceData = [
    { time: '00:00', sent: 0, opened: 0, clicked: 0 },
    { time: '04:00', sent: 5000, opened: 1200, clicked: 300 },
    { time: '08:00', sent: 15000, opened: 6000, clicked: 1800 },
    { time: '12:00', sent: 25000, opened: 12000, clicked: 4000 },
    { time: '16:00', sent: 35000, opened: 18000, clicked: 6500 },
    { time: '20:00', sent: 42000, opened: 24000, clicked: 8200 },
    { time: '24:00', sent: 45250, opened: 28450, clicked: 9500 },
  ];

  const engagementData = [
    { name: 'Delivered', value: 62, color: '#10b981' },
    { name: 'Opened', value: 34, color: '#3b82f6' },
    { name: 'Clicked', value: 10, color: '#8b5cf6' },
    { name: 'Bounced', value: 1, color: '#d946ef' },
  ];

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'running': return <PlayIcon className="w-4 h-4" />;
      case 'paused': return <PauseIcon className="w-4 h-4" />;
      case 'scheduled': return <ClockIcon className="w-4 h-4" />;
      case 'completed': return <CheckCircleIcon className="w-4 h-4" />;
      case 'failed': return <XCircleIcon className="w-4 h-4" />;
      default: return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'running': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'paused': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'scheduled': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed': return 'bg-muted/10 text-muted-foreground border-border/20';
      case 'failed': return 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20';
      default: return 'bg-muted/10 text-muted-foreground border-border/20';
    }
  };

  const getPriorityColor = (priority: Campaign['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-fuchsia-500/20 text-fuchsia-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-muted/20 text-muted-foreground';
    }
  };

  const handleCampaignAction = async (action: string, campaign: Campaign) => {
    const sessionId = getSessionId();
    if (!sessionId) {
      toast.error?.('No session found');
      return;
    }

    try {
      switch (action) {
        case 'start':
          await startCampaign(sessionId, campaign.id);
          toast.success?.(`Campaign "${campaign.name}" started`);
          await fetchCampaigns();
          break;
        case 'pause':
          await pauseCampaign(sessionId, campaign.id);
          toast.success?.(`Campaign "${campaign.name}" paused`);
          await fetchCampaigns();
          break;
        case 'stop':
          await stopCampaign(sessionId, campaign.id);
          toast.success?.(`Campaign "${campaign.name}" stopped`);
          await fetchCampaigns();
          break;
        case 'export-csv':
          await apiClient.downloadFile(`/campaigns/${campaign.id}/emails/export?format=csv`, `${campaign.name || 'campaign'}-emails.csv`)
          toast.success?.('Export started')
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
            await deleteCampaign(sessionId, campaign.id);
            toast.success?.(`Campaign "${campaign.name}" deleted`);
            await fetchCampaigns();
          }
          break;
        default:
          console.log(`Action ${action} not implemented yet`);
      }
    } catch (error: unknown) {
      presentErrorToUser(error, `Failed to ${action} campaign`)
    }
  };

  const reduceMotion = useReducedMotion()

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.concat(id))
  }

  const toggleSelectAllOnPage = (ids: string[]) => {
    const allSelected = ids.every(id => selectedIds.includes(id))
    if (allSelected) setSelectedIds(prev => prev.filter(id => !ids.includes(id)))
    else setSelectedIds(prev => Array.from(new Set([...prev, ...ids])))
  }

  const handleBulk = async (action: 'start'|'pause'|'stop'|'delete') => {
    const sid = getSessionId()
    if (!sid) { toast.error?.('No session'); return }
    if (selectedIds.length === 0) return
    if (action === 'delete' && !window.confirm(`Delete ${selectedIds.length} campaign(s)?`)) return
    const operations = selectedIds.map(async (id) => {
      try {
        switch (action) {
          case 'start': await startCampaign(sid, id); break
          case 'pause': await pauseCampaign(sid, id); break
          case 'stop': await stopCampaign(sid, id); break
          case 'delete': await deleteCampaign(sid, id); break
        }
        return { id, ok: true }
      } catch (e: unknown) {
        presentErrorToUser(e, `Failed to ${action} campaign ${id}`)
        return { id, ok: false, error: e?.message || 'failed' }
      }
    })
    const results = await Promise.allSettled(operations)
    const ok = results.filter(r => r.status === 'fulfilled' && (r.value as any)?.ok).length
    const fail = selectedIds.length - ok
    toast.success?.(`${action} completed: ${ok} ok, ${fail} failed`)
    setSelectedIds([])
    await fetchCampaigns()
  }

  const totals = React.useMemo(() => {
    const sum = (fn: (c: Campaign) => number) => campaigns.reduce((acc, c) => acc + (fn(c) || 0), 0)
    const totalCampaigns = campaigns.length
    const totalRecipients = sum(c => c.totalRecipients)
    const totalSent = sum(c => c.sent)
    const totalDelivered = sum(c => c.delivered)
    const totalOpened = sum(c => c.opened)
    const totalClicked = sum(c => c.clicked)
    const totalBounced = sum(c => c.bounced)
    const totalUnsubscribed = sum(c => c.unsubscribed)
    const totalComplained = sum(c => c.complained)
    const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0)
    return {
      totalCampaigns,
      totalRecipients,
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalBounced,
      totalUnsubscribed,
      totalComplained,
      deliveryRate: pct(totalDelivered, totalRecipients),
      openRate: pct(totalOpened, totalDelivered || totalSent),
      clickRate: pct(totalClicked, totalOpened || totalDelivered || totalSent),
      bounceRate: pct(totalBounced, totalSent),
      unsubscribeRate: pct(totalUnsubscribed, totalSent),
      complaintRate: pct(totalComplained, totalSent),
      // Data not available from current campaigns payload; placeholders
      totalRetried: 0,
      totalSmtps: 0,
    }
  }, [campaigns])

  // Global metrics (Prometheus/Grafana-backed API)
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null)
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [metricsError, setMetricsError] = useState<string | null>(null)

  const refreshGlobalMetrics = async () => {
    try {
      setMetricsLoading(true)
      setMetricsError(null)
      const sid = getSessionId()
      const [bm, ss] = await Promise.allSettled([
        AnalyticsAPI.getBusinessMetrics('24h'),
        sid ? getSessionStats(sid) : Promise.resolve(null as any),
      ])
      setBusinessMetrics(bm.status === 'fulfilled' ? bm.value : null)
      setSessionStats(ss && (ss as any).status === 'fulfilled' ? (ss as any).value : null)
    } catch (e: unknown) {
      setMetricsError(e?.message || 'Failed to load metrics')
    } finally {
      setMetricsLoading(false)
    }
  }

  useEffect(() => { void refreshGlobalMetrics() }, [])

  return (
    <TooltipProvider>
      <PageShell
        title="Campaigns"
        titleIcon={
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/30">
            <RocketLaunchIcon className="w-4 h-4 text-primary neon-glow" />
          </span>
        }
        subtitle="AI-assisted campaign management with live monitoring"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Campaigns' }]}
        toolbar={
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={() => setShowCreateDialog(true)}>
              <PlusIcon className="w-4 h-4 mr-2" /> New Campaign
            </Button>
            <Button variant="outline"><Download className="w-4 h-4 mr-2 rotate-180" /> Import CSV</Button>
            <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
          </div>
        }
      >

        <motion.div
          className="relative z-10"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={reduceMotion ? undefined : { duration: 0.3 }}
        >
          {/* Top Monitor Console */}
          <PageConsole
            title="Campaign Monitor"
            source="campaigns"
            height="md"
            logCategories={['SENT', 'OPEN', 'CLICK', 'BOUNCE', 'AI']}
            showSearch
            showControls
            autoConnect
            className="mb-6"
          />
          {/* Large Analytics under Console */}
          <div className="mb-6">
            <Card variant="premium" className="hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <ChartBarIcon className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-muted-800">Live Campaign Analytics</h3>
                <ProBadge />
              </div>
              <p className="text-sm text-muted-600 mb-4">Real-time campaign metrics and trends across sends, opens, clicks, and bounces.</p>
              {isLoading ? (
                <div className="premium-grid-3 lg:grid-cols-[2fr_1fr]">
                  <div className="lg:col-span-2 space-y-3">
                    <Skeleton className="h-[340px] w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-[340px] w-full" />
                  </div>
                </div>
              ) : (
                <div className="premium-grid-3 lg:grid-cols-[2fr_1fr]">
                  <div className="lg:col-span-2">
                    <ResponsiveContainer width="100%" height={340}>
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="colorSentLarge" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorOpenedLarge" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorClickedLarge" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="time" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#0b1220', border: '1px solid rgba(34,211,238,0.25)', boxShadow: '0 0 24px rgba(34,211,238,0.12)' }}
                          labelStyle={{ color: '#f3f4f6' }}
                        />
                        <Area type="monotone" dataKey="sent" stroke="#22d3ee" fillOpacity={1} fill="url(#colorSentLarge)" />
                        <Area type="monotone" dataKey="opened" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOpenedLarge)" />
                        <Area type="monotone" dataKey="clicked" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorClickedLarge)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <ResponsiveContainer width="100%" height={340}>
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="time" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: '#0b1220',
                            border: '1px solid rgba(139,92,246,0.25)'
                          }}
                        />
                        <Bar dataKey="sent" stackId="a" fill="#22d3ee" opacity={0.9} />
                        <Bar dataKey="opened" stackId="a" fill="#3b82f6" opacity={0.9} />
                        <Bar dataKey="clicked" stackId="a" fill="#8b5cf6" opacity={0.9} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </Card>
          </div>
          <Card className="bg-background/60 border-border backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardContent className="p-4 space-y-8">
              {/* Enhanced Header with Better Contrast */}
              <div className="page-header mb-8">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shadow-sm">
                      <RocketLaunchIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                        Campaign Management Center
                      </h1>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          <WifiIcon className="w-3 h-3 mr-1" /> Live monitoring enabled
                        </Badge>
                        <Badge variant="outline" className="border-muted/30 text-muted-foreground">
                          {campaigns.filter(c => c.status === 'running').length} Active
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => setShowAIAssistant(!showAIAssistant)}>
                      <Sparkles className="w-4 h-4 mr-2" /> AI Assistant
                    </Button>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <PlusIcon className="w-4 h-4 mr-2" /> New Campaign
                    </Button>
                  </div>
                </div>

              </div>

              {/* Main Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card className="bg-card border-border hover:border-primary/40 transition-colors group cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform">
                                <EnvelopeIcon className="w-5 h-5 text-blue-400" />
                              </div>
                              <div>
                                {isLoading ? (
                                  <>
                                    <Skeleton className="h-6 w-24" />
                                    <Skeleton className="h-4 w-28 mt-1" />
                                  </>
                                ) : (
                                  <>
                                    <p className="text-2xl font-bold text-foreground group-hover:text-foreground transition-colors">148,670</p>
                                    <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">Total Sent</p>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 h-2 bg-muted/800 rounded-full overflow-hidden">
                              {isLoading ? (
                                <Skeleton className="h-2 w-full" />
                              ) : (
                                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 w-3/4" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-muted/800 border-700">
                        <p className="text-muted-200">Email campaigns sent</p>
                        <p className="text-xs text-muted-400">Last 30 days</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card className="bg-card border-border hover:border-emerald-400/40 transition-colors group cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform">
                                <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                              </div>
                              <div>
                                {isLoading ? (
                                  <>
                                    <Skeleton className="h-6 w-16" />
                                    <Skeleton className="h-4 w-24 mt-1" />
                                  </>
                                ) : (
                                  <>
                                    <p className="text-2xl font-bold text-foreground group-hover:text-foreground transition-colors">98.2%</p>
                                    <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">Delivery Rate</p>
                                  </>
                                )}
                              </div>
                            </div>
                            {isLoading ? (
                              <Skeleton className="h-3 w-20 mt-3" />
                            ) : (
                              <div className="flex items-center gap-1 mt-3 text-emerald-400 text-sm">
                                <ArrowTrendingUpIcon className="w-4 h-4" />
                                <span>+2.3%</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-muted/800 border-700">
                        <p className="text-muted-200">Email delivery success rate</p>
                        <p className="text-xs text-muted-400">Industry benchmark: 95%</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card className="bg-card border-border hover:border-indigo-400/40 transition-colors group cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform">
                                <CursorArrowRaysIcon className="w-5 h-5 text-indigo-400" />
                              </div>
                              <div>
                                {isLoading ? (
                                  <>
                                    <Skeleton className="h-6 w-16" />
                                    <Skeleton className="h-4 w-24 mt-1" />
                                  </>
                                ) : (
                                  <>
                                    <p className="text-2xl font-bold text-foreground group-hover:text-foreground transition-colors">54.3%</p>
                                    <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">Open Rate</p>
                                  </>
                                )}
                              </div>
                            </div>
                            {isLoading ? (
                              <Skeleton className="h-3 w-20 mt-3" />
                            ) : (
                              <div className="flex items-center gap-1 mt-3 text-emerald-400 text-sm">
                                <ArrowTrendingUpIcon className="w-4 h-4" />
                                <span>+5.7%</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-muted/800 border-700">
                        <p className="text-muted-200">Email open rate performance</p>
                        <p className="text-xs text-muted-400">Above industry average</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card className="bg-card border-border hover:border-primary/40 transition-colors group cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform">
                                <CpuChipIcon className="w-5 h-5 text-blue-400" />
                              </div>
                              <div>
                                {isLoading ? (
                                  <>
                                    <Skeleton className="h-6 w-10" />
                                    <Skeleton className="h-4 w-16 mt-1" />
                                  </>
                                ) : (
                                  <>
                                    <p className="text-2xl font-bold text-foreground group-hover:text-foreground transition-colors">92</p>
                                    <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">AI Score</p>
                                  </>
                                )}
                              </div>
                            </div>
                            {isLoading ? (
                              <Skeleton className="h-6 w-24 mt-3" />
                            ) : (
                              <Badge className="mt-3 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Excellent</Badge>
                            )}
                          </CardContent>
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-muted/800 border-700">
                        <p className="text-muted-200">AI optimization score</p>
                        <p className="text-xs text-muted-400">Based on content, timing & targeting</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Filters and Search */}
                  <Card variant="premium">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center premium-spacing">
                        <div className="relative flex-1 min-w-64">
                          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-500" />
                          <Input placeholder="Search campaigns..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64 max-w-full" />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Campaigns</SelectItem>
                            <SelectItem value="running">Running</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">Date Created</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="performance">Performance</SelectItem>
                            <SelectItem value="recipients">Recipients</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline"><FunnelIcon className="w-4 h-4 mr-2" /> More Filters</Button>
                        <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Create Campaign Dialog */}
                  <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogContent className="sm:max-w-[560px]">
                      <DialogHeader>
                        <DialogTitle>Create Campaign</DialogTitle>
                        <DialogDescription>Provide minimal details to create a draft campaign.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="new-name">Name</Label>
                          <Input id="new-name" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Spring Promo" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-subject">Subject</Label>
                          <Input id="new-subject" value={createSubject} onChange={(e) => setCreateSubject(e.target.value)} placeholder="Save 20% this week" />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select value={createType} onValueChange={setCreateType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="regular">Regular</SelectItem>
                              <SelectItem value="automated">Automated</SelectItem>
                              <SelectItem value="ab-test">A/B Test</SelectItem>
                              <SelectItem value="transactional">Transactional</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                        <Button
                          onClick={async () => {
                            if (!createName.trim()) { toast.error?.('Name is required'); return; }
                            if (!createSubject.trim()) { toast.error?.('Subject is required'); return; }
                            try {
                              setCreating(true);
                              const sid = getSid();
                              if (!sid) throw new Error("No session");
                              await apiCreateCampaign(sid, {
                                name: createName,
                                template_id: "default",
                                subject: createSubject,
                                lead_base_ids: [],
                                batch_size: 100,
                                delay_between_batches: 1000,
                                threads_count: 1,
                                autostart: false,
                                proxy_type: 'none',
                                retry_limit: 0,
                                smtps: [],
                                proxies: [],
                                subjects: [createSubject].filter(Boolean),
                                templates: [],
                                content_blocks: [],
                              } as any);
                              await fetchCampaigns();
                              setShowCreateDialog(false);
                              setCreateName("");
                              setCreateSubject("");
                              toast.success?.('Campaign created');
                            } catch (e) {
                              console.error(e);
                              toast.error?.('Failed to create campaign');
                            } finally {
                              setCreating(false);
                            }
                          }}
                          disabled={creating || !createName.trim()}
                        >
                          {creating ? 'Creating…' : 'Create'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Campaigns Table */}
                  <div>
                    {error && (
                      <Alert variant="destructive" className="mb-3">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="overflow-x-auto">
                      <Table className="min-w-[64rem] text-sm">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">
                              <Checkbox
                                checked={(() => {
                                  const visible = campaigns
                                    .filter((c) => (filterStatus === 'all' ? true : c.status === filterStatus))
                                    .filter((c) => (searchQuery ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) : true))
                                    .map(c => c.id)
                                  return visible.length > 0 && visible.every(id => selectedIds.includes(id))
                                })()}
                                onCheckedChange={() => {
                                  const visible = campaigns
                                    .filter((c) => (filterStatus === 'all' ? true : c.status === filterStatus))
                                    .filter((c) => (searchQuery ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) : true))
                                    .map(c => c.id)
                                  toggleSelectAllOnPage(visible)
                                }}
                              />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Recipients</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            [...Array(5)].map((_, i) => <TableSkeletonRow key={i} columns={7} />)
                          ) : campaigns.length ? (
                            campaigns
                              .filter((c) => (filterStatus === 'all' ? true : c.status === filterStatus))
                              .filter((c) => (searchQuery ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) : true))
                              .map((c) => (
                                <TableRow key={c.id}>
                                  <TableCell className="w-10">
                                    <Checkbox checked={selectedIds.includes(c.id)} onCheckedChange={() => toggleSelect(c.id)} />
                                  </TableCell>
                                  <TableCell className="font-medium">{c.name}</TableCell>
                                  <TableCell>
                                    <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                                  </TableCell>
                                  <TableCell className="capitalize">{c.type}</TableCell>
                                  <TableCell>{c.totalRecipients.toLocaleString()}</TableCell>
                                  <TableCell className="truncate max-w-[22rem]" title={c.subject}>{c.subject || '-'}</TableCell>
                                  <TableCell>
                                    {c.status === 'running' ? (
                                      <div className="flex items-center gap-2">
                                        <Progress value={c.progress} className="h-2 w-28" />
                                        <span className="text-xs text-muted-foreground">{c.progress}%</span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="icon" variant="ghost">
                                          <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setSelectedCampaign(c)}>
                                          <EyeIcon className="w-4 h-4 mr-2" /> View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <PencilIcon className="w-4 h-4 mr-2" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {c.status === 'draft' || c.status === 'scheduled' || c.status === 'paused' ? (
                                          <DropdownMenuItem onClick={() => handleCampaignAction('start', c)}>
                                            <PlayIcon className="w-4 h-4 mr-2" /> Start
                                          </DropdownMenuItem>
                                        ) : null}
                                        {c.status === 'running' ? (
                                          <DropdownMenuItem onClick={() => handleCampaignAction('pause', c)}>
                                            <PauseIcon className="w-4 h-4 mr-2" /> Pause
                                          </DropdownMenuItem>
                                        ) : null}
                                        {c.status === 'running' || c.status === 'paused' ? (
                                          <DropdownMenuItem onClick={() => handleCampaignAction('stop', c)}>
                                            <XCircleIcon className="w-4 h-4 mr-2" /> Stop
                                          </DropdownMenuItem>
                                        ) : null}
                                        <DropdownMenuItem onClick={() => handleCampaignAction('export-csv', c)}>
                                          <Download className="w-4 h-4 mr-2" /> Export Emails (CSV)
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          className="text-destructive hover:text-destructive"
                                          onClick={() => handleCampaignAction('delete', c)}
                                        >
                                          <TrashIcon className="w-4 h-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-10">
                                No campaigns yet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <motion.div className="lg:col-span-1 space-y-6">
                  {/* Removed small sidebar monitor and small realtime chart */}

                  {/* AI Recommendations */}
                  <div className="p-4 hover:border-primary/30 transition-all bg-card border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-sm font-semibold text-white">AI Recommendations</h3>
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3 p-3 rounded-md bg-background/60 border border-border">
                        <div className="shrink-0 w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                          <ClockIcon className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-white">Optimal Send Time</div>
                          <p className="text-xs text-muted-foreground">Send at 10 AM (recipient local time) for +23% opens</p>
                          <Button size="sm" variant="outline" className="mt-2">Apply Suggestion</Button>
                        </div>
                      </li>
                      <li className="flex items-start gap-3 p-3 rounded-md bg-background/60 border border-border">
                        <div className="shrink-0 w-8 h-8 rounded-md bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                          <LightBulbIcon className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-white">Subject Line Improvement</div>
                          <p className="text-xs text-muted-foreground">Use first-name personalization for +15% opens</p>
                          <Button size="sm" variant="outline" className="mt-2">View Details</Button>
                        </div>
                      </li>
                      <li className="flex items-start gap-3 p-3 rounded-md bg-background/60 border border-border">
                        <div className="shrink-0 w-8 h-8 rounded-md bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                          <UserGroupIcon className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-white">Segment Optimization</div>
                          <p className="text-xs text-muted-foreground">Create a high-engagement segment to target active users</p>
                          <Button size="sm" variant="outline" className="mt-2">Create Segment</Button>
                        </div>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              </div>

              {/* Global Campaigns Metrics Overview */}
              <div className="mt-8">
                {selectedIds.length > 0 && (
                  <Card variant="elevated" className="mb-4 border-primary/30">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-sm">{selectedIds.length} selected</div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => void handleBulk('start')}>Start</Button>
                        <Button size="sm" variant="outline" onClick={() => void handleBulk('pause')}>Pause</Button>
                        <Button size="sm" variant="outline" onClick={() => void handleBulk('stop')}>Stop</Button>
                        <Button size="sm" variant="destructive" onClick={() => void handleBulk('delete')}>Delete</Button>
                      </div>
                    </div>
                  </Card>
                )}
                <Card variant="premium" className="hover:border-cyan-500/30 transition-all">
                  <div className="flex items-center gap-2 mb-4">
                    <ChartBarIcon className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-muted-800">All Campaigns Overview</h3>
                    <div className="ml-auto flex items-center gap-2">
                      {metricsError ? (
                        <span className="text-xs text-destructive">{metricsError}</span>
                      ) : null}
                      <Button size="sm" variant="ghost" onClick={() => void refreshGlobalMetrics()} disabled={metricsLoading}>
                        <RefreshCcw className="w-4 h-4 mr-2" /> {metricsLoading ? 'Refreshing…' : 'Refresh'}
                      </Button>
                    </div>
                  </div>
                  <div className="premium-grid-auto max-w-6xl">
                    {/* Total Sent */}
                    <div className="p-4 rounded-lg bg-background/60 border border-sky-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted-500">Total Sent</div>
                        <div className="w-8 h-8 rounded-md bg-sky-500/10 border border-sky-500/30 flex items-center justify-center"><Mail className="w-4 h-4 text-sky-400" /></div>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{(businessMetrics?.campaigns.total_sent ?? totals.totalSent).toLocaleString()}</div>
                    </div>

                    {/* Successful */}
                    <div className="p-4 rounded-lg bg-background/60 border border-emerald-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted-500">Successful</div>
                        <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center"><Send className="w-4 h-4 text-emerald-400" /></div>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{(businessMetrics?.campaigns.successful ?? (totals.totalDelivered || 0)).toLocaleString()}</div>
                      <div className="text-xs text-emerald-400 mt-1">Success {((businessMetrics?.campaigns.success_rate ?? totals.deliveryRate) || 0).toFixed(1)}%</div>
                    </div>

                    {/* Failed */}
                    <div className="p-4 rounded-lg bg-background/60 border border-rose-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted-500">Failed</div>
                        <div className="w-8 h-8 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-center justify-center"><XCircleLucide className="w-4 h-4 text-rose-400" /></div>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{(businessMetrics?.campaigns.failed ?? totals.totalBounced).toLocaleString()}</div>
                    </div>

                    {/* Retries */}
                    <div className="p-4 rounded-lg bg-background/60 border border-amber-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted-500">Retries</div>
                        <div className="w-8 h-8 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center"><RefreshCcw className="w-4 h-4 text-amber-400" /></div>
                      </div>
                      <div className="text-2xl font-bold text-foreground">—</div>
                      <div className="text-xs text-muted-500 mt-1">Connect Prometheus for retry counts</div>
                    </div>

                    {/* SMTP Accounts */}
                    <div className="p-4 rounded-lg bg-background/60 border border-violet-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted-500">SMTP Accounts</div>
                        <div className="w-8 h-8 rounded-md bg-violet-500/10 border border-violet-500/30 flex items-center justify-center"><Server className="w-4 h-4 text-violet-400" /></div>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{(sessionStats?.smtp?.total_accounts ?? 0).toLocaleString()}</div>
                    </div>

                    {/* Open Rate */}
                    <div className="p-4 rounded-lg bg-background/60 border border-indigo-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted-foreground">Open Rate</div>
                        <div className="w-8 h-8 rounded-md bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center"><Eye className="w-4 h-4 text-indigo-400" /></div>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{((businessMetrics?.campaigns.open_rate ?? totals.openRate) || 0).toFixed(1)}%</div>
                    </div>

                    {/* Click Rate */}
                    <div className="p-4 rounded-lg bg-background/60 border border-cyan-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted-foreground">Click Rate</div>
                        <div className="w-8 h-8 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center"><MousePointerClick className="w-4 h-4 text-cyan-400" /></div>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{((businessMetrics?.campaigns.click_rate ?? totals.clickRate) || 0).toFixed(1)}%</div>
                    </div>

                    {/* Bounce Rate */}
                    <div className="p-4 rounded-lg bg-background/60 border border-fuchsia-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted-foreground">Bounce Rate</div>
                        <div className="w-8 h-8 rounded-md bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center"><AlertOctagon className="w-4 h-4 text-fuchsia-400" /></div>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{((businessMetrics?.campaigns.bounce_rate ?? totals.bounceRate) || 0).toFixed(1)}%</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* AI Assistant Panel */}
              <AnimatePresence>
                {showAIAssistant && (
                  <motion.div
                    initial={{ x: 400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 400, opacity: 0 }}
                    className="ai-assistant-panel"
                  >
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-cyan-400" />
                            AI Campaign Assistant
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setShowAIAssistant(false)}
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="ai-chat">
                          <div className="chat-messages">
                            <div className="ai-message">
                              <p>Hello! I'm your AI Campaign Assistant. I can help you:</p>
                              <ul className="mt-2 space-y-1 text-sm">
                                <li>• Optimize subject lines</li>
                                <li>• Suggest best send times</li>
                                <li>• Generate campaign content</li>
                                <li>• Analyze performance metrics</li>
                                <li>• Create A/B test variations</li>
                              </ul>
                            </div>
                          </div>
                          <div className="chat-input">
                            <Input placeholder="Ask me anything about campaigns..." />
                            <Button size="icon">
                              <ChevronRightIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Removed heavy inline animations/styles to prevent flicker */}
            </CardContent>
          </Card>
        </motion.div>
      </PageShell>
    </TooltipProvider>
  );
};

export default CampaignsPage;
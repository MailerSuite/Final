import React, { useState } from 'react';
import { motion } from 'framer-motion';
// Removed legacy design-system.css; relying on Tailwind/shadcn styles
import PageShell from '../components/PageShell';
import PageConsole from '@/components/ui/PageConsole';
import {
  SparklesIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  BeakerIcon,
  BoltIcon,
  CpuChipIcon,
  LightBulbIcon,
  ClockIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  DocumentDuplicateIcon,
  WifiIcon,
  ShieldCheckIcon,
  PlusIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  CursorArrowRaysIcon,
  EyeIcon,
  UserGroupIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon,
  InboxArrowDownIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ChartPieIcon,
  CalendarIcon,
  TagIcon,
  FunnelIcon,
  BeakerIcon as TestTubeIcon,
  CommandLineIcon,
  CloudArrowUpIcon,
  ServerIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SoonBadge from '@/components/ui/SoonBadge';

// Enhanced Campaign Card Component with Luxury Design
const CampaignCard: React.FC<{ campaign: any; index: number }> = ({ campaign, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.05 * index, type: "spring", stiffness: 100 }}
    whileHover={{ y: -4 }}
  >
    <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardContent className="relative p-5">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 group-hover:scale-110 transition-transform duration-300">
              <RocketLaunchIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                  {campaign.name}
                </h3>
                {campaign.aiOptimized && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-purple-500/30 hover:border-purple-400/50 transition-all">
                          <SparklesIcon className="w-3 h-3 mr-1 text-purple-400" />
                          <span className="text-purple-300 text-xs">AI</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">GPT-4 Optimized Campaign</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {campaign.createdAt}
                </span>
                <span className="flex items-center gap-1">
                  <TagIcon className="w-3 h-3" />
                  {campaign.category || 'Marketing'}
                </span>
                <span className="flex items-center gap-1">
                  <GlobeAltIcon className="w-3 h-3" />
                  {campaign.region || 'Global'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <Badge 
            variant={campaign.status === 'active' ? 'default' : 'secondary'}
            className="px-3 py-1.5 font-semibold bg-background/50 border-border"
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${
              campaign.status === 'active' ? 'bg-green-500 animate-pulse' :
              campaign.status === 'scheduled' ? 'bg-amber-500 animate-pulse' :
              campaign.status === 'completed' ? 'bg-blue-500' : 'bg-gray-400'
            }`} />
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-5 gap-2 p-3 bg-background/50 rounded-xl border border-border/50 mb-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="text-center group/metric hover:scale-105 transition-transform cursor-pointer">
                  <div className="p-2 bg-blue-500/10 rounded-lg mb-1 mx-auto w-fit border border-blue-500/20 group-hover/metric:border-blue-400/40">
                    <PaperAirplaneIcon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-sm font-bold text-white">{campaign.sent > 1000 ? `${(campaign.sent/1000).toFixed(1)}k` : campaign.sent}</div>
                  <div className="text-xs text-muted-foreground">Sent</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Total emails delivered</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="text-center group/metric hover:scale-105 transition-transform cursor-pointer">
                  <div className="p-2 bg-emerald-500/10 rounded-lg mb-1 mx-auto w-fit border border-emerald-500/20 group-hover/metric:border-emerald-400/40">
                    <EyeIcon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-white">{campaign.openRate}%</div>
                  <div className="text-xs text-muted-foreground">Opens</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Email open rate</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="text-center group/metric hover:scale-105 transition-transform cursor-pointer">
                  <div className="p-2 bg-cyan-500/10 rounded-lg mb-1 mx-auto w-fit border border-cyan-500/20 group-hover/metric:border-cyan-400/40">
                    <CursorArrowRaysIcon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-sm font-bold text-white">{campaign.clickRate}%</div>
                  <div className="text-xs text-muted-foreground">Clicks</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Click-through rate</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="text-center group/metric hover:scale-105 transition-transform cursor-pointer">
                  <div className="p-2 bg-purple-500/10 rounded-lg mb-1 mx-auto w-fit border border-purple-500/20 group-hover/metric:border-purple-400/40">
                    <ChartBarIcon className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-sm font-bold text-white">{campaign.aiScore}%</div>
                  <div className="text-xs text-muted-foreground">AI Score</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">AI optimization score</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="text-center group/metric hover:scale-105 transition-transform cursor-pointer">
                  <div className="p-2 bg-amber-500/10 rounded-lg mb-1 mx-auto w-fit border border-amber-500/20 group-hover/metric:border-amber-400/40">
                    <TrophyIcon className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-sm font-bold text-white">{campaign.conversion || '4.2'}%</div>
                  <div className="text-xs text-muted-foreground">Conv.</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Conversion rate</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* AI Insights */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent rounded-lg border border-emerald-500/20">
            <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300">ROI Prediction:</span>
            <span className="text-sm font-bold text-emerald-400">{campaign.predictedROI}</span>
            <Progress value={parseInt(campaign.predictedROI)} className="w-20 h-1.5 ml-auto" />
          </div>
          
          <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-lg border border-amber-500/20">
            <LightBulbIcon className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs text-amber-300 flex-1">{campaign.nextBestAction}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 h-9 bg-background/50 border-border hover:bg-card hover:border-primary/50 transition-all group/btn"
          >
            <EyeIcon className="w-4 h-4 mr-1.5 group-hover/btn:text-primary transition-colors" />
            <span className="text-xs">Details</span>
          </Button>
          <Button 
            size="sm"
            variant="outline"
            className="flex-1 h-9 bg-background/50 border-border hover:bg-card hover:border-cyan-500/50 transition-all group/btn"
          >
            <DocumentDuplicateIcon className="w-4 h-4 mr-1.5 group-hover/btn:text-cyan-400 transition-colors" />
            <span className="text-xs">Clone</span>
          </Button>
          <Button 
            size="sm"
            className="flex-1 h-9 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transition-all"
          >
            <Cog6ToothIcon className="w-4 h-4 mr-1.5" />
            <span className="text-xs">Configure</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export const AICampaigns: React.FC = () => {
  const [activeTab, setActiveTab] = useState('active');

  const aiFeatures = [
    {
      icon: BoltIcon,
      title: 'Smart Send Time',
      description: 'AI predicts optimal sending time for each recipient based on behavior',
      status: 'active',
      metric: '+42% opens',
      color: 'blue'
    },
    {
      icon: LightBulbIcon,
      title: 'Subject Line Optimizer',
      description: 'Generate and test multiple subject lines with GPT-4',
      status: 'active',
      metric: '87% success',
      color: 'amber'
    },
    {
      icon: CpuChipIcon,
      title: 'Content Personalization',
      description: 'Dynamic content based on user preferences',
      status: 'active',
      metric: '3x engagement',
      color: 'purple'
    },
    {
      icon: FireIcon,
      title: 'Spam Score Predictor',
      description: 'Real-time spam detection and optimization',
      status: 'active',
      metric: '99.8% delivery',
      color: 'red'
    },
    {
      icon: FunnelIcon,
      title: 'Conversion Optimizer',
      description: 'ML-powered CTA and layout optimization',
      status: 'beta',
      metric: '+65% CTR',
      color: 'emerald'
    },
    {
      icon: ChartPieIcon,
      title: 'Audience Segmentation',
      description: 'Automatic segment discovery and targeting',
      status: 'active',
      metric: '12 segments',
      color: 'cyan'
    }
  ];

  const campaigns = [
    {
      id: 1,
      name: 'Black Friday Mega Sale 2024',
      status: 'active',
      aiScore: 95,
      recipients: 25400,
      sent: 12300,
      opens: 8700,
      clicks: 3200,
      aiOptimized: true,
      predictedROI: '+320%',
      nextBestAction: 'Send follow-up to non-openers in 24h',
      openRate: 70.7,
      clickRate: 26.0,
      conversion: 4.2,
      category: 'Promotional',
      region: 'North America',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      name: 'Product Launch - AI Edition',
      status: 'scheduled',
      aiScore: 88,
      recipients: 18200,
      sent: 0,
      opens: 0,
      clicks: 0,
      aiOptimized: true,
      predictedROI: '+280%',
      nextBestAction: 'A/B test emoji in subject lines',
      openRate: 0,
      clickRate: 0,
      conversion: 0,
      category: 'Launch',
      region: 'Global',
      createdAt: '2024-01-20'
    },
    {
      id: 3,
      name: 'Customer Re-engagement',
      status: 'draft',
      aiScore: 72,
      recipients: 8500,
      sent: 0,
      opens: 0,
      clicks: 0,
      aiOptimized: false,
      predictedROI: '+150%',
      nextBestAction: 'Enable AI optimization for +25% performance',
      openRate: 0,
      clickRate: 0,
      conversion: 0,
      category: 'Retention',
      region: 'Europe',
      createdAt: '2024-01-22'
    }
  ];

  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalSent: campaigns.reduce((sum, c) => sum + c.sent, 0),
    avgAIScore: Math.round(campaigns.reduce((sum, c) => sum + c.aiScore, 0) / campaigns.length),
    avgOpenRate: 65.4,
    avgClickRate: 21.3,
    totalRevenue: 458920,
    aiOptimizedCount: campaigns.filter(c => c.aiOptimized).length,
  };

  return (
    <PageShell
      title="AI Campaign Manager"
      titleIcon={
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
          <RocketLaunchIcon className="w-5 h-5 text-primary" />
        </span>
      }
      subtitle="GPT-4 powered email campaign management & optimization"
      breadcrumbs={[{ label: 'MailerSuite', href: '/' }, { label: 'AI Campaigns' }]}
      toolbar={
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-emerald-500/30">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2" />
            <span className="text-emerald-300">GPT-4 Active</span>
          </Badge>
          <Button className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90">
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
          <Button variant="outline" className="border-border hover:border-primary/50">
            <SparklesIcon className="w-4 h-4 mr-2" />
            AI Generate
          </Button>
        </div>
      }
    >
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: RocketLaunchIcon, label: 'Total Campaigns', value: stats.totalCampaigns, subtext: `${stats.activeCampaigns} active`, color: 'blue' },
            { icon: PaperAirplaneIcon, label: 'Emails Sent', value: `${(stats.totalSent/1000).toFixed(1)}k`, subtext: 'this month', color: 'emerald' },
            { icon: ChartBarIcon, label: 'Avg Open Rate', value: `${stats.avgOpenRate}%`, subtext: '+12% vs last month', color: 'purple' },
            { icon: CurrencyDollarIcon, label: 'Revenue Generated', value: `$${(stats.totalRevenue/1000).toFixed(0)}k`, subtext: 'from campaigns', color: 'amber' }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
            >
              <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/50 border-border/50 hover:border-primary/30 transition-all hover:shadow-xl">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20`}>
                      <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* AI Features Grid */}
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/50 border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <SparklesIcon className="w-6 h-6 text-primary" />
                    AI Mailing Superpowers
                  </CardTitle>
                  <Badge className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-purple-500/30">
                    <ServerIcon className="w-3 h-3 mr-1 text-purple-400" />
                    <span className="text-purple-300">ML Models Active</span>
                  </Badge>
                </div>
                <CardDescription className="text-muted-foreground">
                  Advanced AI features powered by GPT-4 and custom ML models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aiFeatures.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02, y: -4 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Card className="h-full bg-background/50 border-border/50 hover:border-primary/30 transition-all group">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl bg-gradient-to-br from-${feature.color || 'primary'}-500/20 to-${feature.color || 'primary'}-600/10 border border-${feature.color || 'primary'}-500/30 group-hover:scale-110 transition-transform`}>
                              <feature.icon className={`w-5 h-5 text-${feature.color || 'primary'}-400`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm text-white mb-1">{feature.title}</h3>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{feature.description}</p>
                              <div className="flex items-center justify-between">
                                <Badge variant={feature.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                  {feature.status === 'active' ? 'Live' : 'Beta'}
                                </Badge>
                                <span className="text-xs font-bold text-emerald-400">{feature.metric}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Campaigns List */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-background/50 border-border">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[140px] bg-background/50 border-border">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Campaigns</SelectItem>
                      <SelectItem value="ai">AI Optimized</SelectItem>
                      <SelectItem value="high">High Performance</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="border-border">
                    <MagnifyingGlassIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <TabsContent value="active" className="space-y-4">
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {campaigns.filter(c => c.status === 'active').map((campaign, idx) => (
                      <CampaignCard key={campaign.id} campaign={campaign} index={idx} />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="scheduled" className="space-y-4">
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {campaigns.filter(c => c.status === 'scheduled').map((campaign, idx) => (
                      <CampaignCard key={campaign.id} campaign={campaign} index={idx} />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="drafts" className="space-y-4">
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {campaigns.filter(c => c.status === 'draft').map((campaign, idx) => (
                      <CampaignCard key={campaign.id} campaign={campaign} index={idx} />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Live Monitor */}
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <WifiIcon className="w-4 h-4 text-emerald-400" />
                  Live Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <PageConsole
                  title=""
                  source="campaigns"
                  height="xs"
                  logCategories={['SEND', 'OPEN', 'CLICK']}
                  showSearch={false}
                  showControls={false}
                  autoConnect={true}
                  className="border-0 bg-transparent p-0 text-xs"
                />
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card className="bg-gradient-to-br from-violet-900/20 to-purple-900/20 border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-purple-400" />
                  AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert className="bg-purple-500/10 border-purple-500/30">
                  <LightBulbIcon className="w-4 h-4 text-purple-400" />
                  <AlertDescription className="text-xs text-purple-300">
                    Tuesday 10 AM shows 23% higher open rates
                  </AlertDescription>
                </Alert>
                
                <Button className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600">
                  <CommandLineIcon className="w-4 h-4 mr-2" />
                  Ask AI
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </PageShell>
  );
};
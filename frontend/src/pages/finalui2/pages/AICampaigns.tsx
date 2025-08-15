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
  AdjustmentsHorizontalIcon,
  ClockIcon,
  FireIcon,
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon,
  DocumentDuplicateIcon,
  WifiIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  EyeIcon,
  UserGroupIcon,
  PlusIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { EnvelopeIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SoonBadge from '@/components/ui/SoonBadge';

// Campaign Card Component
const CampaignCard: React.FC<{ campaign: any; index: number }> = ({ campaign, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.1 * index }}
  >
    <Card className="hover:shadow-md transition-all duration-200 hover:scale-[1.01]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{campaign.name}</h3>
              {campaign.aiOptimized && (
                <Badge variant="outline" className="text-primary border-primary/30">
                  <SparklesIcon className="w-3 h-3 mr-1" />
                  AI Optimized
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Created {campaign.createdAt}</span>
              <Separator orientation="vertical" className="h-4" />
              <Badge variant={
                campaign.status === 'active' ? 'default' :
                campaign.status === 'scheduled' ? 'secondary' :
                campaign.status === 'completed' ? 'outline' : 'secondary'
              }>
                {campaign.status}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              AI Score: {campaign.aiScore}
            </Badge>
            <Progress value={campaign.aiScore} className="w-12 h-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-sm text-muted-foreground">Recipients</div>
            <div className="text-lg font-semibold">{campaign.recipients.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Sent</div>
            <div className="text-lg font-semibold">{campaign.sent > 0 ? campaign.sent.toLocaleString() : '-'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Opens</div>
            <div className="text-lg font-semibold flex items-center gap-2">
              {campaign.opens > 0 ? campaign.opens.toLocaleString() : '-'}
              {campaign.openRate > 0 && (
                <span className="text-xs text-muted-foreground">({campaign.openRate}%)</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Clicks</div>
            <div className="text-lg font-semibold flex items-center gap-2">
              {campaign.clicks > 0 ? campaign.clicks.toLocaleString() : '-'}
              {campaign.clickRate > 0 && (
                <span className="text-xs text-muted-foreground">({campaign.clickRate}%)</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
              <span className="text-muted-foreground">ROI: {campaign.predictedROI}</span>
            </div>
            <div className="flex items-center gap-2">
              <LightBulbIcon className="w-4 h-4 text-amber-500" />
              <span className="text-muted-foreground">{campaign.nextBestAction}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <EyeIcon className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button size="sm" variant="outline">
              <DocumentDuplicateIcon className="w-4 h-4 mr-1" />
              Clone
            </Button>
            <Button size="sm">
              <Cog6ToothIcon className="w-4 h-4 mr-1" />
              Configure
            </Button>
          </div>
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
      description: 'AI predicts optimal sending time for each recipient',
      status: 'active',
      metric: '+42% open rate'
    },
    {
      icon: LightBulbIcon,
      title: 'Subject Line Optimizer',
      description: 'Generate and test multiple subject lines with AI',
      status: 'beta',
      metric: '87% success rate'
    },
    {
      icon: CpuChipIcon,
      title: 'Content Personalization',
      description: 'Dynamic content based on user behavior and preferences',
      status: 'active',
      metric: '3x engagement'
    },
    {
      icon: FireIcon,
      title: 'Spam Score Predictor',
      description: 'Real-time spam detection and content optimization',
      status: 'active',
      metric: '99.8% delivery'
    }
  ];

  const campaigns = [
    {
      id: 1,
      name: 'Black Friday Mega Sale',
      status: 'active',
      aiScore: 95,
      recipients: 25400,
      sent: 12300,
      opens: 8700,
      clicks: 3200,
      aiOptimized: true,
      predictedROI: '+320%',
      nextBestAction: 'Send follow-up to non-openers',
      openRate: 70.7,
      clickRate: 26.0,
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
      nextBestAction: 'A/B test subject lines',
      openRate: 0,
      clickRate: 0,
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
      nextBestAction: 'Enable AI optimization',
      openRate: 0,
      clickRate: 0,
      createdAt: '2024-01-22'
    },
    {
      id: 4,
      name: 'Holiday Newsletter',
      status: 'completed',
      aiScore: 91,
      recipients: 15600,
      sent: 15600,
      opens: 9800,
      clicks: 2400,
      aiOptimized: true,
      predictedROI: '+210%',
      nextBestAction: 'Create similar campaigns',
      openRate: 62.8,
      clickRate: 15.4,
      createdAt: '2024-01-10'
    }
  ];

  const campaignStats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalSent: campaigns.reduce((sum, c) => sum + c.sent, 0),
    avgAIScore: Math.round(campaigns.reduce((sum, c) => sum + c.aiScore, 0) / campaigns.length),
    aiOptimizedCount: campaigns.filter(c => c.aiOptimized).length,
  };

  return (
    <PageShell
      title="AI Campaign Manager"
      titleIcon={
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/30">
          <RocketLaunchIcon className="w-4 h-4 text-primary" />
        </span>
      }
      subtitle="AI-powered email campaign management and optimization"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'AI Campaigns' }]}
      toolbar={
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-emerald-600">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2" />
            GPT-4 Active
          </Badge>
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
          <Button variant="outline">
            <SparklesIcon className="w-4 h-4 mr-2" />
            AI Generate
          </Button>
        </div>
      }
    >
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
      >

        {/* Campaign Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RocketLaunchIcon className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-muted-foreground">Total Campaigns</span>
                  </div>
                  <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{campaignStats.totalCampaigns}</div>
                  <div className="text-xs text-muted-foreground">{campaignStats.activeCampaigns} active</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-muted-foreground">Total Sent</span>
                  </div>
                  <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{campaignStats.totalSent.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">emails delivered</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-muted-foreground">Avg AI Score</span>
                  </div>
                  <Badge variant="outline">{campaignStats.avgAIScore}</Badge>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{campaignStats.avgAIScore}%</div>
                  <Progress value={campaignStats.avgAIScore} className="mt-2 h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BoltIcon className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-muted-foreground">AI Optimized</span>
                  </div>
                  <Badge variant="outline" className="text-amber-600">{campaignStats.aiOptimizedCount}</Badge>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{campaignStats.aiOptimizedCount}</div>
                  <div className="text-xs text-muted-foreground">of {campaignStats.totalCampaigns} campaigns</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            {/* AI Features */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <SparklesIcon className="w-5 h-5 text-primary" />
                      AI Mailing Superpowers
                    </CardTitle>
                    <Badge variant="outline" className="text-emerald-600">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2" />
                      GPT-4 Active
                    </Badge>
                  </div>
                  <CardDescription>Advanced AI features to optimize your email campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiFeatures.map((feature, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <Card className="h-full hover:shadow-sm transition-shadow border-l-2 border-l-transparent hover:border-l-primary">
                          <CardContent className="p-2.5">
                            <div className="flex gap-2">
                              <div className="flex-shrink-0">
                                <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center">
                                  <feature.icon className="icon-sm text-primary" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-xs mb-0.5">{feature.title}</h3>
                                <p className="text-xs text-muted-foreground mb-1.5 line-clamp-1">{feature.description}</p>
                                <div className="flex justify-between items-center">
                                  <Badge 
                                    variant={feature.status === 'active' ? 'default' : 'secondary'} 
                                    className="badge-compact"
                                  >
                                    {feature.status}
                                  </Badge>
                                  <span className="text-xs font-medium text-primary">{feature.metric}</span>
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
            </motion.div>

            {/* Campaigns Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="grid w-full grid-cols-4 lg:w-auto h-8">
                    <TabsTrigger value="active" className="text-xs py-1">Active</TabsTrigger>
                    <TabsTrigger value="scheduled" className="text-xs py-1">Scheduled</TabsTrigger>
                    <TabsTrigger value="drafts" className="text-xs py-1">Drafts</TabsTrigger>
                    <TabsTrigger value="completed" className="text-xs py-1 flex items-center">
                      <SparklesIcon className="icon-xs mr-0.5" />
                      Completed
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">All</SelectItem>
                        <SelectItem value="ai-optimized" className="text-xs">AI Optimized</SelectItem>
                        <SelectItem value="high-score" className="text-xs">High Score</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <TabsContent value="active" className="space-y-2">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {campaigns
                        .filter(c => c.status === 'active')
                        .map((campaign, idx) => (
                        <CampaignCard key={campaign.id} campaign={campaign} index={idx} />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="scheduled" className="space-y-4">
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {campaigns
                        .filter(c => c.status === 'scheduled')
                        .map((campaign, idx) => (
                        <CampaignCard key={campaign.id} campaign={campaign} index={idx} />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="drafts" className="space-y-4">
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {campaigns
                        .filter(c => c.status === 'draft')
                        .map((campaign, idx) => (
                        <CampaignCard key={campaign.id} campaign={campaign} index={idx} />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {campaigns
                        .filter(c => c.status === 'completed')
                        .map((campaign, idx) => (
                        <CampaignCard key={campaign.id} campaign={campaign} index={idx} />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Sidebar - 1 column */}
          <motion.div
            className="lg:col-span-1 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Campaign Monitor */}
            <Card className="card-compact">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <WifiIcon className="icon-sm text-emerald-500" />
                  Live Monitor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <PageConsole
                  title=""
                  source="campaigns"
                  height="xs"
                  logCategories={['LAUNCH', 'METRICS', 'CLICK']}
                  showSearch={false}
                  showControls={false}
                  autoConnect={true}
                  className="border-0 bg-transparent p-0 text-xs"
                />
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-primary" />
                  AI Campaign Assistant
                </CardTitle>
                <CardDescription>Get AI-powered campaign insights and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <LightBulbIcon className="w-4 h-4" />
                  <AlertDescription className="text-sm">
                    <strong>Optimization Tip:</strong> Tuesday 10 AM shows 23% higher open rates for your audience
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                  <AlertDescription className="text-sm">
                    <strong>Growth Opportunity:</strong> A/B test emoji subject lines for 15% better engagement
                  </AlertDescription>
                </Alert>
                
                <Separator />
                
                <Button className="w-full">
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Ask AI Assistant
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create New Campaign
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                  Clone Best Performing
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <ChartBarIcon className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  AI Optimize All
                </Button>
              </CardContent>
            </Card>

            {/* Campaign Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Templates</CardTitle>
                <CardDescription>Ready-to-use campaign templates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  <div className="font-medium text-sm">Product Launch</div>
                  <div className="text-xs text-muted-foreground">AI Score: 92%</div>
                </div>
                <div className="p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  <div className="font-medium text-sm">Re-engagement</div>
                  <div className="text-xs text-muted-foreground">AI Score: 87%</div>
                </div>
                <div className="p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  <div className="font-medium text-sm">Newsletter</div>
                  <div className="text-xs text-muted-foreground">AI Score: 84%</div>
                </div>
                <Button size="sm" variant="outline" className="w-full mt-3">
                  <SoonBadge className="mr-2" />
                  Browse All Templates
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

      </motion.div>
    </PageShell>
  );
};
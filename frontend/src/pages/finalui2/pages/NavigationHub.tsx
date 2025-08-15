import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageShell from '../components/PageShell';
import { useNavigate } from 'react-router-dom';
import { ResponsiveGrid, SectionHeader, FeatureCard } from '@/components/ui/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateHubData } from '@/services/mockData';
import {
  HomeIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  SparklesIcon,
  BeakerIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  InboxIcon,
  CommandLineIcon,
  ShieldCheckIcon,
  ServerStackIcon,
  GlobeAltIcon,
  BoltIcon,
  CpuChipIcon,
  ArrowRightIcon,
  FireIcon,
  LightBulbIcon,
  ClockIcon,
  EyeIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  WifiIcon,
  SignalIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  PlayIcon,
  LockClosedIcon,
  UserPlusIcon,
  KeyIcon,
  NoSymbolIcon,
  PauseCircleIcon
} from '@heroicons/react/24/outline';

const NavigationHub: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ai' | 'core' | 'tools'>('all');
  const [liveMetrics, setLiveMetrics] = useState({
    activeCampaigns: 12,
    totalContacts: 2847,
    openRate: 24.8,
    systemHealth: 99.9
  });
  const [showSystemStatus, setShowSystemStatus] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingCampaigns, setUpcomingCampaigns] = useState<any[]>([]);

  // Initialize with loading state and mock data
  useEffect(() => {
    const mockData = generateHubData();
    setLiveMetrics({
      activeCampaigns: mockData.quickStats.activeCampaigns,
      totalContacts: mockData.quickStats.todaySent + mockData.quickStats.todayOpened,
      openRate: (mockData.quickStats.todayOpened / mockData.quickStats.todaySent) * 100,
      systemHealth: 99.9
    });
    setRecentActivity(mockData.recentActivity.slice(0, 5));
    setUpcomingCampaigns(mockData.upcomingCampaigns);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Simulate live updates for metrics with more realistic variations
  useEffect(() => {
    const interval = setInterval(() => {
      const mockData = generateHubData();
      setLiveMetrics(prev => ({
        activeCampaigns: mockData.quickStats.activeCampaigns,
        totalContacts: prev.totalContacts + Math.floor(Math.random() * 20 - 10),
        openRate: Math.max(20, Math.min(30, prev.openRate + (Math.random() * 2 - 1))),
        systemHealth: Math.max(98, Math.min(100, prev.systemHealth + (Math.random() * 0.2 - 0.1)))
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Enhanced stats with live data and better contrast
  const quickStats = [
    {
      title: 'Active Campaigns',
      value: liveMetrics.activeCampaigns.toString(),
      change: { value: 15, type: 'increase' as const },
      icon: <RocketLaunchIcon className="w-5 h-5" />,
      description: 'Currently running',
      color: 'from-blue-600 to-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/30',
      textColor: 'text-blue-300'
    },
    {
      title: 'Total Contacts',
      value: liveMetrics.totalContacts.toLocaleString(),
      change: { value: 8, type: 'increase' as const },
      icon: <UserGroupIcon className="w-5 h-5" />,
      description: 'In your database',
      color: 'from-blue-600 to-blue-500',
      bgColor: 'bg-white border-blue-200 shadow-md',
      textColor: 'text-blue-600'
    },
    {
      title: 'Open Rate',
      value: `${liveMetrics.openRate.toFixed(1)}%`,
      change: { value: 3, type: 'increase' as const },
      icon: <EyeIcon className="w-5 h-5" />,
      description: 'Last 30 days',
      color: 'from-indigo-600 to-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/30',
      textColor: 'text-indigo-300'
    },
    {
      title: 'System Health',
      value: `${liveMetrics.systemHealth.toFixed(1)}%`,
      change: { value: 0, type: 'neutral' as const },
      icon: <ShieldCheckIcon className="w-5 h-5" />,
      description: 'Uptime status',
      color: 'from-emerald-600 to-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30',
      textColor: 'text-emerald-300'
    }
  ];

  // System status data for enhanced monitoring
  const systemStatus = [
    { service: 'API Gateway', status: 'operational', latency: '42ms', color: 'text-emerald-400' },
    { service: 'Email Engine', status: 'operational', latency: '1.2s', color: 'text-emerald-400' },
    { service: 'AI Processing', status: 'operational', latency: '312ms', color: 'text-emerald-400' },
    { service: 'Database', status: 'operational', latency: '15ms', color: 'text-emerald-400' },
    { service: 'CDN', status: 'degraded', latency: '156ms', color: 'text-yellow-400' },
    { service: 'WebSocket', status: 'operational', latency: '8ms', color: 'text-emerald-400' }
  ];

  // Categorized features for better organization
  const featureCategories: Array<{ id: 'all' | 'ai' | 'core' | 'tools'; name: string; icon: React.ReactNode; color: string }> = [
    {
      id: 'all',
      name: 'All Features',
      icon: <CpuChipIcon className="w-4 h-4" />,
      color: 'text-blue-600'
    },
    {
      id: 'ai',
      name: 'AI Powered',
      icon: <SparklesIcon className="w-4 h-4" />,
      color: 'text-blue-400'
    },
    {
      id: 'core',
      name: 'Core Platform',
      icon: <RocketLaunchIcon className="w-4 h-4" />,
      color: 'text-indigo-400'
    },
    {
      id: 'tools',
      name: 'Live Tools',
      icon: <BoltIcon className="w-4 h-4" />,
      color: 'text-emerald-400'
    }
  ];

  // Enhanced platform features with categories and better contrast
  const coreFeatures = [
    {
      id: 'dashboard',
      title: 'Enhanced Dashboard',
      description: 'Real-time analytics and campaign insights with AI-powered recommendations',
      icon: <ChartBarIcon className="w-6 h-6" />,
      badge: 'Enhanced',
      badgeVariant: 'default' as const,
      category: 'core',
      color: 'from-blue-600 to-blue-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-blue-500/50',
      action: {
        label: 'Open Dashboard',
        onClick: () => navigate('/dashboard')
      }
    },
    {
      id: 'ai-campaigns',
      title: 'AI Campaign Builder',
      description: 'Create high-converting email campaigns with intelligent optimization',
      icon: <RocketLaunchIcon className="w-6 h-6" />,
      badge: 'AI Powered',
      badgeVariant: 'default' as const,
      category: 'ai',
      color: 'from-indigo-600 to-indigo-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-indigo-500/50',
      action: {
        label: 'Create Campaign',
        onClick: () => navigate('/campaigns')
      }
    },
    {
      id: 'templates',
      title: 'Template Designer',
      description: 'Visual drag-and-drop email template builder with responsive design',
      icon: <DocumentTextIcon className="w-6 h-6" />,
      badge: 'Visual',
      badgeVariant: 'default' as const,
      category: 'core',
      color: 'from-slate-600 to-slate-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-border/50',
      action: {
        label: 'Design Templates',
        onClick: () => navigate('/templates')
      }
    },
    {
      id: 'contacts',
      title: 'Audience Manager',
      description: 'Segment and organize your contacts with advanced filtering',
      icon: <UserGroupIcon className="w-6 h-6" />,
      category: 'core',
      color: 'from-slate-600 to-slate-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-border/50',
      action: {
        label: 'Manage Contacts',
        onClick: () => navigate('/contacts')
      }
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      description: 'Get intelligent suggestions for optimizing your email marketing',
      icon: <SparklesIcon className="w-6 h-6" />,
      badge: 'Premium',
      badgeVariant: 'default' as const,
      category: 'ai',
      variant: 'premium' as const,
      color: 'from-blue-600 to-blue-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-blue-500/50',
      action: {
        label: 'Open Assistant',
        onClick: () => navigate('/assistant')
      }
    },
    {
      id: 'analytics',
      title: 'Analytics Hub',
      description: 'Comprehensive reporting and performance tracking',
      icon: <ChartBarIcon className="w-6 h-6" />,
      category: 'core',
      color: 'from-indigo-600 to-indigo-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-indigo-500/50',
      action: {
        label: 'View Analytics',
        onClick: () => navigate('/analytics')
      }
    }
  ];

  // Enhanced live tools with better contrast and interactivity
  const liveTools = [
    {
      id: 'smtp-checker',
      title: 'SMTP Checker',
      description: 'Test and validate your email server configuration in real-time',
      icon: <EnvelopeIcon className="w-6 h-6" />,
      badge: 'Live',
      badgeVariant: 'default' as const,
      category: 'tools',
      color: 'from-emerald-600 to-emerald-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-emerald-500/50',
      status: 'operational',
      action: {
        label: 'Test SMTP',
        onClick: () => navigate('/smtp-checker')
      }
    },
    {
      id: 'imap-monitor',
      title: 'Inbox Monitor',
      description: 'Monitor email delivery and inbox placement rates',
      icon: <InboxIcon className="w-6 h-6" />,
      badge: 'Live',
      badgeVariant: 'default' as const,
      category: 'tools',
      color: 'from-blue-600 to-blue-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-blue-500/50',
      status: 'operational',
      action: {
        label: 'Monitor Inbox',
        onClick: () => navigate('/imap-inbox')
      }
    },
    {
      id: 'live-console',
      title: 'Live Console',
      description: 'Real-time system logs and performance monitoring',
      icon: <CommandLineIcon className="w-6 h-6" />,
      badge: 'Live',
      badgeVariant: 'default' as const,
      category: 'tools',
      color: 'from-slate-600 to-slate-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-border/50',
      status: 'operational',
      action: {
        label: 'Open Console',
        onClick: () => navigate('/live-console')
      }
    },
    {
      id: 'blacklist-guard',
      title: 'Blacklist Guard',
      description: 'Check sender reputation across major email providers',
      icon: <ShieldCheckIcon className="w-6 h-6" />,
      badge: 'Pro',
      badgeVariant: 'default' as const,
      category: 'tools',
      color: 'from-yellow-600 to-yellow-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-yellow-500/50',
      status: 'operational',
      action: {
        label: 'Check Status',
        onClick: () => navigate('/blacklist-status')
      }
    },
    {
      id: 'domain-manager',
      title: 'Domain Manager',
      description: 'Configure and manage your sending domains and DNS settings',
      icon: <GlobeAltIcon className="w-6 h-6" />,
      category: 'tools',
      color: 'from-indigo-600 to-indigo-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-indigo-500/50',
      status: 'operational',
      action: {
        label: 'Manage Domains',
        onClick: () => navigate('/domains')
      }
    },
    {
      id: 'performance-lab',
      title: 'Performance Lab',
      description: 'Test and optimize your email infrastructure performance',
      icon: <BoltIcon className="w-6 h-6" />,
      badge: 'Beta',
      badgeVariant: 'default' as const,
      category: 'tools',
      color: 'from-blue-600 to-blue-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-blue-500/50',
      status: 'beta',
      action: {
        label: 'Run Tests',
        onClick: () => navigate('/performance')
      }
    }
    ,
    {
      id: 'mailing-dashboard',
      title: 'Mailing Dashboard',
      description: 'Configure threads, timeouts and runtime controls',
      icon: <BoltIcon className="w-6 h-6" />,
      badge: 'Live',
      badgeVariant: 'default' as const,
      category: 'tools',
      color: 'from-blue-600 to-blue-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-blue-500/50',
      status: 'operational',
      action: {
        label: 'Open',
        onClick: () => navigate('/mailing-dashboard')
      }
    }
  ];

  // Authentication links for quick access from Hub
  const authFeatures = [
    {
      id: 'auth-login',
      title: 'Login',
      description: 'Access your account and dashboard',
      icon: <LockClosedIcon className="w-6 h-6" />,
      category: 'auth',
      color: 'from-blue-600 to-blue-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-blue-500/50',
      action: {
        label: 'Open Login',
        onClick: () => navigate('/auth/login')
      }
    },
    {
      id: 'auth-signup',
      title: 'Sign Up',
      description: 'Create a new account to get started',
      icon: <UserPlusIcon className="w-6 h-6" />,
      category: 'auth',
      color: 'from-indigo-600 to-indigo-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-indigo-500/50',
      action: {
        label: 'Create Account',
        onClick: () => navigate('/auth/sign-up')
      }
    },
    {
      id: 'auth-forgot',
      title: 'Forgot Password',
      description: 'Recover access to your account',
      icon: <KeyIcon className="w-6 h-6" />,
      category: 'auth',
      color: 'from-slate-600 to-slate-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-border/50',
      action: {
        label: 'Recover',
        onClick: () => navigate('/auth/forgot')
      }
    },
    {
      id: 'auth-2fa',
      title: 'Verify 2FA',
      description: 'Two-factor authentication verification',
      icon: <ShieldCheckIcon className="w-6 h-6" />,
      category: 'auth',
      color: 'from-emerald-600 to-emerald-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-emerald-500/50',
      action: {
        label: 'Verify',
        onClick: () => navigate('/auth/verify-2fa')
      }
    },
    {
      id: 'auth-banned',
      title: 'Account Banned',
      description: 'Information for banned accounts',
      icon: <NoSymbolIcon className="w-6 h-6" />,
      category: 'auth',
      color: 'from-red-600 to-red-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-red-500/50',
      action: {
        label: 'View Details',
        onClick: () => navigate('/auth/banned')
      }
    },
    {
      id: 'auth-suspended',
      title: 'Account Suspended',
      description: 'Information for suspended accounts',
      icon: <PauseCircleIcon className="w-6 h-6" />,
      category: 'auth',
      color: 'from-yellow-600 to-yellow-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-yellow-500/50',
      action: {
        label: 'View Details',
        onClick: () => navigate('/auth/suspended')
      }
    },
    {
      id: 'auth-warning',
      title: 'Account Warning',
      description: 'Important account notifications',
      icon: <ExclamationTriangleIcon className="w-6 h-6" />,
      category: 'auth',
      color: 'from-amber-600 to-amber-400',
      bgColor: 'bg-background/50 border-border/50 hover:border-amber-500/50',
      action: {
        label: 'View Warning',
        onClick: () => navigate('/auth/warning')
      }
    }
  ];

  // Filter features based on selected category
  const filterByCategory = <T extends { category?: string }>(items: T[]) => {
    if (selectedCategory === 'all') return items;
    return items.filter(item => item.category === selectedCategory);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <div className="absolute inset-0">
          <div className="absolute w-64 h-64 rounded-full blur-3xl bg-primary/5 top-1/4 left-1/4 motion-reduce:animate-none" />
          <div className="absolute w-48 h-48 rounded-full blur-3xl bg-primary/5 bottom-1/4 right-1/4 motion-reduce:animate-none" />
        </div>
        <motion.div
          className="relative z-10 max-w-6xl mx-auto text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="border border-muted/20 bg-card/50 backdrop-blur-sm shadow-xl rounded-xl">
            <div className="p-4 space-y-6">
              <div className="space-y-4">
                <Skeleton className="w-16 h-16 rounded-full mx-auto bg-card" aria-label="Loading avatar" />
                <Skeleton className="h-8 w-96 mx-auto bg-card" aria-label="Loading title" />
                <Skeleton className="h-4 w-64 mx-auto bg-card" aria-label="Loading description" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border border-muted/20 bg-card/50 backdrop-blur-sm shadow-xl rounded-xl p-4">
                    <Skeleton className="h-4 w-full mb-2 bg-card" aria-label="Loading row" />
                    <Skeleton className="h-8 w-16 mb-1 bg-card" aria-label="Loading button" />
                    <Skeleton className="h-3 w-full bg-card" aria-label="Loading text" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <PageShell
        title="Navigation Hub"
        titleIcon={
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/30">
            <CpuChipIcon className="w-4 h-4 text-primary neon-glow" />
          </span>
        }
        subtitle="Explore core features and live tools"
      >
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
        >
          {/* Enhanced Header with System Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative inline-block mb-6"
            >
              <div className="text-4xl md:text-5xl font-bold text-foreground/40 select-none">
                SPAMGPT HUB
              </div>
              <motion.div
                className="absolute inset-0 text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-300 to-blue-300 bg-clip-text text-transparent"
                animate={{ opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                SPAMGPT HUB
              </motion.div>
            </motion.div>

            <div className="flex items-center justify-center gap-4 mb-6">
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                <WifiIcon className="w-3 h-3 mr-1 animate-pulse" />
                Live System
              </Badge>
              <Dialog open={showSystemStatus} onOpenChange={setShowSystemStatus}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-muted-foreground">
                    <SignalIcon className="w-4 h-4 mr-1" />
                    System Status
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background/95 border-border/50">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">System Status Monitor</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Real-time status of all platform services
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    {systemStatus.map((service, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${service.status === 'operational' ? 'bg-emerald-400 animate-pulse' :
                            service.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                            }`} />
                          <span className="text-foreground font-medium">{service.service}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{service.latency}</span>
                          <span className={`text-xs ${service.color} font-medium`}>
                            {service.status === 'operational' ? '99.9%' :
                              service.status === 'degraded' ? '95.0%' : 'Down'}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* Enhanced Main Content with Tabs */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-background/60 border-border/50 backdrop-blur-xl shadow-2xl">
              <CardContent className="p-4 space-y-8">
                {/* Category Tabs */}
                <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)} className="w-full">
                  <TabsList aria-label="Feature categories" className="mx-auto">
                    {featureCategories.map((cat) => (
                      <TabsTrigger key={cat.id} value={cat.id} className="px-4">
                        <span className={cat.color + ' mr-2'} aria-hidden>
                          {cat.icon}
                        </span>
                        {cat.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                {/* Enhanced Icon and Title with Live Data */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="text-center space-y-6"
                >
                  <div className="relative inline-block">
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, -2, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 border border-border/50 text-muted-foreground"
                    >
                      <CpuChipIcon className="w-10 h-10" />
                    </motion.div>
                    <motion.div
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </motion.div>
                  </div>

                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                      AI Marketing Command Center
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                      Professional email marketing suite with AI-powered insights, real-time analytics, and comprehensive campaign management
                    </p>
                  </div>
                </motion.div>

                {/* Enhanced Quick Stats with Better Contrast */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-foreground mb-2">Platform Overview</h2>
                    <p className="text-muted-foreground">Real-time metrics and system status</p>
                  </div>

                  <div className="premium-grid-auto max-w-4xl">
                    {quickStats.map((stat, index) => (
                      <Tooltip key={stat.title}>
                        <TooltipTrigger asChild>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="cursor-pointer"
                          >
                            <Card variant="premium" className="group">
                              <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} text-white group-hover:scale-110 transition-transform`}>
                                    {stat.icon}
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${stat.change.type === 'increase' ? 'border-emerald-500/30 text-emerald-400' :
                                      stat.change.type === 'decrease' ? 'border-red-500/30 text-red-400' :
                                        'border-border/30 text-muted-foreground'
                                      }`}
                                  >
                                    {stat.change.type === 'increase' ? <ArrowTrendingUpIcon className="w-3 h-3 mr-1" /> :
                                      stat.change.type === 'decrease' ? <ArrowTrendingDownIcon className="w-3 h-3 mr-1" /> : null}
                                    {Math.abs(stat.change.value)}%
                                  </Badge>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold text-foreground group-hover:text-foreground transition-colors">
                                    {stat.value}
                                  </div>
                                  <div className="text-sm font-semibold text-foreground group-hover:text-muted-foreground transition-colors">
                                    {stat.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {stat.description}
                                  </div>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <motion.div
                                    className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
                                    initial={{ width: 0 }}
                                    animate={{ width: '75%' }}
                                    transition={{ delay: index * 0.2, duration: 1 }}
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-card border-border">
                          <p className="text-foreground">{stat.description}</p>
                          <p className="text-xs text-muted-foreground">Updated in real-time</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </motion.div>

                {/* Core Platform Features */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="space-y-4"
                >
                  <SectionHeader
                    title="Core Platform"
                    description="Essential tools for professional email marketing"
                  />
                  <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3, xl: 3 }}>
                    {filterByCategory(coreFeatures).map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        <div className="border border-muted/20 bg-card/50 backdrop-blur-sm shadow-xl rounded-xl h-full">
                          <FeatureCard {...feature} />
                        </div>
                      </motion.div>
                    ))}
                  </ResponsiveGrid>
                </motion.div>

                {/* Live Tools Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className="space-y-4"
                >
                  <SectionHeader
                    title="Live Tools"
                    description="Real-time monitoring and testing utilities"
                  />
                  <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3, xl: 3 }}>
                    {filterByCategory(liveTools).map((tool, index) => (
                      <motion.div
                        key={tool.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        <div className="border border-muted/20 bg-card/50 backdrop-blur-sm shadow-xl rounded-xl h-full">
                          <FeatureCard {...tool} />
                        </div>
                      </motion.div>
                    ))}
                  </ResponsiveGrid>
                </motion.div>

                {/* Authentication Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.65 }}
                  className="space-y-4"
                >
                  <SectionHeader
                    title="Authentication"
                    description="Access login, registration and account status pages"
                  />
                  <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3, xl: 3 }}>
                    {authFeatures.map((auth, index) => (
                      <motion.div
                        key={auth.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        <div className="border border-muted/20 bg-card/50 backdrop-blur-sm shadow-xl rounded-xl h-full">
                          <FeatureCard {...auth} />
                        </div>
                      </motion.div>
                    ))}
                  </ResponsiveGrid>
                </motion.div>

                {/* Quick Actions - Auth Style Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                  className="flex flex-wrap gap-4 justify-center pt-6"
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => navigate('/campaigns')}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 gap-2"
                      size="lg"
                    >
                      <RocketLaunchIcon className="w-5 h-5" />
                      Create Campaign
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/templates')}
                      className="px-4 py-3 gap-2"
                    >
                      <DocumentTextIcon className="w-5 h-5" />
                      Design Template
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/live-console')}
                      className="px-4 py-3 gap-2"
                    >
                      <CommandLineIcon className="w-5 h-5" />
                      Live Console
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Help Text - Auth Style */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.8 }}
                  className="pt-6 border-t border-muted/20"
                >
                  <p className="text-sm text-muted-foreground">
                    Experience powerful email marketing tools with{' '}
                    <button
                      onClick={() => navigate('/assistant')}
                      className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                    >
                      AI-powered insights
                    </button>
                    {' '}and real-time analytics.
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Decorative Elements - Auth Style */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-8 flex justify-center space-x-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-primary/40 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </PageShell>
    </TooltipProvider>
  );
};

export default NavigationHub;
/**
 * Client UI Kit Examples
 * Comprehensive implementation examples for all ClientUIKit components
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Target, 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp,
  Plus,
  Settings,
  Download,
  RefreshCw,
  Calendar,
  Globe,
  Zap,
  Activity,
  Clock
} from 'lucide-react';

// Import ClientUIKit components
import {
  ClientPageHeader,
  ClientMetricCard,
  ClientStatus,
  ClientGrid,
  ClientSection,
  ClientQuickStats,

  clientAnimations
} from './ClientUIKit';

// Import Enhanced components
import {
  RealTimeCampaignCard,
  AnalyticsOverviewCard,
  ClientQuickActions,
  ClientNotificationCenter,
  ClientPerformanceMonitor
} from './EnhancedClientComponents';

// ==================== MAIN EXAMPLES COMPONENT ====================

export const ClientUIKitExamples: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<'red' | 'blue' | 'green' | 'purple' | 'black'>('red');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className={`client-theme-${currentTheme}`}>
      <motion.div
        variants={clientAnimations.pageContainer}
        initial="initial"
        animate="animate"
        className="p-6 space-y-8 bg-background min-h-screen"
      >
        {/* Theme Selector */}
        <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
          <span className="text-sm font-medium">Theme:</span>
          <div className="flex gap-2">
            {['red', 'blue', 'green', 'purple', 'black'].map((theme) => (
              <Button
                key={theme}
                size="sm"
                variant={currentTheme === theme ? "primary" : "outline"}
                onClick={() => setCurrentTheme(theme as any)}
                className="capitalize"
              >
                {theme}
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Components</TabsTrigger>
            <TabsTrigger value="enhanced">Enhanced Components</TabsTrigger>
            <TabsTrigger value="layouts">Layouts</TabsTrigger>
            <TabsTrigger value="dashboard">Full Dashboard</TabsTrigger>
          </TabsList>

          {/* BASIC COMPONENTS */}
          <TabsContent value="basic" className="space-y-8">
            <BasicComponentsExamples isLoading={isLoading} setIsLoading={setIsLoading} />
          </TabsContent>

          {/* ENHANCED COMPONENTS */}
          <TabsContent value="enhanced" className="space-y-8">
            <EnhancedComponentsExamples />
          </TabsContent>

          {/* LAYOUTS */}
          <TabsContent value="layouts" className="space-y-8">
            <LayoutExamples />
          </TabsContent>

          {/* FULL DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-8">
            <FullDashboardExample />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

// ==================== BASIC COMPONENTS EXAMPLES ====================

const BasicComponentsExamples: React.FC<{ isLoading: boolean; setIsLoading: (loading: boolean) => void }> = ({ 
  isLoading, 
  setIsLoading 
}) => (
  <div className="space-y-8">
    {/* Page Header Examples */}
    <ClientSection
      title="Page Headers"
      description="Professional page headers with breadcrumbs and actions"
    >
      <div className="space-y-6">
        {/* Basic Header */}
        <ClientPageHeader
          title="Dashboard Overview"
          description="Monitor your email marketing performance with real-time analytics and insights"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
          }
        />

        {/* Header with Badge and Breadcrumbs */}
        <ClientPageHeader
          title="Campaign Analytics"
          description="Detailed performance metrics for your email campaigns"
          badge={{
            text: "LIVE",
            variant: "default",
            pulse: true
          }}
          breadcrumbs={[
            { label: "Dashboard" },
            { label: "Campaigns" },
            { label: "Analytics" }
          ]}
          showBackButton
          onBack={() => console.log('Back clicked')}
        />
      </div>
    </ClientSection>

    {/* Metric Cards Examples */}
    <ClientSection
      title="Metric Cards"
      description="Interactive cards for displaying key performance indicators"
    >
      <ClientGrid columns={3} gap="md">
        <ClientMetricCard
          title="Total Campaigns"
          value="47"
          description="Active email campaigns"
          trend={{
            type: "up",
            value: "+12%",
            period: "this month"
          }}
          icon={<Target className="h-4 w-4" />}
          status="success"
          onClick={() => console.log('Navigate to campaigns')}
        />

        <ClientMetricCard
          title="Subscribers"
          value="24,891"
          description="Total active subscribers"
          trend={{
            type: "up",
            value: "+8.3%",
            period: "vs last month"
          }}
          icon={<Users className="h-4 w-4" />}
          status="info"
          target={{
            current: 24891,
            goal: 30000,
            label: "Growth Target"
          }}
        />

        <ClientMetricCard
          title="Revenue"
          value="$12,450"
          description="This month's earnings"
          trend={{
            type: "down",
            value: "-2.1%",
            period: "vs last month"
          }}
          icon={<DollarSign className="h-4 w-4" />}
          status="warning"
          loading={isLoading}
        />
      </ClientGrid>

      <div className="flex gap-2 mt-4">
        <Button
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 2000);
          }}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Simulate Loading"}
        </Button>
      </div>
    </ClientSection>

    {/* Status Indicators */}
    <ClientSection
      title="Status Indicators"
      description="Visual status indicators with different sizes and pulse animations"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ClientStatus
            status="active"
            label="Campaign Running"
            description="Sending emails to 5,000 subscribers"
            showPulse={true}
            size="md"
          />
          <ClientStatus
            status="pending"
            label="Scheduled Campaign"
            description="Will start in 2 hours"
            showPulse={false}
            size="md"
          />
          <ClientStatus
            status="error"
            label="Delivery Issues"
            description="Some emails failed to send"
            showPulse={true}
            size="md"
          />
        </div>

        {/* Different Sizes */}
        <div className="flex flex-wrap gap-4">
          <ClientStatus status="success" label="Small" size="sm" />
          <ClientStatus status="warning" label="Medium" size="md" />
          <ClientStatus status="error" label="Large" size="lg" />
        </div>
      </div>
    </ClientSection>

    {/* Action Cards */}
    <ClientSection
      title="Action Cards"
      description="Interactive cards for user actions with progress tracking"
    >
      <ClientGrid columns={2} gap="md">
        <ClientMetricCard
          title="Create New Campaign"
          description="Launch a new email marketing campaign with our step-by-step wizard"
          icon={<Plus className="h-6 w-6" />}
          action={{
            label: "Start Campaign",
            onClick: () => console.log('Creating campaign...'),
            variant: "default"
          }}
          secondaryAction={{
            label: "Learn More",
            onClick: () => console.log('Opening documentation...')
          }}
          status="idle"
        />

        <ClientMetricCard
          title="Import Subscribers"
          description="Upload and manage your subscriber lists with advanced segmentation"
          icon={<Users className="h-6 w-6" />}
          action={{
            label: "Import CSV",
            onClick: () => console.log('Opening file dialog...'),
            variant: "outline",
            loading: false
          }}
          status="success"
          progress={85}
        />
      </ClientGrid>
    </ClientSection>

    {/* Quick Stats */}
    <ClientSection
      title="Quick Stats"
      description="Compact statistics display for dashboard overviews"
    >
      <ClientQuickStats
        stats={[
          {
            label: "Active Campaigns",
            value: "8",
            icon: <Target className="h-4 w-4" />,
            color: "primary",
            trend: { type: "up", value: "+2" }
          },
          {
            label: "Total Subscribers",
            value: "24.5K",
            icon: <Users className="h-4 w-4" />,
            color: "success",
            trend: { type: "up", value: "+1.2K" }
          },
          {
            label: "Open Rate",
            value: "23.8%",
            icon: <Mail className="h-4 w-4" />,
            color: "info",
            trend: { type: "down", value: "-1.2%" }
          },
          {
            label: "Revenue",
            value: "$12.4K",
            icon: <DollarSign className="h-4 w-4" />,
            color: "warning",
            trend: { type: "up", value: "+8.3%" }
          }
        ]}
      />
    </ClientSection>
  </div>
);

// ==================== ENHANCED COMPONENTS EXAMPLES ====================

const EnhancedComponentsExamples: React.FC = () => (
  <div className="space-y-8">
    {/* Real-time Campaign Card */}
    <ClientSection
      title="Real-time Campaign Monitoring"
      description="Live campaign tracking with real-time metric updates"
    >
      <ClientGrid columns={1} gap="md">
        <RealTimeCampaignCard
          title="Summer Promotion 2024"
          campaignId="CMP-2024-001"
          status="running"
          metrics={{
            sent: 5420,
            delivered: 5180,
            opened: 1245,
            clicked: 187,
            bounced: 240
          }}
          progress={68}
          estimatedCompletion="2 hours remaining"
          updateInterval={3000}
          onStatusChange={(newStatus) => console.log('Status changed to:', newStatus)}
        />
      </ClientGrid>
    </ClientSection>

    {/* Analytics Overview */}
    <ClientSection
      title="Analytics Overview"
      description="Comprehensive analytics with time range selection and trend analysis"
    >
      <AnalyticsOverviewCard
        title="Performance Metrics"
        timeRange="30d"
        data={[
          {
            current: 12547,
            previous: 10234,
            label: "Total Sent",
            format: "number"
          },
          {
            current: 4567.89,
            previous: 3890.12,
            label: "Revenue",
            format: "currency"
          },
          {
            current: 23.4,
            previous: 19.8,
            label: "Open Rate",
            format: "percentage"
          },
          {
            current: 4.2,
            previous: 3.8,
            label: "Click Rate",
            format: "percentage"
          }
        ]}
        onTimeRangeChange={(range) => console.log('Time range changed to:', range)}
      />
    </ClientSection>

    {/* Quick Actions */}
    <ClientSection
      title="Quick Actions"
      description="Grid of action cards for common user tasks"
    >
      <ClientQuickActions
        actions={[
          {
            title: "Create Campaign",
            description: "Launch a new email marketing campaign",
            icon: <Plus className="h-6 w-6" />,
            onClick: () => console.log('Create campaign'),
            badge: "Popular"
          },
          {
            title: "View Analytics",
            description: "Check your campaign performance",
            icon: <BarChart3 className="h-6 w-6" />,
            onClick: () => console.log('View analytics')
          },
          {
            title: "Manage Lists",
            description: "Organize your subscriber lists",
            icon: <Users className="h-6 w-6" />,
            onClick: () => console.log('Manage lists')
          },
          {
            title: "Account Settings",
            description: "Update your account preferences",
            icon: <Settings className="h-6 w-6" />,
            onClick: () => console.log('Account settings'),
            disabled: false
          }
        ]}
      />
    </ClientSection>

    {/* Performance Monitor */}
    <ClientSection
      title="Performance Monitor"
      description="System performance monitoring with live metrics"
    >
      <ClientPerformanceMonitor
        metrics={{
          emailsSentToday: 12547,
          deliveryRate: 94.2,
          openRate: 23.8,
          clickRate: 4.1,
          activeConnections: 8,
          systemLoad: 34
        }}
        updateInterval={5000}
      />
    </ClientSection>

    {/* Notification Center */}
    <ClientSection
      title="Notification Center"
      description="Real-time notification management with read/unread states"
    >
      <ClientGrid columns={1} gap="md">
        <ClientNotificationCenter
          notifications={[
            {
              id: "notif-001",
              type: "success",
              title: "Campaign Completed",
              message: "Your 'Summer Sale' campaign has finished successfully with 94.2% delivery rate",
              timestamp: new Date(),
              read: false,
              actionLabel: "View Report",
              onAction: () => console.log('View campaign report')
            },
            {
              id: "notif-002",
              type: "warning",
              title: "Low Credit Balance",
              message: "Your account balance is running low. Add credits to continue sending emails.",
              timestamp: new Date(Date.now() - 3600000),
              read: false,
              actionLabel: "Add Credits",
              onAction: () => console.log('Add credits')
            },
            {
              id: "notif-003",
              type: "info",
              title: "New Feature Available",
              message: "Check out our new A/B testing feature for better campaign optimization",
              timestamp: new Date(Date.now() - 7200000),
              read: true,
              actionLabel: "Learn More",
              onAction: () => console.log('Learn about A/B testing')
            },
            {
              id: "notif-004",
              type: "error",
              title: "Delivery Issue",
              message: "Some emails in your campaign failed to deliver due to invalid addresses",
              timestamp: new Date(Date.now() - 10800000),
              read: true,
              actionLabel: "Review",
              onAction: () => console.log('Review failed deliveries')
            }
          ]}
          onMarkAsRead={(id) => console.log('Mark as read:', id)}
          onMarkAllAsRead={() => console.log('Mark all as read')}
        />
      </ClientGrid>
    </ClientSection>
  </div>
);

// ==================== LAYOUT EXAMPLES ====================

const LayoutExamples: React.FC = () => (
  <div className="space-y-8">
    {/* Grid Layouts */}
    <ClientSection
      title="Grid Layouts"
      description="Responsive grid systems with different configurations"
    >
      <div className="space-y-6">
        {/* 2 Column Grid */}
        <div>
          <h4 className="text-sm font-medium mb-3">2 Column Grid</h4>
          <ClientGrid columns={2} gap="md">
            <ClientMetricCard title="Sent" value="1,247" icon={<Mail />} />
            <ClientMetricCard title="Delivered" value="1,189" icon={<Target />} />
          </ClientGrid>
        </div>

        {/* 3 Column Grid */}
        <div>
          <h4 className="text-sm font-medium mb-3">3 Column Grid</h4>
          <ClientGrid columns={3} gap="md">
            <ClientMetricCard title="Sent" value="1,247" icon={<Mail />} />
            <ClientMetricCard title="Delivered" value="1,189" icon={<Target />} />
            <ClientMetricCard title="Opened" value="445" icon={<Activity />} />
          </ClientGrid>
        </div>

        {/* 4 Column Grid */}
        <div>
          <h4 className="text-sm font-medium mb-3">4 Column Grid</h4>
          <ClientGrid columns={4} gap="sm">
            <ClientMetricCard title="Sent" value="1,247" icon={<Mail />} />
            <ClientMetricCard title="Delivered" value="1,189" icon={<Target />} />
            <ClientMetricCard title="Opened" value="445" icon={<Activity />} />
            <ClientMetricCard title="Clicked" value="89" icon={<TrendingUp />} />
          </ClientGrid>
        </div>
      </div>
    </ClientSection>

    {/* Collapsible Sections */}
    <ClientSection
      title="Collapsible Sections"
      description="Sections that can be expanded and collapsed"
    >
      <div className="space-y-4">
        <ClientSection
          title="Campaign Metrics"
          description="Detailed performance metrics for your campaigns"
          collapsible="true"
          defaultExpanded={true}
          actions={
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          }
        >
          <ClientGrid columns={3} gap="md">
            <ClientMetricCard title="Total Sent" value="12,547" />
            <ClientMetricCard title="Delivery Rate" value="94.2%" />
            <ClientMetricCard title="Open Rate" value="23.8%" />
          </ClientGrid>
        </ClientSection>

        <ClientSection
          title="Subscriber Analytics"
          description="Insights about your subscriber base"
          collapsible="true"
          defaultExpanded={false}
        >
          <ClientGrid columns={2} gap="md">
            <ClientMetricCard title="Total Subscribers" value="24,891" />
            <ClientMetricCard title="Growth Rate" value="+8.3%" />
          </ClientGrid>
        </ClientSection>
      </div>
    </ClientSection>
  </div>
);

// ==================== FULL DASHBOARD EXAMPLE ====================

const FullDashboardExample: React.FC = () => (
  <div className="space-y-6">
    {/* Dashboard Header */}
    <ClientPageHeader
      title="Email Marketing Dashboard"
      description="Comprehensive overview of your email marketing performance and campaigns"
      badge={{
        text: "LIVE DATA",
        variant: "default",
        pulse: true
      }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      }
    />

    {/* Quick Stats */}
    <ClientQuickStats
      stats={[
        {
          label: "Active Campaigns",
          value: "8",
          icon: <Target className="h-4 w-4" />,
          color: "primary",
          trend: { type: "up", value: "+2" }
        },
        {
          label: "Total Subscribers",
          value: "24.5K",
          icon: <Users className="h-4 w-4" />,
          color: "success",
          trend: { type: "up", value: "+1.2K" }
        },
        {
          label: "This Month Revenue",
          value: "$12.4K",
          icon: <DollarSign className="h-4 w-4" />,
          color: "info",
          trend: { type: "up", value: "+8.3%" }
        },
        {
          label: "Avg Open Rate",
          value: "23.8%",
          icon: <Mail className="h-4 w-4" />,
          color: "warning",
          trend: { type: "down", value: "-1.2%" }
        }
      ]}
    />

    {/* Main Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Main Metrics */}
      <div className="lg:col-span-2 space-y-6">
        {/* Performance Overview */}
        <AnalyticsOverviewCard
          title="Performance Overview"
          timeRange="30d"
          data={[
            {
              current: 12547,
              previous: 10234,
              label: "Total Sent",
              format: "number"
            },
            {
              current: 94.2,
              previous: 91.8,
              label: "Delivery Rate",
              format: "percentage"
            },
            {
              current: 23.4,
              previous: 19.8,
              label: "Open Rate",
              format: "percentage"
            },
            {
              current: 4.2,
              previous: 3.8,
              label: "Click Rate",
              format: "percentage"
            }
          ]}
          onTimeRangeChange={(range) => console.log('Time range changed to:', range)}
        />

        {/* Active Campaign */}
        <RealTimeCampaignCard
          title="Black Friday 2024 Campaign"
          campaignId="CMP-2024-BF"
          status="running"
          metrics={{
            sent: 8420,
            delivered: 8180,
            opened: 1945,
            clicked: 287,
            bounced: 240
          }}
          progress={84}
          estimatedCompletion="1.5 hours remaining"
          updateInterval={5000}
          onStatusChange={(newStatus) => console.log('Campaign status changed to:', newStatus)}
        />

        {/* Quick Actions */}
        <ClientSection title="Quick Actions" description="Common tasks and shortcuts">
          <ClientQuickActions
            actions={[
              {
                title: "Create Campaign",
                description: "Start a new email campaign",
                icon: <Plus className="h-6 w-6" />,
                onClick: () => console.log('Create campaign'),
                badge: "Popular"
              },
              {
                title: "Import Contacts",
                description: "Add new subscribers",
                icon: <Users className="h-6 w-6" />,
                onClick: () => console.log('Import contacts')
              },
              {
                title: "View Analytics",
                description: "Detailed performance reports",
                icon: <BarChart3 className="h-6 w-6" />,
                onClick: () => console.log('View analytics')
              },
              {
                title: "Billing & Plans",
                description: "Manage your subscription",
                icon: <DollarSign className="h-6 w-6" />,
                onClick: () => console.log('Billing')
              }
            ]}
          />
        </ClientSection>
      </div>

      {/* Right Column - Sidebar */}
      <div className="space-y-6">
        {/* Performance Monitor */}
        <ClientPerformanceMonitor
          metrics={{
            emailsSentToday: 12547,
            deliveryRate: 94.2,
            openRate: 23.8,
            clickRate: 4.1,
            activeConnections: 8,
            systemLoad: 34
          }}
          updateInterval={10000}
        />

        {/* Notifications */}
        <ClientNotificationCenter
          notifications={[
            {
              id: "1",
              type: "success",
              title: "Campaign Completed",
              message: "Summer Sale campaign finished",
              timestamp: new Date(),
              read: false,
              actionLabel: "View",
              onAction: () => console.log('View report')
            },
            {
              id: "2",
              type: "warning",
              title: "Low Balance",
              message: "Credits running low",
              timestamp: new Date(Date.now() - 3600000),
              read: false,
              actionLabel: "Add Credits",
              onAction: () => console.log('Add credits')
            },
            {
              id: "3",
              type: "info",
              title: "New Feature",
              message: "A/B testing now available",
              timestamp: new Date(Date.now() - 7200000),
              read: true
            }
          ]}
          onMarkAsRead={(id) => console.log('Mark as read:', id)}
          onMarkAllAsRead={() => console.log('Mark all as read')}
        />

        {/* System Status */}
        <ClientSection title="System Status" description="Current system health">
          <div className="space-y-3">
            <ClientStatus
              status="active"
              label="Email Service"
              description="All systems operational"
              showPulse={true}
            />
            <ClientStatus
              status="active"
              label="Analytics"
              description="Real-time data available"
              showPulse={false}
            />
            <ClientStatus
              status="warning"
              label="SMTP Pool"
              description="High volume detected"
              showPulse={true}
            />
          </div>
        </ClientSection>
      </div>
    </div>
  </div>
);

export default ClientUIKitExamples;
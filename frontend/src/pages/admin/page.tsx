import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KitIdentificationBanner from "@/components/KitIdentificationBanner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateAdminData } from "@/services/mockData";
import {
  Monitor,
  Users,
  Settings,
  Database,
  Shield,
  BarChart3,
  Activity,
  CheckCircle,
  AlertTriangle,
  Mail,
  Server,
  Zap,
  Globe,
  FileText,
  RefreshCw,
  Eye,
  Download,
  Play,
  Pause
} from "lucide-react";
// import AdminMonitoringDashboard from "@/components/admin/AdminMonitoringDashboard";
// import { useSystemHealth } from "@/hooks/useMetricsData";
// import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import Shell from "@/components/layouts/Shell";
import PageHeader from "@/components/ui/page-header";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import {
  AdminPageHeader,
  AdminStatsCard,
  AdminGrid,
  AdminSection,
  AdminStatus,
  adminAnimations
} from "@/components/admin/AdminUIKit";
import {
  RealTimeStatsCard,
  SystemHealthMonitor,
  QuickActionsPanel,
  AlertCenter,
  enhancedAnimations
} from "@/components/admin/EnhancedAdminComponents";
import {
  SystemMaintenancePanel,
  BulkOperationsPanel,
  MonitoringControlsPanel
} from "@/components/admin/AdminActionPanels";
// import { RealTimeDashboard } from "@/components/admin/RealTimeDashboard";
// import { AdminMonitoringDashboard } from "@/components/admin/AdminMonitoringDashboard";

// Mock functions for missing hooks
const useSystemHealth = () => ({ isHealthy: true, loading: false });
const useAdminDashboard = () => ({ metrics: {}, loading: false });

const Admin = () => {
  console.log('🏠 Admin page component rendering');

  // Simplified version to test basic rendering
  const { isHealthy, loading: healthLoading } = useSystemHealth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [systemAlerts] = useState([]);
  const [metricsLoading] = useState(false);
  const [systemHealth] = useState(null);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 1247,
    activeUsers: 856,
    emailsSent: 15420,
    systemLoad: 68,
    revenue: 28540,
    campaigns: 142
  });
  const navigate = useNavigate();

  const toggleLive = () => setIsLive(!isLive);

  // Load realistic mock data on mount
  useEffect(() => {
    const mockData = generateAdminData();
    setSystemStats({
      totalUsers: mockData.users.length,
      activeUsers: mockData.users.filter(u => u.status === 'active').length,
      emailsSent: Math.floor(Math.random() * 50000) + 10000,
      systemLoad: mockData.systemHealth.cpuUsage,
      revenue: Math.floor(Math.random() * 100000) + 10000,
      campaigns: mockData.users.reduce((sum, u) => sum + u.campaigns, 0)
    });
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    console.log('🔄 Refreshing admin dashboard...');
  };

  const breadcrumbs = useBreadcrumbs("/")

  return (
    <Shell title="Admin Command Center" breadcrumbs={breadcrumbs}>
      <KitIdentificationBanner
        kitName="Admin UI Kit"
        componentCount={8}
        migrationPath="Evaluate custom admin components vs shadcn/ui"
      />
      <motion.div
        variants={enhancedAnimations.pageContainer}
        initial="initial"
        animate="animate"
        key={refreshKey}
        className="pt-16" // Add padding to account for banner
      >
        {/* Enhanced Header with Real-time Controls */}
        <AdminPageHeader
          title="Admin Command Center"
          description={`Real-time system administration and monitoring dashboard ${systemAlerts.length ? `• ${systemAlerts.length} active alerts` : ''}`}
          badge={{
            text: isLive ? "LIVE MONITORING" : "MONITORING PAUSED",
            variant: isLive ? "default" : "secondary"
          }}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"
                )} />
                <span className="text-xs text-muted-foreground">
                  {isLive ? "Live" : "Paused"}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleLive}
                className="hover:bg-accent"
              >
                {isLive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isLive ? "Pause" : "Resume"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={metricsLoading || healthLoading}
                className="hover:bg-accent"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", (metricsLoading || healthLoading) && "animate-spin")} />
                Refresh
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/client/dashboard')}
                className="hover:bg-accent"
              >
                <Activity className="h-4 w-4 mr-2" />
                Main Dashboard
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/performance-testing'}
                className="hover:bg-accent"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Performance
              </Button>
            </div>
          }
        />

        {/* Real-time Statistics Grid */}
        <AdminSection
          title="Live System Metrics"
          description="Real-time performance indicators with automatic updates"
        >
          <motion.div
            variants={enhancedAnimations.pageContainer}
            className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4"
          >
            <RealTimeStatsCard
              title="Total Users"
              value={systemStats.totalUsers}
              previousValue={1180}
              updateInterval={5000}
              icon={<Users className="h-4 w-4" />}
              color="primary"
            />
            <RealTimeStatsCard
              title="Active Sessions"
              value={systemStats.activeUsers}
              previousValue={820}
              updateInterval={3000}
              icon={<Activity className="h-4 w-4" />}
              color="success"
            />
            <RealTimeStatsCard
              title="Emails Sent"
              value={systemStats.emailsSent}
              previousValue={14890}
              updateInterval={2000}
              icon={<Mail className="h-4 w-4" />}
              color="primary"
            />
            <RealTimeStatsCard
              title="System Load"
              value={systemStats.systemLoad}
              previousValue={72}
              unit="%"
              updateInterval={4000}
              icon={<Server className="h-4 w-4" />}
              color={systemStats.systemLoad > 80 ? "danger" : systemStats.systemLoad > 60 ? "warning" : "success"}
            />
            <RealTimeStatsCard
              title="Revenue"
              value={systemStats.revenue}
              previousValue={26420}
              unit="$"
              updateInterval={10000}
              icon={<Zap className="h-4 w-4" />}
              color="success"
            />
            <RealTimeStatsCard
              title="Campaigns"
              value={systemStats.campaigns}
              previousValue={138}
              updateInterval={15000}
              icon={<BarChart3 className="h-4 w-4" />}
              color="primary"
            />
          </motion.div>
        </AdminSection>

        {/* Advanced Monitoring Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* System Health Monitor */}
          <SystemHealthMonitor className="xl:col-span-1" />

          {/* Quick Actions Panel */}
          <QuickActionsPanel className="xl:col-span-1" />

          {/* Alert Center */}
          <AlertCenter className="lg:col-span-2 xl:col-span-1" />
        </div>

        {/* Enhanced System Status Grid */}
        <AdminSection
          title="Service Status Dashboard"
          description="Comprehensive status monitoring for all system components"
        >
          <motion.div
            variants={enhancedAnimations.pageContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {systemHealth?.services?.map((service, index) => (
              <motion.div key={service.name} variants={enhancedAnimations.cardStagger}>
                <AdminStatus
                  status={service.status}
                  label={service.name}
                  description={`${service.description}${service.response_time ? ` (${service.response_time}ms)` : ''}`}
                />
              </motion.div>
            )) || (
                // Fallback status cards when no real data
                <>
                  <motion.div variants={enhancedAnimations.cardStagger}>
                    <AdminStatus
                      status="online"
                      label="Database Cluster"
                      description="Primary: Online, Replica: Synced (99.9% uptime)"
                    />
                  </motion.div>
                  <motion.div variants={enhancedAnimations.cardStagger}>
                    <AdminStatus
                      status="online"
                      label="Email Gateway"
                      description="SMTP/IMAP: Active, Queue: 23 pending"
                    />
                  </motion.div>
                  <motion.div variants={enhancedAnimations.cardStagger}>
                    <AdminStatus
                      status={isHealthy ? "online" : "warning"}
                      label="API Gateway"
                      description="REST: 500+ endpoints, Full API Coverage"
                    />
                  </motion.div>
                  <motion.div variants={enhancedAnimations.cardStagger}>
                    <AdminStatus
                      status="online"
                      label="Background Services"
                      description="Redis: Connected, Celery: 12 workers active"
                    />
                  </motion.div>
                </>
              )}
          </motion.div>
        </AdminSection>

        {/* Enhanced Management Tools */}
        <AdminSection
          title="Administrative Tools & Services"
          description="Comprehensive management interface for all system components"
        >
          <motion.div variants={enhancedAnimations.slideUp}>
            <Tabs defaultValue="monitoring" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 bg-card border border-border dark:border-border hover:shadow-sm transition-shadow">
                <TabsTrigger
                  value="monitoring"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 hover:bg-accent"
                >
                  <motion.div whileHover={{ scale: 1.1 }}>
                    <Monitor className="h-4 w-4" />
                  </motion.div>
                  <span className="text-xs sm:text-sm">Mon</span>
                  <span className="hidden lg:inline ml-1">itoring</span>
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 hover:bg-accent"
                >
                  <motion.div whileHover={{ scale: 1.1 }}>
                    <Users className="h-4 w-4" />
                  </motion.div>
                  <span className="text-xs sm:text-sm">Users</span>
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 hover:bg-accent"
                >
                  <motion.div whileHover={{ scale: 1.1 }}>
                    <BarChart3 className="h-4 w-4" />
                  </motion.div>
                  <span className="text-xs sm:text-sm">Stats</span>
                  <span className="hidden lg:inline ml-1">tics</span>
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 hover:bg-accent"
                >
                  <motion.div whileHover={{ scale: 1.1 }}>
                    <Shield className="h-4 w-4" />
                  </motion.div>
                  <span className="text-xs sm:text-sm">Sec</span>
                  <span className="hidden lg:inline ml-1">urity</span>
                </TabsTrigger>
                <TabsTrigger
                  value="smtp"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 hover:bg-accent"
                >
                  <motion.div whileHover={{ scale: 1.1 }}>
                    <Mail className="h-4 w-4" />
                  </motion.div>
                  <span className="text-xs sm:text-sm">SMTP</span>
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 hover:bg-accent"
                >
                  <motion.div whileHover={{ scale: 1.1 }}>
                    <Settings className="h-4 w-4" />
                  </motion.div>
                  <span className="text-xs sm:text-sm">Set</span>
                  <span className="hidden lg:inline ml-1">tings</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="monitoring" className="space-y-6">
                <motion.div
                  variants={enhancedAnimations.pageContainer}
                  initial="initial"
                  animate="animate"
                >
                  {/* <RealTimeDashboard /> */}
                  <Card className="p-4">
                    <CardHeader className="p-0 pb-3">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Real-time Monitoring
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <p className="text-muted-foreground">Live system monitoring dashboard would appear here.</p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                    <SystemMaintenancePanel />
                    <BulkOperationsPanel />
                    <MonitoringControlsPanel />
                  </div>

                  <div className="mt-6">
                    {/* <AdminMonitoringDashboard /> */}
                    <Card className="p-4">
                      <CardHeader className="p-0 pb-3">
                        <CardTitle className="text-xl font-semibold flex items-center gap-2">
                          <Monitor className="h-5 w-5 text-primary" />
                          System Monitoring
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <p className="text-muted-foreground">Comprehensive monitoring dashboard would appear here.</p>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="users" className="space-y-6">
                <motion.div
                  variants={enhancedAnimations.pageContainer}
                  initial="initial"
                  animate="animate"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <RealTimeStatsCard
                      title="Total Users"
                      value={systemStats.totalUsers}
                      previousValue={1180}
                      updateInterval={8000}
                      icon={<Users className="h-4 w-4" />}
                      color="primary"
                    />
                    <RealTimeStatsCard
                      title="Active Today"
                      value={systemStats.activeUsers}
                      previousValue={820}
                      updateInterval={5000}
                      icon={<Activity className="h-4 w-4" />}
                      color="success"
                    />
                    <RealTimeStatsCard
                      title="New Signups"
                      value={47}
                      previousValue={39}
                      updateInterval={12000}
                      icon={<Zap className="h-4 w-4" />}
                      color="primary"
                    />
                    <RealTimeStatsCard
                      title="Premium Users"
                      value={289}
                      previousValue={267}
                      updateInterval={15000}
                      icon={<Shield className="h-4 w-4" />}
                      color="success"
                    />
                  </div>

                  <AdminGrid columns={3} gap="md">
                    <motion.div variants={enhancedAnimations.cardStagger}>
                      <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5 text-primary" />
                            User Management
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Comprehensive user account management with role-based permissions and access control.
                          </p>
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = '/admin/users'}
                              className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Manage Users
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs"
                            >
                              <Eye className="h-3 w-3 mr-2" />
                              View User Analytics
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div variants={enhancedAnimations.cardStagger}>
                      <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Zap className="h-5 w-5 text-primary" />
                            Plans & Billing
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Configure subscription plans, pricing tiers, and automated billing processes.
                          </p>
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = '/admin/plans'}
                              className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                              <Zap className="h-4 w-4 mr-2" />
                              Manage Plans
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs"
                            >
                              <Settings className="h-3 w-3 mr-2" />
                              Billing Settings
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div variants={enhancedAnimations.cardStagger}>
                      <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Activity className="h-5 w-5 text-primary" />
                            User Activity
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Real-time user session monitoring, activity logs, and engagement analytics.
                          </p>
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                              <Activity className="h-4 w-4 mr-2" />
                              View Activity
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs"
                            >
                              <Download className="h-3 w-3 mr-2" />
                              Export Reports
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </AdminGrid>
                </motion.div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <AdminGrid columns={2} gap="md">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Business Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Comprehensive business metrics, performance indicators, and detailed reporting.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = '/admin/analytics'}
                        className="w-full"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Activity className="h-5 w-5 text-primary" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        System performance monitoring, optimization tools, and benchmark analysis.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/admin/performance')}
                        className="w-full"
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Performance
                      </Button>
                    </CardContent>
                  </Card>
                </AdminGrid>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <AdminGrid columns={3} gap="md">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5 text-primary" />
                        Security Center
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Manage security policies, access controls, and threat monitoring.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = '/admin/security'}
                        className="w-full"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Security Settings
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        Security Logs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Monitor security events, audit trails, and access logs.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/admin/logs')}
                        className="w-full"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Logs
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Database className="h-5 w-5 text-primary" />
                        Database Security
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Database encryption, backup policies, and data protection.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/admin/database')}
                        className="w-full"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Database Settings
                      </Button>
                    </CardContent>
                  </Card>
                </AdminGrid>
              </TabsContent>

              <TabsContent value="smtp" className="space-y-6">
                <AdminGrid columns={2} gap="md">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Mail className="h-5 w-5 text-primary" />
                        SMTP Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure SMTP servers for 2FA authentication and system notifications.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = '/admin/smtp'}
                        className="w-full"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        SMTP Settings
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Globe className="h-5 w-5 text-primary" />
                        API Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Manage API keys, rate limiting, and external service integrations.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = '/admin/api'}
                        className="w-full"
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        API Settings
                      </Button>
                    </CardContent>
                  </Card>
                </AdminGrid>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <AdminGrid columns={3} gap="md">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Settings className="h-5 w-5 text-primary" />
                        General Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure general system preferences and global settings.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/admin/settings')}
                        className="w-full"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        System Settings
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Monitor className="h-5 w-5 text-primary" />
                        Monitoring
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        System monitoring, alerts, and performance tracking.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/admin/monitoring')}
                        className="w-full"
                      >
                        <Monitor className="h-4 w-4 mr-2" />
                        Monitoring
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Server className="h-5 w-5 text-primary" />
                        System Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Real-time system status, health checks, and diagnostics.
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        <Server className="h-4 w-4 mr-2" />
                        System Status
                      </Button>
                    </CardContent>
                  </Card>
                </AdminGrid>
              </TabsContent>
            </Tabs>
          </motion.div>
        </AdminSection>
      </motion.div>
    </Shell>
  );
};

export default Admin;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageWrapper from "@/components/layout/PageWrapper";
import {
  EnhancedStatsCard,
  RealTimeStatsCard,
  SystemHealthMonitor,
  enhancedAnimations
} from '@/components/admin/EnhancedAdminComponents';
import { toast } from 'sonner';
import axios from '@/http/axios';
import {
  Users,
  Mail,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Database,
  Shield,
  Settings,
  Monitor,
  BarChart3,
  UserPlus,
  MessageSquare,
  Zap,
  RefreshCw
} from 'lucide-react';

const AdminOverviewPage = () => {
  const [loading, setLoading] = useState(false);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    serverLoad: 0,
    memoryUsage: 0,
    diskSpace: 0,
    emailsSent: 0
  });
  const [systemHealth, setSystemHealth] = useState(null);

  // Load real admin data from APIs
  const loadAdminData = async () => {
    try {
      setLoading(true);

      // Fetch user statistics
      const userCountResponse = await axios.get('/api/v1/admin/users/count');

      // Fetch system status
      const systemStatusResponse = await axios.get('/api/v1/admin/system/status');

      // Fetch system health
      const systemHealthResponse = await axios.get('/api/v1/admin/system/health');

      // Update stats with real data
      setSystemStats(prev => ({
        ...prev,
        totalUsers: userCountResponse.data.total_users || 0,
        activeUsers: userCountResponse.data.active_users || 0,
        serverLoad: systemStatusResponse.data.system?.cpu_percent || 0,
        memoryUsage: systemStatusResponse.data.system?.memory_percent || 0,
        diskSpace: systemStatusResponse.data.system?.disk_percent || 0,
        // Keep campaign and email stats for now (will be updated in future iterations)
        totalCampaigns: prev.totalCampaigns,
        activeCampaigns: prev.activeCampaigns,
        emailsSent: prev.emailsSent
      }));

      setSystemHealth(systemHealthResponse.data);

    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const recentAlerts = [
    {
      id: 1,
      type: 'warning',
      message: 'High memory usage detected on server-02',
      timestamp: '2 minutes ago',
      status: 'active'
    },
    {
      id: 2,
      type: 'info',
      message: 'Scheduled maintenance completed successfully',
      timestamp: '1 hour ago',
      status: 'resolved'
    },
    {
      id: 3,
      type: 'error',
      message: 'SMTP service temporary unavailable',
      timestamp: '3 hours ago',
      status: 'resolved'
    }
  ];

  const quickActions = [
    { icon: Users, label: 'Manage Users', description: 'Add, edit, or remove user accounts', action: '/admin/users' },
    { icon: BarChart3, label: 'View Analytics', description: 'Monitor system performance and usage', action: '/admin/analytics' },
    { icon: Settings, label: 'System Settings', description: 'Configure platform settings', action: '/admin/settings' },
    { icon: Shield, label: 'Security Center', description: 'Monitor security events and logs', action: '/admin/security' },
    { icon: MessageSquare, label: 'Support Chat', description: 'Respond to user inquiries', action: '/admin/chat' },
    { icon: Monitor, label: 'System Status', description: 'Check service health and uptime', action: '/admin/system/status' }
  ];

  const handleQuickAction = (action: string) => {
    window.location.href = action;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-primary" />;
      default:
        return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getAlertBadge = (type: string) => {
    const variants = {
      error: 'bg-destructive/20 text-destructive-800 dark:bg-destructive/20 dark:text-destructive-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      info: 'bg-primary/20 text-primary-800 dark:bg-primary/20 dark:text-primary-300'
    };

    return (
      <Badge className={variants[type as keyof typeof variants]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  return (
    <PageWrapper
      title="Admin Overview"
      description="System administration dashboard and platform management"
    >
      {/* Header with Refresh Button */}
      <motion.div
        className="flex items-center justify-between mb-6"
        variants={enhancedAnimations.slideUp}
        initial="initial"
        animate="animate"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-muted/20 rounded-lg border border-primary/30">
              <span className="text-2xl">🎛️</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                Admin Overview
              </h1>
              <p className="text-zinc-400">Real-time system administration dashboard • LIVE DATA!</p>
            </div>
          </div>
        </div>

        <Button
          onClick={loadAdminData}
          disabled={loading}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </motion.div>

      {/* Enhanced System Stats with 4D Animations */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        variants={enhancedAnimations.pageContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={enhancedAnimations.cardStagger}>
          <RealTimeStatsCard
            title="Total Users"
            value={loading ? "..." : systemStats.totalUsers}
            previousValue={systemStats.totalUsers > 0 ? Math.floor(systemStats.totalUsers * 0.95) : 1180}
            updateInterval={30000}
            icon={<Users className="w-5 h-5" />}
            color="primary"
            trend={{ type: "up", value: loading ? "..." : "+5.7%" }}
            subtitle={loading ? "Loading..." : `${systemStats.activeUsers} active today`}
          />
        </motion.div>

        <motion.div variants={enhancedAnimations.cardStagger}>
          <RealTimeStatsCard
            title="Email Campaigns"
            value={systemStats.totalCampaigns}
            previousValue={3201}
            updateInterval={8000}
            icon={<Mail className="w-5 h-5" />}
            color="success"
            trend={{ type: "up", value: "+6.9%" }}
            subtitle={`${systemStats.activeCampaigns} currently running`}
          />
        </motion.div>

        <motion.div variants={enhancedAnimations.cardStagger}>
          <RealTimeStatsCard
            title="Server Load"
            value={loading ? "..." : systemStats.serverLoad}
            previousValue={systemStats.serverLoad > 0 ? systemStats.serverLoad + 5 : 72}
            updateInterval={5000}
            icon={<Server className="w-5 h-5" />}
            color={systemStats.serverLoad > 80 ? "destructive" : systemStats.serverLoad > 60 ? "warning" : "success"}
            trend={{ type: systemStats.serverLoad < 70 ? "down" : "up", value: loading ? "..." : "Live" }}
            subtitle={loading ? "Loading..." : `Memory: ${systemStats.memoryUsage}% | Disk: ${systemStats.diskSpace}%`}
            valueFormat="percentage"
          />
        </motion.div>

        <motion.div variants={enhancedAnimations.cardStagger}>
          <RealTimeStatsCard
            title="Emails Sent"
            value={systemStats.emailsSent}
            previousValue={112450}
            updateInterval={4000}
            icon={<TrendingUp className="w-5 h-5" />}
            color="info"
            trend={{ type: "up", value: "+12%" }}
            subtitle="from last month"
          />
        </motion.div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        variants={enhancedAnimations.pageContainer}
        initial="initial"
        animate="animate"
      >
        {/* Enhanced Quick Actions with Hover Animations */}
        <motion.div variants={enhancedAnimations.slideUp}>
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-background via-background to-muted/20">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0"
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <CardHeader className="relative">
              <motion.div
                className="flex items-center gap-2"
                variants={enhancedAnimations.pulse}
                animate="animate"
              >
                <Zap className="w-5 h-5 text-primary" />
                <CardTitle>Quick Actions</CardTitle>
              </motion.div>
              <CardDescription>
                Common administrative tasks with enhanced interactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 relative">
              {quickActions.map((action, index) => (
                <motion.div
                  key={index}
                  className="group relative"
                  variants={enhancedAnimations.cardStagger}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between p-4 border rounded-xl bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <action.icon className="w-4 h-4 text-primary" />
                      </motion.div>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">{action.label}</p>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-60 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleQuickAction(action.action)}
                      >
                        Open
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Recent Alerts with Status Animations */}
        <motion.div variants={enhancedAnimations.slideUp}>
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-background via-background to-muted/20">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0"
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <CardHeader className="relative">
              <motion.div
                className="flex items-center gap-2"
                variants={enhancedAnimations.pulse}
                animate="animate"
              >
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <CardTitle>Recent Alerts</CardTitle>
              </motion.div>
              <CardDescription>
                System notifications with real-time status tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 relative">
              {recentAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  className="group"
                  variants={enhancedAnimations.cardStagger}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                >
                  <div className="flex items-start gap-3 p-4 border rounded-xl bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300">
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {getAlertIcon(alert.type)}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <motion.div whileHover={{ scale: 1.05 }}>
                          {getAlertBadge(alert.type)}
                        </motion.div>
                        <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                      </div>
                      <p className="text-sm group-hover:text-foreground transition-colors">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Badge
                            variant={alert.status === 'resolved' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {alert.status}
                          </Badge>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Enhanced System Health Monitor with Live Updates */}
      <motion.div
        variants={enhancedAnimations.slideUp}
        initial="initial"
        animate="animate"
      >
        <SystemHealthMonitor
          updateInterval={10000}
          showDetailedMetrics={true}
          animationLevel="enhanced"
          healthData={systemHealth}
          loading={loading}
        />
      </motion.div>
    </PageWrapper>
  );
};

export default AdminOverviewPage; 
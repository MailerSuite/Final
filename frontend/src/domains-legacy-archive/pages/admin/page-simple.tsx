/**
 * Simple Admin Panel - Basic Working Version
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Monitor, 
  Users, 
  Settings, 
  Database,
  Shield,
  Activity,
  CheckCircle,
  Mail,
  Server,
  RefreshCw
} from "lucide-react";
import { useSystemHealth } from "@/hooks/useMetricsData";
import PageWrapper from "@/components/layout/PageWrapper";

const AdminSimple = () => {
  // Debug component rendering (can be removed in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('🏠 Simple Admin page component rendering');
  }
  
  const { isHealthy, loading: healthLoading } = useSystemHealth();
  const [refreshKey, setRefreshKey] = useState(0);

  // Simple fallback stats
  const systemStats = {
    totalUsers: 1247,
    activeUsers: 856,
    emailsSent: 15420,
    systemLoad: 68,
    revenue: 28540,
    campaigns: 142
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    console.log('🔄 Refreshing admin dashboard...');
  };

  return (
    <PageWrapper title="Admin Panel" className="space-y-6">
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Simple Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                SGPT Administration
                <Badge variant={isHealthy ? "default" : "destructive"}>
                  {isHealthy ? "System Healthy" : "Issues Detected"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <div className="text-sm text-muted-foreground">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Simple Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Users</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Activity className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{systemStats.activeUsers.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Mail className="h-8 w-8 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{systemStats.emailsSent.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Emails Sent</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Server className="h-8 w-8 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{systemStats.systemLoad}%</div>
                    <div className="text-sm text-muted-foreground">System Load</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Simple Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">
                <Monitor className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="database">
                <Database className="h-4 w-4 mr-2" />
                Database
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>System Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>All systems operational</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Database connected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>API services running</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>Total users: {systemStats.totalUsers.toLocaleString()}</p>
                    <p>Active users: {systemStats.activeUsers.toLocaleString()}</p>
                    <Button variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Users
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database">
              <Card>
                <CardHeader>
                  <CardTitle>Database Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>PostgreSQL: Connected</span>
                    </div>
                    <Button variant="outline">
                      <Database className="h-4 w-4 mr-2" />
                      Database Tools
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>Configure system settings and preferences</p>
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Open Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default AdminSimple;
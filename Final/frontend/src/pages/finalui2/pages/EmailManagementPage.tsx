/**
 * Email Management Page
 * Comprehensive email management with SMTP servers, lists, and live dashboard
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Server,
  Users,
  Activity,
  Settings,
  Plus,
  BarChart3,
  Send,
  FileText,
  Shield,
  Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/client/PageHeader';
import SMTPServersList from '@/components/smtp-servers/SMTPServersList';
import EmailListManager from '@/components/email-lists/EmailListManager';
import EnhancedLiveMailingDashboard from '@/components/mailing/EnhancedLiveMailingDashboard';
import { useSession } from '@/hooks/use-session';

export default function EmailManagementPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { sessionId } = useSession();

  const stats = {
    totalServers: 5,
    activeServers: 4,
    totalLists: 12,
    totalContacts: 45320,
    activeCampaigns: 3,
    emailsSentToday: 15420,
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Email Management"
        description="Manage your SMTP servers, email lists, and monitor campaigns"
        icon={<Mail className="w-8 h-8" />}
        badge={<Badge variant="secondary">Pro</Badge>}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-500" />
                SMTP Servers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalServers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeServers} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                Email Lists
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLists}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalContacts.toLocaleString()} contacts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                Active Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Running now
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Send className="w-4 h-4 text-orange-500" />
                Sent Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.emailsSentToday.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Emails delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-500" />
                Delivery Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.5%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Throughput
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">245/s</div>
              <p className="text-xs text-muted-foreground mt-1">
                Current speed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 max-w-[600px]">
            <TabsTrigger value="dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              Live Dashboard
            </TabsTrigger>
            <TabsTrigger value="servers">
              <Server className="w-4 h-4 mr-2" />
              SMTP Servers
            </TabsTrigger>
            <TabsTrigger value="lists">
              <Users className="w-4 h-4 mr-2" />
              Email Lists
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <EnhancedLiveMailingDashboard />
            </motion.div>
          </TabsContent>

          <TabsContent value="servers" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SMTPServersList sessionId={sessionId || 'default'} />
            </motion.div>
          </TabsContent>

          <TabsContent value="lists" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <EmailListManager sessionId={sessionId || 'default'} />
            </motion.div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Email Templates</CardTitle>
                  <CardDescription>
                    Create and manage reusable email templates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Template Management Coming Soon</h3>
                    <p className="text-muted-foreground mb-4">
                      Create, edit, and organize your email templates in one place
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
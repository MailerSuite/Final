import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from '@/http/axios';
import { Settings, Server, Shield, Bell, Save, RefreshCw } from 'lucide-react';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    siteName: '',
    siteUrl: '',
    adminEmail: '',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerification: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    emailNotifications: true,
    slackNotifications: false,
    backupEnabled: true,
    backupFrequency: 'daily'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch system settings from API
      const settingsResponse = await axios.get('/api/v1/admin/settings');
      const settingsData = settingsResponse.data;
      
      // Map API response to frontend state structure
      setSettings({
        siteName: settingsData.general.site_name || '',
        siteUrl: settingsData.general.site_url || '',
        adminEmail: settingsData.general.admin_email || '',
        maintenanceMode: false, // Static for now
        registrationEnabled: true, // Static for now
        emailVerification: true, // Static for now
        twoFactorAuth: settingsData.security.require_2fa || false,
        sessionTimeout: Math.round(settingsData.security.session_timeout / 60) || 30, // Convert to hours
        maxLoginAttempts: settingsData.security.max_login_attempts || 5,
        emailNotifications: settingsData.monitoring.alert_email_enabled || true,
        slackNotifications: false, // Static for now
        backupEnabled: true, // Static for now
        backupFrequency: 'daily' // Static for now
      });
      
      toast.success('Settings loaded with live data!');
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      
      // Map frontend state to API format
      const apiSettings = {
        general: {
          site_name: settings.siteName,
          site_url: settings.siteUrl,
          admin_email: settings.adminEmail
        },
        security: {
          require_2fa: settings.twoFactorAuth,
          session_timeout: settings.sessionTimeout * 60, // Convert back to minutes
          max_login_attempts: settings.maxLoginAttempts
        },
        monitoring: {
          alert_email_enabled: settings.emailNotifications
        }
      };
      
      // Save settings via API
      const saveResponse = await axios.put('/api/v1/admin/settings', apiSettings);
      
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to save settings';
      toast.error(errorMessage);
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-lg border border-blue-500/30">
              <Settings className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                System Settings
              </h1>
              <p className="text-zinc-400">Configure system-wide settings and preferences</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={saveSettings}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1">
          <TabsTrigger value="general" className="data-[state=active]:bg-zinc-700">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-zinc-700">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-zinc-700">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-zinc-700">
            <Server className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white">Site Name</Label>
                <Input
                  value={settings.siteName}
                  onChange={(e) => updateSetting('siteName', e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Site URL</Label>
                <Input
                  value={settings.siteUrl}
                  onChange={(e) => updateSetting('siteUrl', e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Admin Email</Label>
                <Input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => updateSetting('adminEmail', e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Maintenance Mode</Label>
                  <p className="text-sm text-zinc-400">Temporarily disable site access</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">User Registration</Label>
                  <p className="text-sm text-zinc-400">Allow new user registrations</p>
                </div>
                <Switch
                  checked={settings.registrationEnabled}
                  onCheckedChange={(checked) => updateSetting('registrationEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Email Verification</Label>
                  <p className="text-sm text-zinc-400">Require email verification for new accounts</p>
                </div>
                <Switch
                  checked={settings.emailVerification}
                  onCheckedChange={(checked) => updateSetting('emailVerification', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Two-Factor Authentication</Label>
                  <p className="text-sm text-zinc-400">Enable 2FA for admin accounts</p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Max Login Attempts</Label>
                <Input
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value))}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Email Notifications</Label>
                  <p className="text-sm text-zinc-400">Send notifications via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Slack Notifications</Label>
                  <p className="text-sm text-zinc-400">Send notifications to Slack</p>
                </div>
                <Switch
                  checked={settings.slackNotifications}
                  onCheckedChange={(checked) => updateSetting('slackNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">System Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Automated Backups</Label>
                  <p className="text-sm text-zinc-400">Enable automatic system backups</p>
                </div>
                <Switch
                  checked={settings.backupEnabled}
                  onCheckedChange={(checked) => updateSetting('backupEnabled', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Backup Frequency</Label>
                <Select value={settings.backupFrequency} onValueChange={(value) => updateSetting('backupFrequency', value)}>
                  <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AdminSettings;

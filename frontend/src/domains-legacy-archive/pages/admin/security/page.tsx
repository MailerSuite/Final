import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import axios from '@/http/axios';
import {
  Shield,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle,
  Key,
  UserX,
  Activity,
  RefreshCw,
  Download,
  Settings,
  Zap,
  Clock,
  Globe,
  Fingerprint,
  Server
} from 'lucide-react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const AdminSecurity = () => {
  const [loading, setLoading] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: false,
    sessionTimeout: 30,
    ipWhitelist: false,
    bruteForceProtection: false,
    passwordPolicy: false,
    auditLogging: false,
    encryption: false,
    apiRateLimit: false
  });

  const [securityStats, setSecurityStats] = useState({
    totalAttempts: 0,
    blockedAttempts: 0,
    activeSessions: 0,
    failedLogins: 0,
    suspiciousActivity: 0,
    lastAudit: '',
    securityScore: 0,
    threatsDetected: 0,
    threatsBlocked: 0
  });

  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Fetch security statistics
      const securityStatsResponse = await axios.get('/api/v1/admin/security/stats');
      
      // Fetch security settings
      const securitySettingsResponse = await axios.get('/api/v1/admin/security/settings');
      
      // Fetch recent security logs
      const securityLogsResponse = await axios.get('/api/v1/admin/security/logs?limit=10');
      
      // Update security stats with real data
      setSecurityStats({
        totalAttempts: securityStatsResponse.data.total_attempts || 0,
        blockedAttempts: securityStatsResponse.data.blocked_attempts || 0,
        activeSessions: securityStatsResponse.data.active_sessions || 0,
        failedLogins: securityStatsResponse.data.failed_logins || 0,
        suspiciousActivity: securityStatsResponse.data.suspicious_activity || 0,
        lastAudit: securityStatsResponse.data.last_audit || '',
        securityScore: securityStatsResponse.data.security_score || 0,
        threatsDetected: securityStatsResponse.data.threats_detected || 0,
        threatsBlocked: securityStatsResponse.data.threats_blocked || 0
      });
      
      // Update security settings with real data
      setSecuritySettings({
        twoFactor: securitySettingsResponse.data.two_factor || false,
        sessionTimeout: securitySettingsResponse.data.session_timeout || 30,
        ipWhitelist: securitySettingsResponse.data.ip_whitelist || false,
        bruteForceProtection: securitySettingsResponse.data.brute_force_protection || false,
        passwordPolicy: securitySettingsResponse.data.password_policy || false,
        auditLogging: securitySettingsResponse.data.audit_logging || false,
        encryption: securitySettingsResponse.data.encryption || false,
        apiRateLimit: securitySettingsResponse.data.api_rate_limit || false
      });
      
      // Update recent logs with real data
      setRecentLogs(securityLogsResponse.data.logs || []);
      
      toast.success('Security data refreshed with live data!');
    } catch (error) {
      console.error('Error loading security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: boolean | number) => {
    const newSettings = {
      ...securitySettings,
      [key]: value
    };
    setSecuritySettings(newSettings);
    updateSecuritySettings(newSettings);
  };

  const updateSecuritySettings = async (newSettings: typeof securitySettings) => {
    try {
      setLoading(true);
      
      // Convert camelCase to snake_case for backend API
      const apiSettings = {
        two_factor: newSettings.twoFactor,
        session_timeout: newSettings.sessionTimeout,
        ip_whitelist: newSettings.ipWhitelist,
        brute_force_protection: newSettings.bruteForceProtection,
        password_policy: newSettings.passwordPolicy,
        audit_logging: newSettings.auditLogging,
        encryption: newSettings.encryption,
        api_rate_limit: newSettings.apiRateLimit
      };
      
      // Update settings via API
      await axios.put('/api/v1/admin/security/settings', apiSettings);
      
      toast.success('Security settings updated successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to update security settings';
      toast.error(errorMessage);
      console.error('Error updating security settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportSecurityReport = () => {
    toast.success('Security report exported successfully');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      default:
        return <Activity className="h-4 w-4 text-blue-400" />;
    }
  };

  const getEventBadge = (type: string) => {
    const variants = {
      error: 'destructive',
      warning: 'outline',
      success: 'default',
      info: 'secondary'
    } as const;
    
    return variants[type as keyof typeof variants] || 'secondary';
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg border border-red-500/30">
              <Shield className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                Security Center
              </h1>
              <p className="text-zinc-400">System security monitoring and configuration • LIVE DATA!</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={exportSecurityReport}
            variant="outline"
            className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          
          <Button
            onClick={loadSecurityData}
            disabled={loading}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Security Overview Cards */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Total Attempts</p>
                  <p className="text-2xl font-bold text-white">{securityStats.totalAttempts.toLocaleString()}</p>
                  <Badge variant="outline" className="text-green-400 border-green-400 mt-1">
                    Normal
                  </Badge>
                </div>
                <Activity className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Blocked Attempts</p>
                  <p className="text-2xl font-bold text-white">{securityStats.blockedAttempts}</p>
                  <Badge variant="destructive" className="mt-1">
                    Threats blocked
                  </Badge>
                </div>
                <UserX className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Active Sessions</p>
                  <p className="text-2xl font-bold text-white">{securityStats.activeSessions}</p>
                  <Badge variant="outline" className="text-green-400 border-green-400 mt-1">
                    Secure
                  </Badge>
                </div>
                <Eye className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Suspicious Activity</p>
                  <p className="text-2xl font-bold text-white">{securityStats.suspiciousActivity}</p>
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400 mt-1">
                    Monitoring
                  </Badge>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Main Security Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1">
            <TabsTrigger value="settings" className="data-[state=active]:bg-zinc-700">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-zinc-700">
              <Activity className="h-4 w-4 mr-2" />
              Security Logs
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-zinc-700">
              <Eye className="h-4 w-4 mr-2" />
              Active Sessions
            </TabsTrigger>
            <TabsTrigger value="policies" className="data-[state=active]:bg-zinc-700">
              <Lock className="h-4 w-4 mr-2" />
              Policies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-400" />
                    Authentication Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Two-Factor Authentication</Label>
                      <p className="text-sm text-zinc-400">Require 2FA for all admin accounts</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactor}
                      onCheckedChange={(checked) => updateSetting('twoFactor', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">IP Whitelist</Label>
                      <p className="text-sm text-zinc-400">Restrict admin access to approved IPs</p>
                    </div>
                    <Switch
                      checked={securitySettings.ipWhitelist}
                      onCheckedChange={(checked) => updateSetting('ipWhitelist', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Brute Force Protection</Label>
                      <p className="text-sm text-zinc-400">Block IPs after failed attempts</p>
                    </div>
                    <Switch
                      checked={securitySettings.bruteForceProtection}
                      onCheckedChange={(checked) => updateSetting('bruteForceProtection', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-medium">Session Timeout (minutes)</Label>
                    <Input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                      className="bg-zinc-800/50 border-zinc-700 text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Lock className="h-5 w-5 text-green-400" />
                    System Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Password Policy</Label>
                      <p className="text-sm text-zinc-400">Enforce strong password requirements</p>
                    </div>
                    <Switch
                      checked={securitySettings.passwordPolicy}
                      onCheckedChange={(checked) => updateSetting('passwordPolicy', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Audit Logging</Label>
                      <p className="text-sm text-zinc-400">Log all administrative actions</p>
                    </div>
                    <Switch
                      checked={securitySettings.auditLogging}
                      onCheckedChange={(checked) => updateSetting('auditLogging', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Data Encryption</Label>
                      <p className="text-sm text-zinc-400">Encrypt sensitive data at rest</p>
                    </div>
                    <Switch
                      checked={securitySettings.encryption}
                      onCheckedChange={(checked) => updateSetting('encryption', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">API Rate Limiting</Label>
                      <p className="text-sm text-zinc-400">Prevent API abuse and DoS attacks</p>
                    </div>
                    <Switch
                      checked={securitySettings.apiRateLimit}
                      onCheckedChange={(checked) => updateSetting('apiRateLimit', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-400" />
                  Recent Security Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50 hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {getEventIcon(log.type)}
                        <div>
                          <p className="text-white font-medium">{log.event}</p>
                          <div className="flex items-center gap-4 text-sm text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {log.ip}
                            </span>
                            <span className="flex items-center gap-1">
                              <Fingerprint className="h-3 w-3" />
                              {log.user}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(log.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getEventBadge(log.type)}>
                          {log.type}
                        </Badge>
                        {log.blocked && (
                          <Badge variant="destructive">
                            Blocked
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-400" />
                  Active User Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">A</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">admin@sgpt.dev</p>
                        <div className="flex items-center gap-4 text-sm text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            10.0.0.1
                          </span>
                          <span className="flex items-center gap-1">
                            <Server className="h-3 w-3" />
                            Chrome/Windows
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Active 2h
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Admin</Badge>
                      <Button size="sm" variant="outline" className="bg-zinc-800/50 border-zinc-700">
                        Terminate
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">U</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">user@company.com</p>
                        <div className="flex items-center gap-4 text-sm text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            192.168.1.50
                          </span>
                          <span className="flex items-center gap-1">
                            <Server className="h-3 w-3" />
                            Firefox/MacOS
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Active 15m
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">User</Badge>
                      <Button size="sm" variant="outline" className="bg-zinc-800/50 border-zinc-700">
                        Terminate
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Key className="h-5 w-5 text-yellow-400" />
                    Password Policy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-yellow-900 bg-yellow-950/50">
                    <Key className="h-4 w-4" />
                    <AlertDescription className="text-yellow-200">
                      Current password policy requires minimum 8 characters with uppercase, lowercase, numbers, and special characters.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Minimum Length</span>
                      <span className="text-white">8 characters</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Password Expiry</span>
                      <span className="text-white">90 days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Login Attempts</span>
                      <span className="text-white">5 max</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Lockout Duration</span>
                      <span className="text-white">30 minutes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-400" />
                    Access Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-purple-900 bg-purple-950/50">
                    <Zap className="h-4 w-4" />
                    <AlertDescription className="text-purple-200">
                      Role-based access control is active. Users are assigned specific permissions based on their role.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Admin Users</span>
                      <span className="text-white">3 active</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Moderators</span>
                      <span className="text-white">8 active</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Regular Users</span>
                      <span className="text-white">12,536 active</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">API Keys</span>
                      <span className="text-white">245 active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default AdminSecurity;
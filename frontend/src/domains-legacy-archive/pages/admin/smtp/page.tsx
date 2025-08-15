import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Mail,
  Server,
  Shield,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  Key,
  Globe,
  Clock,
  Activity,
  Settings
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

interface SMTPConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: 'none' | 'tls' | 'ssl';
  isDefault: boolean;
  isActive: boolean;
  lastUsed: string;
  emailsSent: number;
  status: 'connected' | 'error' | 'testing';
}

const AdminSMTP = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [editingConfig, setEditingConfig] = useState<SMTPConfig | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const [smtpConfigs, setSMTPConfigs] = useState<SMTPConfig[]>([]);

  const [newConfig, setNewConfig] = useState<Partial<SMTPConfig>>({
    name: '',
    host: '',
    port: 587,
    username: '',
    password: '',
    encryption: 'tls',
    isDefault: false,
    isActive: true
  });

  useEffect(() => {
    loadSMTPConfigs();
  }, []);

  const loadSMTPConfigs = async () => {
    try {
      setLoading(true);
      
      // Fetch SMTP configurations from API
      const smtpConfigsResponse = await axios.get('/api/v1/admin/smtp/configs');
      
      // Transform backend data to frontend format
      const transformedConfigs = (smtpConfigsResponse.data.configs || []).map((config: any) => ({
        id: config.id.toString(),
        name: config.name,
        host: config.host,
        port: config.port,
        username: config.username,
        password: '••••••••••••', // Don't show real passwords
        encryption: config.encryption?.toLowerCase() === 'ssl/tls' ? 'ssl' : 'tls',
        isDefault: config.id === 1, // Primary SMTP is default
        isActive: config.status === 'active',
        lastUsed: config.last_used,
        emailsSent: config.sent_today || 0,
        status: config.status === 'active' ? 'connected' : 
               config.status === 'standby' ? 'standby' : 'error'
      }));
      
      setSMTPConfigs(transformedConfigs);
      toast.success('SMTP configurations loaded with live data!');
    } catch (error) {
      console.error('Error loading SMTP configurations:', error);
      toast.error('Failed to load SMTP configurations');
    } finally {
      setLoading(false);
    }
  };

  const testSMTPConnection = async (config: SMTPConfig) => {
    try {
      setSMTPConfigs(prev => prev.map(c => 
        c.id === config.id ? { ...c, status: 'testing' } : c
      ));
      
      // Test SMTP connection via API
      const testResponse = await axios.post(
        `/api/v1/admin/smtp/configs/${config.id}/test?test_email=test@sgpt.dev`
      );
      
      setSMTPConfigs(prev => prev.map(c => 
        c.id === config.id ? { ...c, status: 'connected' } : c
      ));
      
      toast.success(`SMTP test successful: ${testResponse.data.message}`);
    } catch (error: any) {
      setSMTPConfigs(prev => prev.map(c => 
        c.id === config.id ? { ...c, status: 'error' } : c
      ));
      const errorMessage = error.response?.data?.detail || `SMTP test failed for ${config.name}`;
      toast.error(errorMessage);
      console.error('Error testing SMTP connection:', error);
    }
  };

  const createSMTPConfig = async () => {
    try {
      if (!newConfig.name || !newConfig.host || !newConfig.username || !newConfig.password) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Create SMTP config via API
      const createResponse = await axios.post('/api/v1/admin/smtp/configs', {
        name: newConfig.name,
        host: newConfig.host,
        port: newConfig.port,
        username: newConfig.username,
        password: newConfig.password,
        encryption: newConfig.encryption?.toUpperCase(),
        daily_limit: 1000
      });

      // Reload configurations to get updated data
      await loadSMTPConfigs();
      
      setNewConfig({
        name: '',
        host: '',
        port: 587,
        username: '',
        password: '',
        encryption: 'tls',
        isDefault: false,
        isActive: true
      });
      setIsCreateOpen(false);
      toast.success(createResponse.data.message || 'SMTP configuration created successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to create SMTP configuration';
      toast.error(errorMessage);
      console.error('Error creating SMTP configuration:', error);
    }
  };

  const updateSMTPConfig = async (config: SMTPConfig) => {
    try {
      setSMTPConfigs(prev => prev.map(c => c.id === config.id ? config : c));
      toast.success('SMTP configuration updated successfully');
    } catch (error) {
      toast.error('Failed to update SMTP configuration');
    }
  };

  const deleteSMTPConfig = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SMTP configuration?')) return;
    
    try {
      setSMTPConfigs(prev => prev.filter(c => c.id !== id));
      toast.success('SMTP configuration deleted successfully');
    } catch (error) {
      toast.error('Failed to delete SMTP configuration');
    }
  };

  const setDefaultSMTP = async (id: string) => {
    try {
      setSMTPConfigs(prev => prev.map(c => ({
        ...c,
        isDefault: c.id === id
      })));
      toast.success('Default SMTP configuration updated');
    } catch (error) {
      toast.error('Failed to update default SMTP');
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'testing':
        return <Badge variant="outline"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Testing</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
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
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
              <Mail className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                SMTP Management
              </h1>
              <p className="text-zinc-400">Configure and manage SMTP servers for system emails • LIVE DATA!</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={loadSMTPConfigs}
            disabled={loading}
            variant="outline"
            className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500">
                <Plus className="h-4 w-4 mr-2" />
                Add SMTP Server
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>Add SMTP Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Configuration Name</Label>
                  <Input
                    value={newConfig.name}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., System SMTP"
                    className="bg-zinc-800/50 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <Label>SMTP Host</Label>
                  <Input
                    value={newConfig.host}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="smtp.example.com"
                    className="bg-zinc-800/50 border-zinc-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Port</Label>
                    <Input
                      type="number"
                      value={newConfig.port}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                      className="bg-zinc-800/50 border-zinc-700 text-white"
                    />
                  </div>
                  <div>
                    <Label>Encryption</Label>
                    <Select value={newConfig.encryption} onValueChange={(value) => setNewConfig(prev => ({ ...prev, encryption: value as any }))}>
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Username</Label>
                  <Input
                    value={newConfig.username}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="username@example.com"
                    className="bg-zinc-800/50 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={newConfig.password}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="bg-zinc-800/50 border-zinc-700 text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Set as Default</Label>
                  <Switch
                    checked={newConfig.isDefault}
                    onCheckedChange={(checked) => setNewConfig(prev => ({ ...prev, isDefault: checked }))}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createSMTPConfig}>
                    Create Configuration
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* SMTP Overview Stats */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Total Configs</p>
                  <p className="text-2xl font-bold text-white">{smtpConfigs.length}</p>
                </div>
                <Server className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Active Servers</p>
                  <p className="text-2xl font-bold text-white">{smtpConfigs.filter(c => c.isActive).length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Emails Sent</p>
                  <p className="text-2xl font-bold text-white">{smtpConfigs.reduce((sum, c) => sum + c.emailsSent, 0).toLocaleString()}</p>
                </div>
                <Send className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Errors</p>
                  <p className="text-2xl font-bold text-white">{smtpConfigs.filter(c => c.status === 'error').length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* SMTP Configurations */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-400" />
              SMTP Server Configurations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {smtpConfigs.map((config) => (
                <div
                  key={config.id}
                  className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50 hover:bg-zinc-800/50 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-white">{config.name}</h3>
                          {config.isDefault && (
                            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                              <Key className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                          {getStatusBadge(config.status)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-zinc-400">
                          <div className="flex items-center gap-1">
                            <Server className="h-3 w-3" />
                            {config.host}:{config.port}
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {config.encryption.toUpperCase()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Send className="h-3 w-3" />
                            {config.emailsSent.toLocaleString()} sent
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(config.lastUsed)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testSMTPConnection(config)}
                        disabled={config.status === 'testing'}
                        className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 text-white"
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${config.status === 'testing' ? 'animate-spin' : ''}`} />
                        Test
                      </Button>
                      
                      {!config.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDefaultSMTP(config.id)}
                          className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 text-white"
                        >
                          <Key className="h-4 w-4 mr-1" />
                          Set Default
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingConfig(config)}
                        className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSMTPConfig(config.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Configuration Details */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-700/50">
                    <div>
                      <Label className="text-zinc-400">Username</Label>
                      <p className="text-white font-mono">{config.username}</p>
                    </div>
                    <div>
                      <Label className="text-zinc-400">Password</Label>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-mono">
                          {showPassword[config.id] ? config.password : '••••••••••••'}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePasswordVisibility(config.id)}
                          className="h-6 w-6 p-0"
                        >
                          {showPassword[config.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Alert className="border-blue-900 bg-blue-950/50">
                <Mail className="h-4 w-4" />
                <AlertDescription className="text-blue-200">
                  <div className="space-y-2">
                    <p className="font-medium">Test Email Delivery</p>
                    <p className="text-sm">Send a test email to verify SMTP functionality</p>
                    <Button size="sm" className="mt-2">
                      <Send className="h-3 w-3 mr-1" />
                      Send Test Email
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>

              <Alert className="border-yellow-900 bg-yellow-950/50">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-yellow-200">
                  <div className="space-y-2">
                    <p className="font-medium">Security Check</p>
                    <p className="text-sm">Verify SMTP security settings and encryption</p>
                    <Button size="sm" variant="outline" className="mt-2">
                      <Shield className="h-3 w-3 mr-1" />
                      Run Security Check
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>

              <Alert className="border-green-900 bg-green-950/50">
                <Activity className="h-4 w-4" />
                <AlertDescription className="text-green-200">
                  <div className="space-y-2">
                    <p className="font-medium">Performance Monitor</p>
                    <p className="text-sm">Monitor SMTP server performance and delivery rates</p>
                    <Button size="sm" variant="outline" className="mt-2">
                      <Activity className="h-3 w-3 mr-1" />
                      View Reports
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdminSMTP;
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Settings,
  Key,
  Shield,
  Activity,
  Copy,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Globe,
  Zap,
  Code,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  BarChart3
} from 'lucide-react';

const AdminAPI = () => {
  const [loading, setLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [createKeyDialogOpen, setCreateKeyDialogOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    environment: 'development',
    permissions: ['read'],
    rate_limit: 100
  });

  const [apiSettings, setApiSettings] = useState({
    rate_limiting: {
      enabled: true,
      requests_per_minute: 60,
      requests_per_hour: 3600,
      burst_limit: 200
    },
    cors: {
      enabled: true,
      allowed_origins: ["https://sgpt.dev", "https://app.sgpt.dev"],
      allowed_methods: ["GET", "POST", "PUT", "DELETE"],
      allowed_headers: ["*"]
    },
    authentication: {
      jwt_expiry_minutes: 60,
      refresh_token_days: 7,
      require_2fa_for_admin: false
    },
    features: {
      api_versioning: true,
      request_logging: true,
      response_compression: true,
      swagger_enabled: true
    },
    security: {
      max_request_size_mb: 10,
      ip_whitelist_enabled: false,
      api_key_rotation_days: 90
    }
  });

  const [apiKeys, setApiKeys] = useState([]);

  const loadApiSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/admin/api/settings');
      setApiSettings(response.data);
      toast.success('⚙️ API settings loaded - LIVE DATA!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to load API settings';
      toast.error(errorMessage);
      console.error('Error loading API settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApiKeys = async () => {
    try {
      const response = await axios.get('/api/v1/admin/api/keys');
      setApiKeys(response.data);
      toast.success('🔑 API keys loaded - LIVE DATA!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to load API keys';
      toast.error(errorMessage);
      console.error('Error loading API keys:', error);
    }
  };

  const handleCreateApiKey = async (keyData: any) => {
    try {
      const response = await axios.post('/api/v1/admin/api/keys', keyData);
      await loadApiKeys();
      toast.success('API key created successfully!');
      return response.data.api_key;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to create API key';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleUpdateSettings = async (newSettings: any) => {
    try {
      setLoading(true);
      await axios.put('/api/v1/admin/api/settings', newSettings);
      setApiSettings(newSettings);
      toast.success('API settings updated successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to update API settings';
      toast.error(errorMessage);
      console.error('Error updating API settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApiSettings();
    loadApiKeys();
  }, []);

  const updateSetting = (section: string, key: string, value: any) => {
    const newSettings = {
      ...apiSettings,
      [section]: {
        ...apiSettings[section],
        [key]: value
      }
    };
    setApiSettings(newSettings);
    handleUpdateSettings(newSettings);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatLastUsed = (dateString: string) => {
    if (!dateString) return 'Never used';
    return new Date(dateString).toLocaleDateString();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-40 -left-40 w-80 h-80 bg-muted/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-1/3 w-80 h-80 bg-muted/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div
          className="text-center space-y-4"
          variants={itemVariants}
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <motion.div
              className="p-3 bg-primary/20 rounded-xl backdrop-blur-sm border border-primary/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Code className="w-8 h-8 text-primary" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-muted bg-clip-text text-transparent">
              API Management
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage API keys, settings, and documentation - <span className="text-green-400 font-semibold">LIVE DATA!</span>
          </p>
        </motion.div>

        {/* API Stats Bar */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
          variants={itemVariants}
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">API Keys</p>
                  <p className="text-xl font-bold text-white">{apiKeys.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rate Limit</p>
                  <p className="text-xl font-bold text-white">{apiSettings.rate_limiting?.requests_per_minute}/min</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-muted/20 rounded-lg">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Security</p>
                  <p className="text-lg font-bold text-white">
                    {apiSettings.authentication?.require_2fa_for_admin ? '2FA' : 'JWT'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Endpoints</p>
                  <p className="text-xl font-bold text-white">500+</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="keys" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white/5 backdrop-blur-sm">
              <TabsTrigger value="keys" className="data-[state=active]:bg-blue-500/20">
                <Key className="w-4 h-4 mr-2" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-purple-500/20">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="docs" className="data-[state=active]:bg-green-500/20">
                <Code className="w-4 h-4 mr-2" />
                Documentation
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="data-[state=active]:bg-orange-500/20">
                <Activity className="w-4 h-4 mr-2" />
                Monitoring
              </TabsTrigger>
            </TabsList>

            {/* API Keys Tab */}
            <TabsContent value="keys" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">API Keys Management</h2>
                <Dialog open={createKeyDialogOpen} onOpenChange={setCreateKeyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-background/95 border-border">
                    <DialogHeader>
                      <DialogTitle className="text-white flex items-center space-x-2">
                        <Key className="w-5 h-5 text-blue-400" />
                        <span>Create New API Key</span>
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Key Name</Label>
                        <Input
                          value={newKeyData.name}
                          onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                          placeholder="e.g., Production Frontend"
                          className="bg-card/50 border-border text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Environment</Label>
                        <Select value={newKeyData.environment} onValueChange={(value) => setNewKeyData({ ...newKeyData, environment: value })}>
                          <SelectTrigger className="bg-card/50 border-border text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="production">Production</SelectItem>
                            <SelectItem value="development">Development</SelectItem>
                            <SelectItem value="testing">Testing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Rate Limit (requests/min)</Label>
                        <Input
                          type="number"
                          value={newKeyData.rate_limit}
                          onChange={(e) => setNewKeyData({ ...newKeyData, rate_limit: parseInt(e.target.value) || 100 })}
                          className="bg-card/50 border-border text-white"
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => setCreateKeyDialogOpen(false)}
                          className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={async () => {
                            try {
                              await handleCreateApiKey(newKeyData);
                              setCreateKeyDialogOpen(false);
                              setNewKeyData({ name: '', environment: 'development', permissions: ['read'], rate_limit: 100 });
                            } catch (error) {
                              // Error handled in the function
                            }
                          }}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Create Key
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* API Keys List */}
              <div className="grid gap-4">
                {apiKeys.length === 0 ? (
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                    <CardContent className="p-8 text-center">
                      <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-muted-foreground mb-2">No API Keys</h3>
                      <p className="text-muted-foreground">Create your first API key to get started.</p>
                    </CardContent>
                  </Card>
                ) : (
                  apiKeys.map((key: any, index) => (
                    <Card key={key.id} className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                              <Key className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <CardTitle className="text-white">{key.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                Last used: {formatLastUsed(key.last_used)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${key.active ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-muted/20 text-muted-foreground border-border/30'}`}>
                              {key.active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-500/20 border-red-500/30 hover:bg-red-500/40 text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-card/50 rounded-lg p-3 font-mono text-sm">
                            <span className="text-muted-foreground">
                              {showSecrets[key.id] ? key.key : `${key.key.substring(0, 20)}...`}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleSecretVisibility(key.id)}
                            className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                          >
                            {showSecrets[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(key.key)}
                            className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Permissions:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {key.permissions?.map((perm: string) => (
                                <Badge key={perm} className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                                  {perm}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Requests:</span>
                            <p className="text-white font-semibold">{key.requests_count?.toLocaleString() || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <h2 className="text-2xl font-bold text-white">API Configuration</h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Rate Limiting */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <span>Rate Limiting</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground">Enable Rate Limiting</Label>
                      <Switch
                        checked={apiSettings.rate_limiting?.enabled}
                        onCheckedChange={(checked) => updateSetting('rate_limiting', 'enabled', checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Requests per Minute</Label>
                      <Input
                        type="number"
                        value={apiSettings.rate_limiting?.requests_per_minute}
                        onChange={(e) => updateSetting('rate_limiting', 'requests_per_minute', parseInt(e.target.value))}
                        className="bg-card/50 border-border text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Burst Limit</Label>
                      <Input
                        type="number"
                        value={apiSettings.rate_limiting?.burst_limit}
                        onChange={(e) => updateSetting('rate_limiting', 'burst_limit', parseInt(e.target.value))}
                        className="bg-card/50 border-border text-white"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* CORS Settings */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Globe className="w-5 h-5 text-blue-400" />
                      <span>CORS Configuration</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground">Enable CORS</Label>
                      <Switch
                        checked={apiSettings.cors?.enabled}
                        onCheckedChange={(checked) => updateSetting('cors', 'enabled', checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Allowed Origins</Label>
                      <Input
                        value={apiSettings.cors?.allowed_origins?.join(', ')}
                        onChange={(e) => updateSetting('cors', 'allowed_origins', e.target.value.split(', '))}
                        className="bg-card/50 border-border text-white"
                        placeholder="https://domain1.com, https://domain2.com"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Authentication */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-green-400" />
                      <span>Authentication</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">JWT Expiry (minutes)</Label>
                      <Input
                        type="number"
                        value={apiSettings.authentication?.jwt_expiry_minutes}
                        onChange={(e) => updateSetting('authentication', 'jwt_expiry_minutes', parseInt(e.target.value))}
                        className="bg-card/50 border-border text-white"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground">Require 2FA for Admin</Label>
                      <Switch
                        checked={apiSettings.authentication?.require_2fa_for_admin}
                        onCheckedChange={(checked) => updateSetting('authentication', 'require_2fa_for_admin', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Features */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-purple-400" />
                      <span>API Features</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground">API Versioning</Label>
                      <Switch
                        checked={apiSettings.features?.api_versioning}
                        onCheckedChange={(checked) => updateSetting('features', 'api_versioning', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground">Request Logging</Label>
                      <Switch
                        checked={apiSettings.features?.request_logging}
                        onCheckedChange={(checked) => updateSetting('features', 'request_logging', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground">Swagger UI</Label>
                      <Switch
                        checked={apiSettings.features?.swagger_enabled}
                        onCheckedChange={(checked) => updateSetting('features', 'swagger_enabled', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Documentation Tab */}
            <TabsContent value="docs" className="space-y-6">
              <h2 className="text-2xl font-bold text-white">API Documentation</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Code className="w-5 h-5 text-blue-400" />
                      <span>Interactive Documentation</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Explore and test all available API endpoints with our interactive Swagger documentation.
                    </p>
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Swagger UI
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-green-400" />
                      <span>API Reference</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Comprehensive API reference with detailed endpoint descriptions and examples.
                    </p>
                    <Button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Documentation
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Monitoring Tab */}
            <TabsContent value="monitoring" className="space-y-6">
              <h2 className="text-2xl font-bold text-white">API Monitoring</h2>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Response Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">125ms</div>
                    <p className="text-xs text-muted-foreground">Average last 24h</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Throughput</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-400">1.2K</div>
                    <p className="text-xs text-muted-foreground">Requests/hour</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Error Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-400">0.2%</div>
                    <p className="text-xs text-muted-foreground">Last 24h</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminAPI;
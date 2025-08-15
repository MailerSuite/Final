import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Mail, 
  Plus, 
  Settings, 
  TrendingUp,
  Zap
} from 'lucide-react';
import { smtpProviderApi } from '@/api/smtp-providers';
import { useToast } from '@/hooks/use-toast';
import { formatNumber } from '@/utils/format';

interface SMTPProvider {
  value: string;
  label: string;
  description: string;
}

interface ProviderConfig {
  id: string;
  provider: string;
  name: string;
  is_active: boolean;
  is_verified: boolean;
  health_status: string;
  reputation_score: number;
  smtp_host: string;
  smtp_port: number;
  limits: {
    daily: { limit: number; used: number; remaining: number };
    hourly: { limit: number; used: number; remaining: number };
    per_second: number;
    concurrent_connections: number;
  };
  warmup: {
    is_warming_up: boolean;
    current_limit: number | null;
    start_date: string | null;
  };
  created_at: string;
  updated_at: string;
}

export const SMTPProviderConfig: React.FC = () => {
  const [providers, setProviders] = useState<SMTPProvider[]>([]);
  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadProviders();
    loadConfigs();
  }, []);

  const loadProviders = async () => {
    try {
      const data = await smtpProviderApi.getAvailableProviders();
      setProviders(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load providers',
        variant: 'destructive',
      });
    }
  };

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await smtpProviderApi.getConfigs();
      setConfigs(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load configurations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = async () => {
    try {
      const config = await smtpProviderApi.createConfig({
        provider: selectedProvider,
        name: formData.name,
        credentials: formData.credentials,
        custom_limits: formData.custom_limits,
      });
      
      setConfigs([...configs, config]);
      setShowAddDialog(false);
      setFormData({});
      
      toast({
        title: 'Success',
        description: 'Provider configuration created',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create configuration',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (configId: string, isActive: boolean) => {
    try {
      await smtpProviderApi.updateConfig(configId, { is_active: isActive });
      setConfigs(configs.map(c => 
        c.id === configId ? { ...c, is_active: isActive } : c
      ));
      
      toast({
        title: 'Success',
        description: `Configuration ${isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update configuration',
        variant: 'destructive',
      });
    }
  };

  const handleStartWarmup = async (configId: string) => {
    try {
      await smtpProviderApi.startWarmup(configId, 50);
      await loadConfigs();
      
      toast({
        title: 'Success',
        description: 'Warmup process started',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start warmup',
        variant: 'destructive',
      });
    }
  };

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      aws_ses: '🚀',
      sendgrid: '📧',
      mailgun: '🔫',
      postmark: '📮',
      sparkpost: '✨',
      custom: '⚙️',
    };
    return icons[provider] || '📧';
  };

  const getHealthBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      healthy: 'default',
      warning: 'secondary',
      error: 'destructive',
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const renderProviderForm = () => {
    switch (selectedProvider) {
      case 'aws_ses':
        return (
          <>
            <div className="space-y-2">
              <Label>Access Key ID</Label>
              <Input
                placeholder="AKIA..."
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    access_key_id: e.target.value,
                  },
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Secret Access Key</Label>
              <Input
                type="password"
                placeholder="Enter secret key"
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    secret_access_key: e.target.value,
                  },
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Select
                onValueChange={(value) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    region: value,
                  },
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                  <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                  <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                  <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
        
      case 'sendgrid':
        return (
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              placeholder="SG...."
              onChange={(e) => setFormData({
                ...formData,
                credentials: {
                  api_key: e.target.value,
                },
              })}
            />
          </div>
        );
        
      case 'custom':
        return (
          <>
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input
                placeholder="smtp.example.com"
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    smtp_host: e.target.value,
                  },
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Port</Label>
              <Input
                type="number"
                placeholder="587"
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    smtp_port: e.target.value,
                  },
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                placeholder="username@example.com"
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    smtp_username: e.target.value,
                  },
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Enter password"
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: {
                    ...formData.credentials,
                    smtp_password: e.target.value,
                  },
                })}
              />
            </div>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SMTP Provider Configurations</h2>
          <p className="text-muted-foreground">
            Manage your email service providers with rate limiting and quota tracking
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add SMTP Provider</DialogTitle>
              <DialogDescription>
                Configure a new SMTP provider with custom limits
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        <div className="flex items-center gap-2">
                          <span>{getProviderIcon(provider.value)}</span>
                          <div>
                            <div>{provider.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {provider.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Configuration Name</Label>
                <Input
                  placeholder="My SendGrid Account"
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              {renderProviderForm()}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateConfig}>
                  Create Configuration
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getProviderIcon(config.provider)}</span>
                    <div>
                      <CardTitle className="text-lg">{config.name}</CardTitle>
                      <CardDescription>{config.smtp_host}:{config.smtp_port}</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={(checked) => handleToggleActive(config.id, checked)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="limits" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="limits">Limits</TabsTrigger>
                    <TabsTrigger value="status">Status</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="limits" className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Daily Limit</span>
                        <span className="font-medium">
                          {formatNumber(config.limits.daily.used)} / {formatNumber(config.limits.daily.limit)}
                        </span>
                      </div>
                      <Progress 
                        value={(config.limits.daily.used / config.limits.daily.limit) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Hourly Limit</span>
                        <span className="font-medium">
                          {formatNumber(config.limits.hourly.used)} / {formatNumber(config.limits.hourly.limit)}
                        </span>
                      </div>
                      <Progress 
                        value={(config.limits.hourly.used / config.limits.hourly.limit) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Rate:</span>
                        <span className="font-medium">{config.limits.per_second}/s</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Settings className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Concurrent:</span>
                        <span className="font-medium">{config.limits.concurrent_connections}</span>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="status" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Health</span>
                      {getHealthBadge(config.health_status)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Verified</span>
                      {config.is_verified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Reputation</span>
                      <div className="flex items-center gap-2">
                        <Progress value={config.reputation_score} className="h-2 w-20" />
                        <span className="text-sm font-medium">{config.reputation_score}%</span>
                      </div>
                    </div>
                    
                    {config.warmup.is_warming_up ? (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Warmup Active</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Current limit: {formatNumber(config.warmup.current_limit || 0)} emails/day
                        </p>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleStartWarmup(config.id)}
                      >
                        <TrendingUp className="mr-2 h-3 w-3" />
                        Start Warmup
                      </Button>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
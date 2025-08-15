/**
 * SMTP Server Form Component
 * Comprehensive form for adding/editing SMTP server configurations
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Server,
  Lock,
  Settings,
  Shield,
  Zap,
  AlertTriangle,
  Info,
  Plus,
  Trash2,
  TestTube,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Network,
  Key,
  Mail,
  UserCheck,
  Globe,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { smtpApi } from '@/api/smtp-api';
import { cn } from '@/lib/utils';

interface SMTPServerFormData {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  security: 'none' | 'tls' | 'ssl' | 'starttls';
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  maxConnections?: number;
  connectionTimeout?: number;
  messageTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  dailyLimit?: number;
  hourlyLimit?: number;
  tags?: string[];
  notes?: string;
  authentication?: {
    method: 'plain' | 'login' | 'cram-md5' | 'oauth2';
    oauth2?: {
      clientId?: string;
      clientSecret?: string;
      refreshToken?: string;
    };
  };
  advanced?: {
    heloHostname?: string;
    localAddress?: string;
    dnsTimeout?: number;
    socketTimeout?: number;
    greetingTimeout?: number;
    ignoreTLS?: boolean;
    requireTLS?: boolean;
    opportunisticTLS?: boolean;
    disableFileAccess?: boolean;
    disableUrlAccess?: boolean;
  };
}

interface SMTPServerFormProps {
  sessionId: string;
  initialData?: Partial<SMTPServerFormData>;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

const DEFAULT_FORM_DATA: SMTPServerFormData = {
  name: '',
  host: '',
  port: 587,
  username: '',
  password: '',
  security: 'tls',
  maxConnections: 5,
  connectionTimeout: 30,
  messageTimeout: 300,
  retryAttempts: 3,
  retryDelay: 5,
  authentication: {
    method: 'plain',
  },
  tags: [],
};

const COMMON_PORTS = [
  { value: 25, label: '25 (SMTP)', security: 'none' },
  { value: 465, label: '465 (SMTPS)', security: 'ssl' },
  { value: 587, label: '587 (SMTP/TLS)', security: 'tls' },
  { value: 2525, label: '2525 (Alternative)', security: 'tls' },
];

const COMMON_PROVIDERS = [
  { name: 'Gmail', host: 'smtp.gmail.com', port: 587, security: 'tls' },
  { name: 'Outlook', host: 'smtp-mail.outlook.com', port: 587, security: 'starttls' },
  { name: 'Yahoo', host: 'smtp.mail.yahoo.com', port: 587, security: 'tls' },
  { name: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, security: 'tls' },
  { name: 'Mailgun', host: 'smtp.mailgun.org', port: 587, security: 'tls' },
  { name: 'Amazon SES', host: 'email-smtp.us-east-1.amazonaws.com', port: 587, security: 'tls' },
];

export default function SMTPServerForm({
  sessionId,
  initialData,
  onSuccess,
  onCancel,
}: SMTPServerFormProps) {
  const [formData, setFormData] = useState<SMTPServerFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Create or update mutation
  const saveMutation = useMutation({
    mutationFn: (data: SMTPServerFormData) => {
      if (initialData?.id) {
        return smtpApi.updateServer(sessionId, initialData.id, data);
      }
      return smtpApi.createServer(sessionId, data);
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: initialData?.id ? 'SMTP server updated' : 'SMTP server created',
      });
      onSuccess?.(data);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save SMTP server',
        variant: 'destructive',
      });
    },
  });

  // Test connection
  const testConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const result = await smtpApi.testConnection(sessionId, {
        host: formData.host,
        port: formData.port,
        username: formData.username,
        password: formData.password,
        security: formData.security,
      });

      setTestResult({
        success: result.success,
        message: result.message || (result.success ? 'Connection successful!' : 'Connection failed'),
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Connection test failed',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Server name is required';
    }
    if (!formData.host.trim()) {
      newErrors.host = 'Host is required';
    }
    if (!formData.port || formData.port < 1 || formData.port > 65535) {
      newErrors.port = 'Valid port number is required (1-65535)';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.password && !initialData?.id) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      saveMutation.mutate(formData);
    }
  };

  const handleProviderSelect = (provider: typeof COMMON_PROVIDERS[0]) => {
    setFormData(prev => ({
      ...prev,
      host: provider.host,
      port: provider.port,
      security: provider.security as any,
    }));
  };

  const handlePortChange = (port: number) => {
    const commonPort = COMMON_PORTS.find(p => p.value === port);
    setFormData(prev => ({
      ...prev,
      port,
      ...(commonPort && { security: commonPort.security as any }),
    }));
  };

  const handleTagAdd = (tag: string) => {
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }));
    }
  };

  const handleTagRemove = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || [],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          {/* Quick Setup */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <Label className="text-sm font-medium mb-2 block">Quick Setup</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_PROVIDERS.map(provider => (
                <Button
                  key={provider.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleProviderSelect(provider)}
                >
                  {provider.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Server Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Server Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Primary SMTP Server"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Host and Port */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">
                Host <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                  placeholder="smtp.example.com"
                  className={cn('pl-9', errors.host ? 'border-red-500' : '')}
                />
              </div>
              {errors.host && (
                <p className="text-sm text-red-500">{errors.host}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="port">
                Port <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.port.toString()}
                onValueChange={(value) => handlePortChange(parseInt(value))}
              >
                <SelectTrigger className={errors.port ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_PORTS.map(port => (
                    <SelectItem key={port.value} value={port.value.toString()}>
                      {port.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
              {errors.port && (
                <p className="text-sm text-red-500">{errors.port}</p>
              )}
            </div>
          </div>

          {/* Security */}
          <div className="space-y-2">
            <Label htmlFor="security">Security</Label>
            <Select
              value={formData.security}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, security: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    None (Not Recommended)
                  </div>
                </SelectItem>
                <SelectItem value="ssl">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    SSL/TLS
                  </div>
                </SelectItem>
                <SelectItem value="tls">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    STARTTLS
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* From Settings */}
          <Separator />
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Sender Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={formData.fromEmail || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, fromEmail: e.target.value }))}
                  placeholder="noreply@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  value={formData.fromName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, fromName: e.target.value }))}
                  placeholder="Your Company"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="replyTo">Reply-To Email</Label>
              <Input
                id="replyTo"
                type="email"
                value={formData.replyTo || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, replyTo: e.target.value }))}
                placeholder="support@example.com"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">
              Username <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="username@example.com"
                className={cn('pl-9', errors.username ? 'border-red-500' : '')}
              />
            </div>
            {errors.username && (
              <p className="text-sm text-red-500">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Password {!initialData?.id && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder={initialData?.id ? 'Leave blank to keep current' : 'Enter password'}
                className={cn('pl-9 pr-10', errors.password ? 'border-red-500' : '')}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Authentication Method */}
          <div className="space-y-2">
            <Label htmlFor="authMethod">Authentication Method</Label>
            <Select
              value={formData.authentication?.method || 'plain'}
              onValueChange={(value: any) => 
                setFormData(prev => ({
                  ...prev,
                  authentication: { ...prev.authentication, method: value }
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plain">PLAIN</SelectItem>
                <SelectItem value="login">LOGIN</SelectItem>
                <SelectItem value="cram-md5">CRAM-MD5</SelectItem>
                <SelectItem value="oauth2">OAuth 2.0</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* OAuth2 Settings */}
          {formData.authentication?.method === 'oauth2' && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-medium">OAuth 2.0 Settings</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={formData.authentication.oauth2?.clientId || ''}
                    onChange={(e) => 
                      setFormData(prev => ({
                        ...prev,
                        authentication: {
                          ...prev.authentication,
                          oauth2: {
                            ...prev.authentication?.oauth2,
                            clientId: e.target.value
                          }
                        }
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={formData.authentication.oauth2?.clientSecret || ''}
                    onChange={(e) => 
                      setFormData(prev => ({
                        ...prev,
                        authentication: {
                          ...prev.authentication,
                          oauth2: {
                            ...prev.authentication?.oauth2,
                            clientSecret: e.target.value
                          }
                        }
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Test Connection */}
          <Separator />
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={testConnection}
              disabled={isTestingConnection || !formData.host || !formData.username}
              className="w-full"
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>

            {testResult && (
              <Alert variant={testResult.success ? 'default' : 'destructive'}>
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          {/* Connection Limits */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Connection Limits</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxConnections">Max Connections</Label>
                <Input
                  id="maxConnections"
                  type="number"
                  min="1"
                  value={formData.maxConnections || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    maxConnections: parseInt(e.target.value) || undefined 
                  }))}
                  placeholder="5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="connectionTimeout">Connection Timeout (s)</Label>
                <Input
                  id="connectionTimeout"
                  type="number"
                  min="1"
                  value={formData.connectionTimeout || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    connectionTimeout: parseInt(e.target.value) || undefined 
                  }))}
                  placeholder="30"
                />
              </div>
            </div>
          </div>

          {/* Rate Limits */}
          <Separator />
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Rate Limits</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyLimit">Daily Limit</Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  min="0"
                  value={formData.dailyLimit || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    dailyLimit: parseInt(e.target.value) || undefined 
                  }))}
                  placeholder="10000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyLimit">Hourly Limit</Label>
                <Input
                  id="hourlyLimit"
                  type="number"
                  min="0"
                  value={formData.hourlyLimit || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    hourlyLimit: parseInt(e.target.value) || undefined 
                  }))}
                  placeholder="500"
                />
              </div>
            </div>
          </div>

          {/* Retry Settings */}
          <Separator />
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Retry Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retryAttempts">Retry Attempts</Label>
                <Input
                  id="retryAttempts"
                  type="number"
                  min="0"
                  value={formData.retryAttempts || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    retryAttempts: parseInt(e.target.value) || undefined 
                  }))}
                  placeholder="3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retryDelay">Retry Delay (s)</Label>
                <Input
                  id="retryDelay"
                  type="number"
                  min="0"
                  value={formData.retryDelay || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    retryDelay: parseInt(e.target.value) || undefined 
                  }))}
                  placeholder="5"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              Advanced settings are optional and should only be modified if you understand their implications.
            </AlertDescription>
          </Alert>

          {/* Advanced Network Settings */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="network">
              <AccordionTrigger>Network Settings</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="heloHostname">HELO/EHLO Hostname</Label>
                  <Input
                    id="heloHostname"
                    value={formData.advanced?.heloHostname || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      advanced: { ...prev.advanced, heloHostname: e.target.value }
                    }))}
                    placeholder="mail.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localAddress">Local Address</Label>
                  <Input
                    id="localAddress"
                    value={formData.advanced?.localAddress || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      advanced: { ...prev.advanced, localAddress: e.target.value }
                    }))}
                    placeholder="0.0.0.0"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="timeouts">
              <AccordionTrigger>Timeout Settings</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dnsTimeout">DNS Timeout (ms)</Label>
                    <Input
                      id="dnsTimeout"
                      type="number"
                      value={formData.advanced?.dnsTimeout || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        advanced: { ...prev.advanced, dnsTimeout: parseInt(e.target.value) || undefined }
                      }))}
                      placeholder="5000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="socketTimeout">Socket Timeout (ms)</Label>
                    <Input
                      id="socketTimeout"
                      type="number"
                      value={formData.advanced?.socketTimeout || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        advanced: { ...prev.advanced, socketTimeout: parseInt(e.target.value) || undefined }
                      }))}
                      placeholder="10000"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="security">
              <AccordionTrigger>Security Options</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="requireTLS">Require TLS</Label>
                    <Switch
                      id="requireTLS"
                      checked={formData.advanced?.requireTLS || false}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        advanced: { ...prev.advanced, requireTLS: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="opportunisticTLS">Opportunistic TLS</Label>
                    <Switch
                      id="opportunisticTLS"
                      checked={formData.advanced?.opportunisticTLS || false}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        advanced: { ...prev.advanced, opportunisticTLS: checked }
                      }))}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Tags */}
          <Separator />
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {formData.tags?.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleTagRemove(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <XCircle className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <Input
                placeholder="Add tag..."
                className="w-32"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTagAdd(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this SMTP server..."
              rows={3}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saveMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {initialData?.id ? 'Update' : 'Create'} Server
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
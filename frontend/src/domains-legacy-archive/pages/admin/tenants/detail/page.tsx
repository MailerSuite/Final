/**
 * Tenant Detail Page
 * Detailed view of a specific tenant with all information
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Edit, Save, Users, Mail, Calendar, 
  Globe, Settings, Activity, Shield, Database,
  ExternalLink, Copy, CheckCircle, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  custom_domain?: string;
  status: 'active' | 'trial' | 'suspended' | 'cancelled';
  user_count: number;
  email_count: number;
  created_at: string;
  trial_ends_at?: string;
  features: string[];
  brand_name?: string;
  primary_color?: string;
  logo_url?: string;
  user_limit: number;
  email_limit: number;
  db_name?: string;
  db_status?: string;
}

interface TenantUsage {
  metric_type: string;
  metric_value: number;
  metric_date: string;
  usage_metadata?: unknown;
}

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [usage, setUsage] = useState<TenantUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<unknown>({});

  useEffect(() => {
    if (id) {
      fetchTenant();
      fetchUsage();
    }
  }, [id]);

  const fetchTenant = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/tenant/${id}`);
      setTenant(response.data);
      setFormData(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load tenant details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async () => {
    try {
      const response = await axios.get(`/api/v1/tenant/${id}/usage`);
      setUsage(response.data);
    } catch (error) {
      console.error('Failed to load usage:', error);
    }
  };

  const handleSave = async () => {
    try {
      await axios.put(`/api/v1/tenant/${id}`, formData);
      setTenant({ ...tenant, ...formData });
      setEditing(false);
      toast({
        title: 'Success',
        description: 'Tenant updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update tenant',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case 'trial':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Trial</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Suspended</Badge>;
      case 'cancelled':
        return <Badge className="bg-muted/10 text-muted-foreground border-border/20">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDaysRemaining = (trialEndsAt: string) => {
    const endDate = new Date(trialEndsAt);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Domain copied to clipboard',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Tenant not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/tenants')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{tenant.name}</h1>
          <p className="text-muted-foreground">Tenant Details</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(tenant.status)}
          {editing ? (
            <>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  {editing ? (
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{tenant.name}</p>
                  )}
                </div>
                <div>
                  <Label>Brand Name</Label>
                  {editing ? (
                    <Input
                      value={formData.brand_name || ''}
                      onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{tenant.brand_name || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <Label>Subdomain</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono">{tenant.subdomain}.sgpt.dev</p>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(`${tenant.subdomain}.sgpt.dev`)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Custom Domain</Label>
                  {editing ? (
                    <Input
                      value={formData.custom_domain || ''}
                      onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                      placeholder="app.company.com"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono">{tenant.custom_domain || 'Not set'}</p>
                      {tenant.custom_domain && (
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(tenant.custom_domain!)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Primary Color</Label>
                  {editing ? (
                    <Input
                      value={formData.primary_color || ''}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      placeholder="#3B82F6"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: tenant.primary_color || '#3B82F6' }}
                      />
                      <p className="text-sm font-mono">{tenant.primary_color || '#3B82F6'}</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Status</Label>
                  {editing ? (
                    <select
                      value={formData.status || tenant.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="trial">Trial</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      {getStatusBadge(tenant.status)}
                      {tenant.status === 'trial' && tenant.trial_ends_at && (
                        <span className="text-sm text-muted-foreground">
                          {getDaysRemaining(tenant.trial_ends_at)} days left
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Features & Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Enabled Features</Label>
                  <div className="mt-2 space-y-1">
                    {tenant.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="mr-1 mb-1">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>User Limit</Label>
                    <p className="text-sm">{tenant.user_count} / {tenant.user_limit}</p>
                  </div>
                  <div>
                    <Label>Email Limit (Monthly)</Label>
                    <p className="text-sm">{tenant.email_count} / {tenant.email_limit}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{tenant.user_count}</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{tenant.email_count}</div>
                  <div className="text-sm text-muted-foreground">Emails Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{tenant.features.length}</div>
                  <div className="text-sm text-muted-foreground">Features</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Tenant
              </Button>
              <Button className="w-full" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
              <Button className="w-full" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
              <Button className="w-full" variant="outline">
                <Database className="w-4 h-4 mr-2" />
                Database
              </Button>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Database</Label>
                <p className="text-sm font-mono">{tenant.db_name || 'sgpt_tenant_' + tenant.subdomain}</p>
              </div>
              <div>
                <Label>Database Status</Label>
                <div className="flex items-center gap-2">
                  {tenant.db_status === 'ready' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-sm">{tenant.db_status || 'pending'}</span>
                </div>
              </div>
              <div>
                <Label>Created</Label>
                <p className="text-sm">{format(new Date(tenant.created_at), 'MMM d, yyyy')}</p>
              </div>
              {tenant.trial_ends_at && (
                <div>
                  <Label>Trial Ends</Label>
                  <p className="text-sm">{format(new Date(tenant.trial_ends_at), 'MMM d, yyyy')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Domain Status */}
          <Card>
            <CardHeader>
              <CardTitle>Domain Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-mono">{tenant.subdomain}.sgpt.dev</span>
                </div>
              </div>
              {tenant.custom_domain && (
                <div>
                  <Label>Custom Domain</Label>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-mono">{tenant.custom_domain}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
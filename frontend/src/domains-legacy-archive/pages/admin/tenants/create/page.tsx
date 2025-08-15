/**
 * Create Tenant Page
 * Form to create new tenants
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Save, Users, Mail, Globe, Settings,
  CheckCircle, AlertCircle, Info
} from 'lucide-react';
import axios from 'axios';

interface CreateTenantForm {
  name: string;
  subdomain: string;
  brand_name?: string;
  primary_color?: string;
  custom_domain?: string;
  status: 'trial' | 'active';
  features: string[];
  user_limit: number;
  email_limit: number;
}

const availableFeatures = [
  { id: 'email_campaigns', name: 'Email Campaigns', description: 'Create and send email campaigns' },
  { id: 'analytics', name: 'Analytics & Reporting', description: 'Advanced analytics and reporting' },
  { id: 'templates', name: 'Email Templates', description: 'Professional email templates' },
  { id: 'ai_content', name: 'AI Content Generation', description: 'AI-powered content generation' },
  { id: 'automation', name: 'Workflow Automation', description: 'Automated email workflows' },
  { id: 'webhooks', name: 'Webhooks', description: 'Real-time event notifications' },
  { id: 'api_access', name: 'API Access', description: 'REST API access' },
  { id: 'white_label', name: 'White Label', description: 'Custom branding options' }
];

export default function CreateTenant() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTenantForm>({
    name: '',
    subdomain: '',
    brand_name: '',
    primary_color: '#3B82F6',
    custom_domain: '',
    status: 'trial',
    features: ['email_campaigns', 'analytics'],
    user_limit: 5,
    email_limit: 1000
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.subdomain) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    // Validate subdomain
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?$/;
    if (!subdomainRegex.test(formData.subdomain)) {
      toast({
        title: 'Error',
        description: 'Subdomain must be lowercase letters, numbers, and hyphens only',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/v1/tenant/', formData);
      
      toast({
        title: 'Success',
        description: 'Tenant created successfully',
      });

      // Navigate to the new tenant's detail page
      navigate(`/admin/tenants/${response.data.id}`);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create tenant',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId]
    }));
  };

  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain) return;
    
    try {
      await axios.get(`/api/v1/tenant/check-subdomain/${subdomain}`);
      return true; // Available
    } catch (error) {
      return false; // Not available
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/tenants')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Tenant</h1>
          <p className="text-muted-foreground">Set up a new client tenant</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Acme Corporation"
                  required
                />
              </div>

              <div>
                <Label htmlFor="subdomain">Subdomain *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                    placeholder="acme"
                    required
                  />
                  <span className="text-sm text-muted-foreground">.sgpt.dev</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Only lowercase letters, numbers, and hyphens allowed
                </p>
              </div>

              <div>
                <Label htmlFor="brand_name">Brand Name</Label>
                <Input
                  id="brand_name"
                  value={formData.brand_name}
                  onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                  placeholder="Acme"
                />
              </div>

              <div>
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="custom_domain">Custom Domain</Label>
                <Input
                  id="custom_domain"
                  value={formData.custom_domain}
                  onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                  placeholder="app.acme.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional. Will be configured after tenant creation
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings & Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'trial' | 'active' })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                </select>
              </div>

              <div>
                <Label htmlFor="user_limit">User Limit</Label>
                <Input
                  id="user_limit"
                  type="number"
                  value={formData.user_limit}
                  onChange={(e) => setFormData({ ...formData, user_limit: parseInt(e.target.value) })}
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <Label htmlFor="email_limit">Monthly Email Limit</Label>
                <Input
                  id="email_limit"
                  type="number"
                  value={formData.email_limit}
                  onChange={(e) => setFormData({ ...formData, email_limit: parseInt(e.target.value) })}
                  min="100"
                  max="1000000"
                />
              </div>

              <div>
                <Label>Features</Label>
                <div className="space-y-2 mt-2">
                  {availableFeatures.map((feature) => (
                    <div key={feature.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature.id}
                        checked={formData.features.includes(feature.id)}
                        onCheckedChange={() => handleFeatureToggle(feature.id)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={feature.id} className="text-sm font-medium">
                          {feature.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Globe className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-semibold">Domain</h3>
                <p className="text-sm text-muted-foreground">{formData.subdomain}.sgpt.dev</p>
                {formData.custom_domain && (
                  <p className="text-sm text-blue-600">{formData.custom_domain}</p>
                )}
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Users className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-semibold">Users</h3>
                <p className="text-sm text-muted-foreground">Up to {formData.user_limit} users</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Mail className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <h3 className="font-semibold">Emails</h3>
                <p className="text-sm text-muted-foreground">{formData.email_limit.toLocaleString()} per month</p>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Features ({formData.features.length})</h4>
              <div className="flex flex-wrap gap-2">
                {formData.features.map(featureId => {
                  const feature = availableFeatures.find(f => f.id === featureId);
                  return (
                    <span key={featureId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {feature?.name}
                    </span>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => navigate('/admin/tenants')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Tenant
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 
/**
 * Tenant Management Page
 * Manage all client tenants and their domains
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Plus, Search, Globe, Settings, 
  Users, Calendar, CheckCircle, XCircle 
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  custom_domain?: string;
  status: 'active' | 'suspended' | 'trial';
  user_count: number;
  created_at: string;
  trial_ends_at?: string;
  settings: {
    brand_name?: string;
    primary_color?: string;
    features: string[];
  };
}

export default function AdminTenants() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/admin/tenants');
      setTenants(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load tenants',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.custom_domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case 'trial':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Trial</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tenant Management</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Tenant
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, subdomain, or custom domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {tenants.filter(t => t.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Trial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {tenants.filter(t => t.status === 'trial').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.reduce((sum, t) => sum + t.user_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants List */}
      <Card>
        <CardHeader>
          <CardTitle>Tenants ({filteredTenants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Tenant</th>
                  <th className="text-left py-3 px-4">Domain</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Users</th>
                  <th className="text-left py-3 px-4">Created</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b hover:bg-muted dark:hover:bg-card">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        {tenant.settings.brand_name && (
                          <div className="text-sm text-muted-foreground">
                            Brand: {tenant.settings.brand_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-sm">
                            {tenant.subdomain}.sgpt.app
                          </span>
                        </div>
                        {tenant.custom_domain && (
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-500" />
                            <span className="font-mono text-sm text-blue-600">
                              {tenant.custom_domain}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(tenant.status)}
                      {tenant.status === 'trial' && tenant.trial_ends_at && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Ends {format(new Date(tenant.trial_ends_at), 'MMM d')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{tenant.user_count}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(tenant.created_at), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Settings className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`https://${tenant.subdomain}.sgpt.app`, '_blank')}
                        >
                          Visit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTenants.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No tenants found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
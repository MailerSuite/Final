/**
 * Tenant Overview Page
 * Dashboard view of all tenants with key metrics
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, Mail, Calendar, TrendingUp, Plus, Search, 
  Filter, MoreHorizontal, Eye, Edit, Trash2 
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
}

interface TenantStats {
  total_tenants: number;
  active_tenants: number;
  trial_tenants: number;
  suspended_tenants: number;
  total_users: number;
  total_emails: number;
  growth_rate: number;
}

export default function TenantOverview() {
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchTenants();
    fetchStats();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/tenant/');
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

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/v1/tenant/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tenant Management</h1>
          <p className="text-muted-foreground">Manage all client tenants and their domains</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Tenant
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_tenants}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.growth_rate}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {stats.active_tenants}
              </div>
              <p className="text-xs text-muted-foreground">
                {((stats.active_tenants / stats.total_tenants) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Trial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {stats.trial_tenants}
              </div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_users}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all tenants
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

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
                  <th className="text-left py-3 px-4">Emails</th>
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
                        {tenant.brand_name && (
                          <div className="text-sm text-muted-foreground">
                            Brand: {tenant.brand_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {tenant.subdomain}.sgpt.dev
                          </span>
                        </div>
                        {tenant.custom_domain && (
                          <div className="flex items-center gap-2">
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
                          {getDaysRemaining(tenant.trial_ends_at)} days left
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
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{tenant.email_count}</span>
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
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="w-4 h-4" />
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
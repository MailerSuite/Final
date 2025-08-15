/**
 * Landing Page Leads Management
 * View and manage leads captured from the landing page
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Download, Search, Mail, Phone, Building, 
  Calendar, CheckCircle, XCircle, Filter 
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

interface LandingLead {
  id: string;
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  source: string;
  created_at: string;
  converted_to_user: boolean;
}

export default function AdminLandingLeads() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LandingLead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<LandingLead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [showConverted, setShowConverted] = useState<'all' | 'converted' | 'not-converted'>('all');

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, filterSource, showConverted]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/admin/landing/leads');
      setLeads(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load leads',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Source filter
    if (filterSource !== 'all') {
      filtered = filtered.filter(lead => lead.source === filterSource);
    }

    // Conversion filter
    if (showConverted !== 'all') {
      filtered = filtered.filter(lead => 
        showConverted === 'converted' ? lead.converted_to_user : !lead.converted_to_user
      );
    }

    setFilteredLeads(filtered);
  };

  const exportLeads = async () => {
    try {
      const response = await axios.get('/api/v1/admin/landing/leads/export', {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `landing_leads_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: 'Success',
        description: 'Leads exported successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export leads',
        variant: 'destructive'
      });
    }
  };

  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case 'newsletter':
        return 'secondary';
      case 'contact_form':
        return 'default';
      case 'demo_request':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'newsletter':
        return 'Newsletter';
      case 'contact_form':
        return 'Contact Form';
      case 'demo_request':
        return 'Demo Request';
      default:
        return source;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const stats = {
    total: leads.length,
    converted: leads.filter(l => l.converted_to_user).length,
    newsletter: leads.filter(l => l.source === 'newsletter').length,
    contact: leads.filter(l => l.source === 'contact_form').length,
    demo: leads.filter(l => l.source === 'demo_request').length,
  };

  const conversionRate = stats.total > 0 ? (stats.converted / stats.total * 100).toFixed(1) : '0';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Landing Page Leads</h1>
        <Button onClick={exportLeads}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.converted}</div>
            <p className="text-xs text-muted-foreground">{conversionRate}% rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Newsletter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newsletter}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Contact Form</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contact}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Demo Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.demo}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by email, name, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              className="px-3 py-2 border rounded-md"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
            >
              <option value="all">All Sources</option>
              <option value="newsletter">Newsletter</option>
              <option value="contact_form">Contact Form</option>
              <option value="demo_request">Demo Request</option>
            </select>

            <select
              className="px-3 py-2 border rounded-md"
              value={showConverted}
              onChange={(e) => setShowConverted(e.target.value as any)}
            >
              <option value="all">All Leads</option>
              <option value="converted">Converted Only</option>
              <option value="not-converted">Not Converted</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Company</th>
                  <th className="text-left py-3 px-4">Phone</th>
                  <th className="text-left py-3 px-4">Source</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b hover:bg-muted dark:hover:bg-card">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{lead.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {lead.name || '-'}
                    </td>
                    <td className="py-3 px-4">
                      {lead.company ? (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          {lead.company}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {lead.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {lead.phone}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getSourceBadgeVariant(lead.source)}>
                        {getSourceLabel(lead.source)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(lead.created_at), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {lead.converted_to_user ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Converted</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">Pending</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredLeads.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No leads found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
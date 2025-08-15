/**
 * Landing Page Analytics
 * View analytics and performance metrics for the landing page
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, TrendingUp, Users, MousePointer, Target,
  Calendar, BarChart3, Activity, Globe
} from 'lucide-react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsSummary {
  total_leads: number;
  converted_leads: number;
  conversion_rate: number;
  page_views_30d: number;
  sources: {
    newsletter: number;
    contact_form: number;
    demo_request: number;
  };
}

export default function AdminLandingAnalytics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/admin/landing/analytics/summary');
      setSummary(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Mock data for charts - in production, this would come from the API
  const conversionTrend = [
    { date: 'Jan 1', conversions: 12, views: 450 },
    { date: 'Jan 8', conversions: 19, views: 520 },
    { date: 'Jan 15', conversions: 15, views: 480 },
    { date: 'Jan 22', conversions: 25, views: 680 },
    { date: 'Jan 29', conversions: 22, views: 610 },
  ];

  const sourceBreakdown = [
    { name: 'Newsletter', value: summary.sources.newsletter, percentage: (summary.sources.newsletter / summary.total_leads * 100).toFixed(1) },
    { name: 'Contact Form', value: summary.sources.contact_form, percentage: (summary.sources.contact_form / summary.total_leads * 100).toFixed(1) },
    { name: 'Demo Request', value: summary.sources.demo_request, percentage: (summary.sources.demo_request / summary.total_leads * 100).toFixed(1) },
  ];

  const deviceBreakdown = [
    { device: 'Desktop', sessions: 2840, percentage: 68 },
    { device: 'Mobile', sessions: 1120, percentage: 27 },
    { device: 'Tablet', sessions: 210, percentage: 5 },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Landing Page Analytics</h1>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <select
            className="px-3 py-2 border rounded-md"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.page_views_30d.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_leads}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.2%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.conversion_rate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.converted_leads}</div>
            <p className="text-xs text-muted-foreground">
              From {summary.total_leads} total leads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="conversions"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Conversions"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="views"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Page Views"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sourceBreakdown.map((source) => (
                <div key={source.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="font-medium">{source.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{source.value} leads</Badge>
                    <span className="text-sm text-muted-foreground">{source.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deviceBreakdown.map((device) => (
                <div key={device.device} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{device.device}</span>
                    <span className="text-sm text-muted-foreground">{device.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${device.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {device.sessions.toLocaleString()} sessions
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">2.3s</div>
              <p className="text-sm text-muted-foreground mt-1">Avg. Page Load Time</p>
              <Badge variant="outline" className="mt-2">Excellent</Badge>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">1.8%</div>
              <p className="text-sm text-muted-foreground mt-1">Bounce Rate</p>
              <Badge variant="outline" className="mt-2">Very Good</Badge>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">4:32</div>
              <p className="text-sm text-muted-foreground mt-1">Avg. Time on Page</p>
              <Badge variant="outline" className="mt-2">Above Average</Badge>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">87%</div>
              <p className="text-sm text-muted-foreground mt-1">Scroll Depth</p>
              <Badge variant="outline" className="mt-2">High Engagement</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Referrers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { source: 'Google Search', visits: 1234, percentage: 45 },
              { source: 'Direct Traffic', visits: 876, percentage: 32 },
              { source: 'Social Media', visits: 432, percentage: 16 },
              { source: 'Email Campaign', visits: 198, percentage: 7 },
            ].map((referrer) => (
              <div key={referrer.source} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted dark:hover:bg-card">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{referrer.source}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{referrer.visits} visits</span>
                  <Badge variant="secondary">{referrer.percentage}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
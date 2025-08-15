import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useSessionStore from '@/store/session';
import axiosInstance from '@/http/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageWrapper from '@/components/layout/PageWrapper';
import ResponsiveGrid from '@/components/layout/ResponsiveGrid';
import { 
  Activity, 
  Settings, 
  BarChart, 
  RefreshCw, 
  AlertTriangle,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';

interface PerformanceData {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface PerformanceResponse {
  data: PerformanceData[];
  total: number;
  skip: number;
  limit: number;
}

const PerformancePage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSessionStore();
  
  // State
  const [data, setData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('');
  
  // Pagination
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const LIMIT = 10;
  
  const currentPage = Math.floor(skip / LIMIT) + 1;
  const totalPages = Math.ceil(total / LIMIT);

  // Fetch data
  const fetchData = useCallback(async (searchQuery?: string, statusFilter?: string, offset = 0) => {
    if (!session?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        limit: LIMIT.toString(),
        skip: offset.toString(),
      });
      
      if (searchQuery?.trim()) params.append('search', searchQuery.trim());
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await axiosInstance.get<PerformanceResponse>(
        `/api/v1/performance?${params}`
      );
      
      setData(response.data.data || []);
      setTotal(response.data.total || 0);
      setSkip(offset);
    } catch (err: any) {
      console.error('Error fetching performance data:', err);
      setError(err.response?.data?.message || 'Failed to fetch performance data');
      toast.error('Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  }, [session?.id]);

  // Refresh data
  const refreshData = () => {
    fetchData(searchTerm, status, skip);
    setLastRefresh(new Date());
  };

  // Handle search
  const handleSearch = () => {
    fetchData(searchTerm, status, 0);
  };

  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    fetchData(searchTerm, newStatus, 0);
  };

  // Handle pagination
  const handlePageChange = (direction: 'prev' | 'next') => {
    const newSkip = direction === 'prev' ? Math.max(0, skip - LIMIT) : skip + LIMIT;
    fetchData(searchTerm, status, newSkip);
  };

  // Load data on mount
  useEffect(() => {
    if (session?.id) {
      fetchData();
    }
  }, [session?.id, fetchData]);

  // Calculate stats
  const stats = {
    total: data.length,
    active: data.filter(item => item.status === 'active').length,
    inactive: data.filter(item => item.status !== 'active').length,
  };

  if (!session?.id) {
    return (
      <PageWrapper title="Performance">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access Performance.
          </AlertDescription>
        </Alert>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Performance">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Performance</h1>
            <p className="text-muted-foreground">
              Manage and monitor performance operations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={refreshData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <ResponsiveGrid cols={{ sm: 1, md: 3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                All performance items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </ResponsiveGrid>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search performance..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
                <Button onClick={handleSearch} variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-8">
                <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No performance data available
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get started by creating your first performance item.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">ID: {item.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {skip + 1} to {Math.min(skip + LIMIT, total)} of {total} results
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange('prev')}
                disabled={skip === 0}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange('next')}
                disabled={skip + LIMIT >= total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default PerformancePage;
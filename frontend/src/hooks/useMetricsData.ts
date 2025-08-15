/**
 * System Health and Metrics Hook
 * Simple wrapper for system health checking
 */

import { useState, useEffect, useCallback } from 'react';

interface SystemHealthState {
  isHealthy: boolean;
  loading: boolean;
  error: string | null;
  lastCheck: Date | null;
}

export const useSystemHealth = () => {
  const [state, setState] = useState<SystemHealthState>({
    isHealthy: true,
    loading: false,
    error: null,
    lastCheck: null,
  });

  const checkHealth = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simple health check through Vite proxy or backend dev server
      const response = await fetch('/health');
      const isHealthy = response.ok;
      
      setState({
        isHealthy,
        loading: false,
        error: null,
        lastCheck: new Date(),
      });
    } catch (error) {
      setState({
        isHealthy: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        lastCheck: new Date(),
      });
    }
  }, []);

  useEffect(() => {
    // Initial health check
    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    ...state,
    checkHealth,
  };
};

// Mock realtime metrics hook for development
interface MetricsData {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  activeConnections: number;
  emailsSent: number;
  emailsDelivered: number;
  bounceRate: number;
}

interface RealtimeMetricsOptions {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

// Mock admin dashboard hook for development
export const useAdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 245,
    activeUsers: 189,
    totalCampaigns: 42,
    activeCampaigns: 12,
    emailsSentToday: 1247,
    deliveryRate: 95.3,
    bounceRate: 4.7,
    systemHealth: 'healthy' as const,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      // Mock data would be fetched here
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    data: dashboardData,
    loading,
    error,
    refresh: refreshData,
  };
};

export const useRealtimeMetrics = (options: RealtimeMetricsOptions = {}) => {
  const [metrics, setMetrics] = useState<MetricsData>({
    cpu: 45,
    memory: 62,
    disk: 38,
    network: 23,
    activeConnections: 156,
    emailsSent: 1247,
    emailsDelivered: 1189,
    bounceRate: 4.6,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate some realistic variations
      setMetrics({
        cpu: Math.max(10, Math.min(90, 45 + (Math.random() - 0.5) * 20)),
        memory: Math.max(20, Math.min(85, 62 + (Math.random() - 0.5) * 15)),
        disk: Math.max(10, Math.min(70, 38 + (Math.random() - 0.5) * 10)),
        network: Math.max(5, Math.min(50, 23 + (Math.random() - 0.5) * 15)),
        activeConnections: Math.max(50, Math.min(300, 156 + Math.floor((Math.random() - 0.5) * 50))),
        emailsSent: Math.max(1000, 1247 + Math.floor((Math.random() - 0.5) * 100)),
        emailsDelivered: Math.max(900, 1189 + Math.floor((Math.random() - 0.5) * 80)),
        bounceRate: Math.max(1, Math.min(8, 4.6 + (Math.random() - 0.5) * 2)),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (options.autoRefresh) {
      fetchMetrics();
      
      if (options.refreshInterval) {
        const interval = setInterval(fetchMetrics, options.refreshInterval);
        return () => clearInterval(interval);
      }
    }
  }, [fetchMetrics, options.autoRefresh, options.refreshInterval]);

  return {
    metrics,
    loading,
    error,
    refetch,
  };
};

// Metrics data hook for dashboard components
export const useMetricsData = () => {
  const [healthData, setHealthData] = useState<unknown>(null);
  const [systemData, setSystemData] = useState<unknown>(null);
  const [performanceData, setPerformanceData] = useState<unknown>(null);
  const [realtimeData, setRealtimeData] = useState<unknown>(null);
  const [analyticsData, setAnalyticsData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMetrics, setHasMetrics] = useState(true);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/v1/metrics/admin/overview');
      if (!response.ok) {
        setHasMetrics(false);
        return;
      }
      const data = await response.json();
      setHealthData(data);
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      setHasMetrics(false);
      // Set fallback data
      setHealthData({
        system_overview: {
          cpu_usage: 25,
          memory_usage: 45,
          disk_usage: 68.5,
          active_users: 156,
          total_users: 1245
        },
        service_status: {
          api_server: { status: 'healthy', response_time: 45 },
          database: { status: 'healthy', connections: 12 }
        }
      });
    }
  };

  const fetchSystem = async () => {
    try {
      const response = await fetch('/api/v1/metrics/admin/overview');
      if (!response.ok) {
        setHasMetrics(false);
        return;
      }
      const data = await response.json();
      setSystemData(data);
    } catch (error) {
      console.error('Failed to fetch system data:', error);
      setHasMetrics(false);
      // Set fallback data
      setSystemData({
        system_overview: {
          cpu_usage: 25,
          memory_usage: 45,
          disk_usage: 68.5
        }
      });
    }
  };

  const fetchPerformance = async (period: string = '1h') => {
    try {
      const response = await fetch(`/api/v1/metrics/admin/overview`);
      if (!response.ok) {
        setHasMetrics(false);
        return;
      }
      const data = await response.json();
      setPerformanceData(data);
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
      setHasMetrics(false);
      // Set fallback data
      setPerformanceData({
        performance: {
          avg_response_time: 125,
          requests_per_hour: 15600,
          error_rate: 0.15,
          cache_hit_rate: 94.5
        }
      });
    }
  };

  const fetchRealtime = async () => {
    try {
      const response = await fetch('/api/v1/metrics/admin/overview');
      if (!response.ok) {
        setHasMetrics(false);
        return;
      }
      const data = await response.json();
      setRealtimeData(data);
    } catch (error) {
      console.error('Failed to fetch realtime data:', error);
      setHasMetrics(false);
      // Set fallback data
      setRealtimeData({
        system_overview: {
          cpu_usage: 25,
          memory_usage: 45,
          active_users: 156
        }
      });
    }
  };

  const fetchAnalytics = async (period: string = '24h') => {
    try {
      const response = await fetch('/api/v1/metrics/admin/overview');
      if (!response.ok) {
        setHasMetrics(false);
        return;
      }
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setHasMetrics(false);
      // Set fallback data
      setAnalyticsData({
        business_metrics: {
          campaigns_today: 45,
          emails_sent_today: 125600,
          revenue_today: 2450.00,
          active_subscriptions: 890
        }
      });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchHealth(),
        fetchSystem(),
        fetchPerformance(),
        fetchRealtime(),
        fetchAnalytics()
      ]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch metrics data');
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    await fetchData();
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    healthData,
    systemData,
    performanceData,
    realtimeData,
    analyticsData,
    loading,
    error,
    hasMetrics,
    refreshAll,
    fetchHealth,
    fetchSystem,
    fetchPerformance,
    fetchRealtime,
    fetchAnalytics
  };
};

export default useSystemHealth;
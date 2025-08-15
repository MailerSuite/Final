import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/http/stable-api-client';
import { createWebSocket } from '@/utils/websocket';

interface DashboardData {
  time_period: string;
  data_range: {
    start_time: string;
    end_time: string;
  };
  overview: {
    total_jobs: number;
    total_checks: number;
    total_valid: number;
    total_invalid: number;
    total_errors: number;
    overall_success_rate: number;
    overall_speed: number;
    smtp: {
      jobs: number;
      checks: number;
      success_rate: number;
    };
    imap: {
      jobs: number;
      checks: number;
      success_rate: number;
    };
    performance_distribution: Record<string, number>;
  };
  performance_trends: Array<{
    timestamp: string;
    success_rate: number;
    throughput: number;
    error_rate: number;
    active_jobs: number;
  }>;
  session_insights: Array<{
    session_id: string;
    performance_tier: string;
    total_checks: number;
    success_rate: number;
    recommendations: string[];
    trends: Array<{
      timestamp: string;
      success_rate: number;
      throughput: number;
      error_rate: number;
      active_jobs: number;
    }>;
  }>;
  error_analysis: {
    total_errors: number;
    error_breakdown: {
      authentication: number;
      connection: number;
      timeout: number;
      proxy: number;
    };
    error_patterns: Record<string, number>;
    top_error_categories: Array<{
      category: string;
      count: number;
    }>;
  };
  proxy_health: {
    active_proxies: number;
    jobs_using_proxies: number;
    average_proxy_success_rate: number;
    proxy_health: string;
  };
  system_health: {
    overall_health: string;
    success_rate_trend: string;
    throughput_trend: string;
    top_error_categories: Array<{
      category: string;
      count: number;
    }>;
    proxy_health: {
      active_proxies: number;
      proxy_health: string;
    };
    recommendations: string[];
  };
  top_performers: Array<{
    session_id: string;
    success_rate: number;
    speed: number;
    total_checks: number;
    total_jobs: number;
    performance_tier: string;
  }>;
  recommendations: string[];
  last_updated: string;
}

interface UseBulkAnalyticsOptions {
  refreshInterval?: number;
  enableRealtime?: boolean;
  cacheTimeout?: number;
}

interface UseBulkAnalyticsReturn {
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  exportData: (format: 'csv' | 'json' | 'pdf') => Promise<void>;
  clearCache: () => void;
  lastUpdated: Date | null;
}

const CACHE_KEY = 'bulk_analytics_cache';
const DEFAULT_CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const useBulkAnalytics = (
  sessionId?: string,
  timePeriod: string = '24h',
  options: UseBulkAnalyticsOptions = {}
): UseBulkAnalyticsReturn => {
  const {
    refreshInterval = 30000, // 30 seconds
    enableRealtime = true,
    cacheTimeout = DEFAULT_CACHE_TIMEOUT
  } = options;

  // State management
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Cache management
  const getCacheKey = useCallback(() => {
    return `${CACHE_KEY}_${sessionId || 'all'}_${timePeriod}`;
  }, [sessionId, timePeriod]);

  const getCachedData = useCallback((): DashboardData | null => {
    try {
      const cached = localStorage.getItem(getCacheKey());
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age > cacheTimeout) {
        localStorage.removeItem(getCacheKey());
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error reading cache:', err);
      return null;
    }
  }, [getCacheKey, cacheTimeout]);

  const setCachedData = useCallback((data: DashboardData) => {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(getCacheKey(), JSON.stringify(cacheEntry));
    } catch (err) {
      console.error('Error writing cache:', err);
    }
  }, [getCacheKey]);

  const clearCache = useCallback(() => {
    try {
      // Clear specific cache
      localStorage.removeItem(getCacheKey());

      // Clear all bulk analytics caches
      Object.keys(localStorage)
        .filter(key => key.startsWith(CACHE_KEY))
        .forEach(key => localStorage.removeItem(key));
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  }, [getCacheKey]);

  // API functions
  const fetchDashboardData = useCallback(async (): Promise<DashboardData> => {
    const params = new URLSearchParams({
      time_period: timePeriod
    });

    if (sessionId) {
      params.append('session_id', sessionId);
    }

    const response = await apiClient.get(`/bulk-checker/analytics/dashboard?${params}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch analytics data');
    }

    return response.data.data;
  }, [sessionId, timePeriod]);

  // Main data refresh function
  const refreshData = useCallback(async (useCache: boolean = true) => {
    try {
      setError(null);

      // Try cache first if enabled
      if (useCache) {
        const cached = getCachedData();
        if (cached) {
          setDashboardData(cached);
          setLastUpdated(new Date());
          return;
        }
      }

      setLoading(true);
      const data = await fetchDashboardData();

      setDashboardData(data);
      setLastUpdated(new Date());
      setCachedData(data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardData, getCachedData, setCachedData]);

  // Export functionality
  const exportData = useCallback(async (format: 'csv' | 'json' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        time_period: timePeriod,
        format
      });

      if (sessionId) {
        params.append('session_id', sessionId);
      }

      const response = await apiClient.get(
        `/bulk-checker/analytics/export?${params}`,
        {
          responseType: 'blob'
        }
      );

      // Create download link
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' :
          format === 'json' ? 'application/json' :
            'application/pdf'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bulk-checker-analytics-${timePeriod}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error exporting data:', err);
      throw new Error('Failed to export analytics data');
    }
  }, [sessionId, timePeriod]);

  // Initial data load and cache check
  useEffect(() => {
    refreshData(true);
  }, [refreshData]);

  // Real-time updates
  useEffect(() => {
    if (!enableRealtime || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      refreshData(false); // Skip cache for real-time updates
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enableRealtime, refreshInterval, refreshData]);

  // WebSocket connection for real-time updates (if available)
  useEffect(() => {
    if (!enableRealtime) return;

    let ws: WebSocket | null = null;

    const connectWebSocket = () => {
      try {
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
        ws = createWebSocket(wsUrl);

        ws.onopen = () => {
          console.log('Analytics WebSocket connected');
          // Subscribe to analytics updates
          ws?.send(JSON.stringify({
            type: 'subscribe',
            channel: 'bulk_checker_analytics',
            session_id: sessionId
          }));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === 'bulk_checker_progress' ||
              message.type === 'analytics_update') {
              // Refresh data when we get updates
              refreshData(false);
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.onclose = () => {
          console.log('Analytics WebSocket disconnected');
          // Attempt to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (error) => {
          console.error('Analytics WebSocket error:', error);
        };

      } catch (err) {
        console.error('Error connecting to WebSocket:', err);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [enableRealtime, sessionId, refreshData]);

  // Clean up cache on component unmount
  useEffect(() => {
    return () => {
      // Optionally clean up old cache entries
      const cleanupOldCache = () => {
        try {
          Object.keys(localStorage)
            .filter(key => key.startsWith(CACHE_KEY))
            .forEach(key => {
              try {
                const { timestamp } = JSON.parse(localStorage.getItem(key) || '{}');
                const age = Date.now() - (timestamp || 0);
                if (age > cacheTimeout * 2) { // Clean entries twice as old as timeout
                  localStorage.removeItem(key);
                }
              } catch {
                localStorage.removeItem(key); // Remove invalid entries
              }
            });
        } catch (err) {
          console.error('Error cleaning cache:', err);
        }
      };

      cleanupOldCache();
    };
  }, [cacheTimeout]);

  return {
    dashboardData,
    loading,
    error,
    refreshData: () => refreshData(false),
    exportData,
    clearCache,
    lastUpdated
  };
}; 
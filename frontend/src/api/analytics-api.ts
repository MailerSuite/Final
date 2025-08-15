import axiosInstance from '@/http/axios';

// Types for Analytics API responses
export interface SystemHealthData {
  status: string;
  database: {
    status: string;
    response_time: string;
    connection: string;
  };
  services: {
    status: string;
    redis: string;
    celery: string;
    websocket: string;
  };
  resources: {
    cpu: string;
    memory: string;
    disk: string;
    status: string;
  };
  alerts: unknown[];
  last_check: string;
}

export interface BusinessMetrics {
  period: string;
  timestamp: string;
  campaigns: {
    total_sent: number;
    successful: number;
    failed: number;
    success_rate: number;
    bounce_rate: number;
    open_rate: number;
    click_rate: number;
  };
  users: {
    active_sessions: number;
    new_registrations: number;
    total_users: number;
  };
  revenue: {
    daily: number;
    monthly: number;
    yearly: number;
  };
  top_campaigns: Array<{
    name: string;
    sent: number;
    open_rate: number;
  }>;
}

export interface PerformanceMetrics {
  period: string;
  timestamp: string;
  metrics: {
    current: {
      cpu_usage_percent: number;
      memory_usage_percent: number;
      response_time_ms: number;
      requests_per_second: number;
      error_rate_percent: number;
    };
    timeseries: Array<{
      timestamp: string;
      cpu_usage: number;
      memory_usage: number;
      response_time_ms: number;
      requests_per_second: number;
    }>;
  };
}

export interface RealtimeMetrics {
  timestamp: string;
  live_metrics: {
    cpu_usage: number;
    memory_usage: number;
    active_connections: number;
    requests_per_minute: number;
    response_time: number;
    error_count: number;
    database_connections: number;
    queue_size: number;
  };
  alerts: string[];
}

export interface NetworkData {
  timestamp: string;
  upload_mbps: number;
  download_mbps: number;
  latency_ms: number;
  packet_loss: number;
}

export interface ServiceStatus {
  name: string;
  status: 'operational' | 'warning' | 'error';
  response_time: number;
  uptime: string;
  last_check: string;
}

// Analytics API Service
export class AnalyticsAPI {
  
  // System Health
  static async getSystemHealth(): Promise<SystemHealthData> {
    try {
      const response = await axiosInstance.get('/api/v1/dashboard/system-health');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      throw error;
    }
  }

  // Business Analytics  
  static async getBusinessMetrics(period: string = '24h'): Promise<BusinessMetrics> {
    try {
      const response = await axiosInstance.get(`/api/v1/metrics/analytics`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch business metrics:', error);
      throw error;
    }
  }

  // Performance Metrics
  static async getPerformanceMetrics(period: string = '1h'): Promise<PerformanceMetrics> {
    try {
      const response = await axiosInstance.get(`/api/v1/metrics/performance`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      throw error;
    }
  }

  // Realtime Metrics
  static async getRealtimeMetrics(): Promise<RealtimeMetrics> {
    try {
      const response = await axiosInstance.get('/api/v1/metrics/realtime');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch realtime metrics:', error);
      throw error;
    }
  }

  // Network Data (mock implementation for now)
  static async getNetworkData(): Promise<NetworkData[]> {
    try {
      // This could be extended to use a real network monitoring API
      const now = new Date();
      return Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString(),
        upload_mbps: 15 + Math.random() * 20,
        download_mbps: 45 + Math.random() * 30,
        latency_ms: 20 + Math.random() * 15,
        packet_loss: Math.random() * 2
      }));
    } catch (error) {
      console.error('Failed to fetch network data:', error);
      throw error;
    }
  }

  // Service Status (derived from system health)
  static async getServiceStatus(): Promise<ServiceStatus[]> {
    try {
      const health = await this.getSystemHealth();
      const realtime = await this.getRealtimeMetrics();
      
      return [
        {
          name: 'API Gateway',
          status: health.status === 'healthy' ? 'operational' : 'warning',
          response_time: realtime.live_metrics.response_time,
          uptime: '99.2%',
          last_check: health.last_check
        },
        {
          name: 'Database',
          status: health.database?.status === 'healthy' ? 'operational' : 'error',
          response_time: health.database?.response_time ? parseInt(health.database.response_time.replace('ms', '')) : 15,
          uptime: '99.8%',
          last_check: health.last_check
        },
        {
          name: 'Redis Cache',
          status: health.services?.redis === 'active' ? 'operational' : 'warning',
          response_time: 5,
          uptime: '99.5%',
          last_check: health.last_check
        },
        {
          name: 'Celery Queue',
          status: health.services?.celery === 'active' ? 'operational' : 'error',
          response_time: 12,
          uptime: '99.1%',
          last_check: health.last_check
        }
      ];
    } catch (error) {
      console.error('Failed to fetch service status:', error);
      throw error;
    }
  }

  // Combined analytics data for dashboard
  static async getCombinedAnalytics() {
    try {
      const [systemHealth, businessMetrics, performanceMetrics, realtimeMetrics] = await Promise.allSettled([
        this.getSystemHealth(),
        this.getBusinessMetrics(),
        this.getPerformanceMetrics(),
        this.getRealtimeMetrics()
      ]);

      return {
        systemHealth: systemHealth.status === 'fulfilled' ? systemHealth.value : null,
        businessMetrics: businessMetrics.status === 'fulfilled' ? businessMetrics.value : null,
        performanceMetrics: performanceMetrics.status === 'fulfilled' ? performanceMetrics.value : null,
        realtimeMetrics: realtimeMetrics.status === 'fulfilled' ? realtimeMetrics.value : null,
        errors: [
          ...(systemHealth.status === 'rejected' ? ['System Health API failed'] : []),
          ...(businessMetrics.status === 'rejected' ? ['Business Metrics API failed'] : []),
          ...(performanceMetrics.status === 'rejected' ? ['Performance Metrics API failed'] : []),
          ...(realtimeMetrics.status === 'rejected' ? ['Realtime Metrics API failed'] : [])
        ]
      };
    } catch (error) {
      console.error('Failed to fetch combined analytics:', error);
      throw error;
    }
  }
}

export default AnalyticsAPI; 
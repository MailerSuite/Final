import axiosInstance from '@/http/axios';
import { AxiosResponse, AxiosError } from 'axios';

// Safe request wrapper that handles 404/500 errors gracefully
const safeRequest = <T>(p: Promise<AxiosResponse<T>>) =>
  p.then(r => r.data)
   .catch((err: AxiosError) => {
     if ([404, 500].includes(err?.response?.status ?? 0)) return null;
     throw err;
   });

// Types for metrics data
export interface SystemHealthData {
  status: string;
  timestamp: string;
  system: {
    cpu_usage_percent: number;
    memory_usage_percent: number;
    memory_used_gb: number;
    memory_total_gb: number;
    disk_usage_percent: number;
    disk_free_gb: number;
  };
  services: {
    database: {
      status: string;
      connections: number;
    };
    api: {
      status: string;
      uptime: string;
    };
  };
}

export interface SystemMetrics {
  timestamp: string;
  cpu: {
    count: number;
    frequency_mhz?: number;
    usage_percent: number;
    usage_per_core: number[];
    load_average?: number[];
  };
  memory: {
    total_gb: number;
    used_gb: number;
    available_gb: number;
    usage_percent: number;
    swap_total_gb: number;
    swap_used_gb: number;
    swap_percent: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    free_gb: number;
    usage_percent: number;
    read_count: number;
    write_count: number;
    read_bytes: number;
    write_bytes: number;
  };
  network: {
    bytes_sent: number;
    bytes_recv: number;
    packets_sent: number;
    packets_recv: number;
    errors_in: number;
    errors_out: number;
  };
  processes: {
    count: number;
  };
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
  alerts: unknown[];
}

export interface AnalyticsMetrics {
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

export interface AdminOverview {
  timestamp: string;
  system_overview: {
    uptime: string;
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    active_users: number;
    total_users: number;
  };
  service_status: {
    api_server: { status: string; response_time: number };
    database: { status: string; connections: number };
    redis: { status: string; memory_usage: number };
    celery_workers: { status: string; active_tasks: number };
    nginx: { status: string; requests_per_min: number };
  };
  security: {
    failed_logins_24h: number;
    blocked_ips: number;
    active_sessions: number;
    security_events: unknown[];
  };
  performance: {
    avg_response_time: number;
    requests_per_hour: number;
    error_rate: number;
    cache_hit_rate: number;
  };
  business_metrics: {
    campaigns_today: number;
    emails_sent_today: number;
    revenue_today: number;
    active_subscriptions: number;
  };
}

// Metrics API Service
export class MetricsApiService {
  private baseUrl = '/metrics';  // Remove the /api prefix since axios already has /api/v1

  async getHealth(): Promise<SystemHealthData | null> {
    return safeRequest(axiosInstance.get(`${this.baseUrl}/admin/overview`));
  }

  async getSystemMetrics(): Promise<SystemMetrics | null> {
    return safeRequest(axiosInstance.get(`${this.baseUrl}/admin/overview`));
  }

  async getPerformanceMetrics(period: string = '1h'): Promise<PerformanceMetrics | null> {
    return safeRequest(axiosInstance.get(`${this.baseUrl}/admin/overview`));
  }

  async getRealtimeMetrics(): Promise<RealtimeMetrics | null> {
    return safeRequest(axiosInstance.get(`${this.baseUrl}/admin/overview`));
  }

  async getAnalytics(period: string = '24h'): Promise<AnalyticsMetrics | null> {
    return safeRequest(axiosInstance.get(`${this.baseUrl}/admin/overview`));
  }

  async getAdminOverview(): Promise<AdminOverview | null> {
    return safeRequest(axiosInstance.get(`${this.baseUrl}/admin/overview`));
  }

  async getPrometheusMetrics(): Promise<string | null> {
    return safeRequest(axiosInstance.get(`${this.baseUrl}/metrics`));
  }
}

// Export singleton instance
export const metricsApi = new MetricsApiService();

// Individual export functions using safe wrapper
export const getHealth = () => safeRequest(axiosInstance.get('/metrics/admin/overview'));
export const getSystem = () => safeRequest(axiosInstance.get('/metrics/admin/overview'));
export const getPerformance = (period: string) => safeRequest(axiosInstance.get('/metrics/admin/overview', { params: { period } }));
export const getRealtime = () => safeRequest(axiosInstance.get('/metrics/admin/overview'));
export const getAnalytics = (period: string) => safeRequest(axiosInstance.get('/metrics/admin/overview', { params: { period } }));

// React hooks for metrics data
export { useMetricsData } from '../hooks/useMetricsData'; 
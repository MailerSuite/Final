/**
 * Performance Testing API
 * Frontend integration for load testing and performance monitoring
 */

import axiosInstance from '@/http/axios'
import { defaultWebSocketPool } from '@/utils/ws/connection-pool'

// Types
export interface PerformanceTestConfig {
  test_type: 'quick' | 'production' | 'custom'
  duration_minutes: number
  concurrent_threads: number
  emails_per_thread: number
  ramp_up_time: number
  target_throughput?: number
  smtp_config: {
    use_existing_accounts: boolean
    account_rotation: boolean
    max_emails_per_account: number
  }
  proxy_config: {
    use_proxies: boolean
    proxy_rotation: boolean
    max_requests_per_proxy: number
  }
  email_config: {
    template_id?: string
    subject_variation: boolean
    content_variation: boolean
    recipient_list_type: 'test' | 'real' | 'generated'
  }
  monitoring: {
    response_time_tracking: boolean
    error_rate_tracking: boolean
    throughput_tracking: boolean
    resource_usage_tracking: boolean
  }
}

export interface PerformanceTestResult {
  test_id: string
  test_name: string
  test_type: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  start_time: string
  end_time?: string
  duration_seconds: number

  // Core metrics
  total_emails_sent: number
  successful_sends: number
  failed_sends: number
  success_rate: number

  // Performance metrics
  average_response_time_ms: number
  min_response_time_ms: number
  max_response_time_ms: number
  p95_response_time_ms: number
  p99_response_time_ms: number

  // Throughput metrics
  emails_per_second: number
  peak_emails_per_second: number
  target_throughput_achieved: boolean

  // Resource metrics
  cpu_usage_avg: number
  memory_usage_avg: number
  network_io_avg: number

  // Error analysis
  error_breakdown: {
    smtp_errors: number
    network_errors: number
    timeout_errors: number
    authentication_errors: number
    rate_limit_errors: number
    other_errors: number
  }

  // Timeline data for charts
  timeline: {
    timestamp: string
    emails_sent: number
    response_time_ms: number
    error_count: number
    cpu_usage: number
    memory_usage: number
  }[]

  recommendations?: string[]
  bottlenecks_identified?: string[]
}

export interface SystemHealthCheck {
  overall_status: 'healthy' | 'warning' | 'critical'
  checks: {
    database_connection: {
      status: 'pass' | 'fail' | 'warn'
      response_time_ms: number
      active_connections: number
      max_connections: number
      message?: string
    }
    smtp_connectivity: {
      status: 'pass' | 'fail' | 'warn'
      accounts_tested: number
      accounts_working: number
      average_connect_time_ms: number
      message?: string
    }
    proxy_connectivity: {
      status: 'pass' | 'fail' | 'warn'
      proxies_tested: number
      proxies_working: number
      average_connect_time_ms: number
      message?: string
    }
    redis_connection: {
      status: 'pass' | 'fail' | 'warn'
      response_time_ms: number
      memory_usage_mb: number
      message?: string
    }
    disk_space: {
      status: 'pass' | 'fail' | 'warn'
      available_gb: number
      used_percentage: number
      message?: string
    }
    memory_usage: {
      status: 'pass' | 'fail' | 'warn'
      available_mb: number
      used_percentage: number
      message?: string
    }
  }
  recommendations: string[]
  last_checked: string
}

export interface PerformanceMetrics {
  current_metrics: {
    active_connections: number
    emails_queued: number
    emails_sent_last_hour: number
    average_response_time_ms: number
    error_rate_percentage: number
    cpu_usage: number
    memory_usage: number
    network_io_mbps: number
  }

  historical_data: {
    timestamp: string
    emails_sent: number
    response_time_ms: number
    error_rate: number
    cpu_usage: number
    memory_usage: number
  }[]

  alerts: {
    id: string
    severity: 'info' | 'warning' | 'critical'
    message: string
    timestamp: string
    resolved: boolean
  }[]
}

export interface PerformanceReport {
  report_id: string
  generated_at: string
  period: {
    start_date: string
    end_date: string
  }

  summary: {
    total_tests_run: number
    total_emails_sent: number
    average_success_rate: number
    average_response_time_ms: number
    peak_throughput_eps: number
  }

  trends: {
    performance_trend: 'improving' | 'stable' | 'degrading'
    throughput_trend: 'increasing' | 'stable' | 'decreasing'
    error_rate_trend: 'improving' | 'stable' | 'worsening'
  }

  bottlenecks: {
    category: string
    description: string
    impact_level: 'low' | 'medium' | 'high'
    recommendation: string
  }[]

  comparisons: {
    vs_previous_period: {
      emails_sent_change: number
      response_time_change: number
      success_rate_change: number
    }
    vs_baseline: {
      performance_score: number
      efficiency_score: number
    }
  }
}

export interface LivePerformanceStream {
  timestamp: string
  emails_sent: number
  response_time_ms: number
  error_count: number
  active_threads: number
  queue_size: number
  cpu_usage: number
  memory_usage: number
}

export const performanceApi = {
  // System status and health
  getStatus: async (): Promise<{
    service: string
    version: string
    uptime: string
    system_ready: boolean
  }> => {
    const { data } = await axiosInstance.get('/performance/status')
    return data
  },

  getSystemCheck: async (): Promise<SystemHealthCheck> => {
    const { data } = await axiosInstance.get<SystemHealthCheck>('/performance/system/check')
    return data
  },

  // Test execution
  runQuickTest: async (config?: Partial<PerformanceTestConfig>): Promise<{
    test_id: string
    message: string
    estimated_duration: number
  }> => {
    const { data } = await axiosInstance.post('/performance/test/quick', config || {})
    return data
  },

  runProductionTest: async (config: PerformanceTestConfig): Promise<{
    test_id: string
    message: string
    estimated_duration: number
  }> => {
    const { data } = await axiosInstance.post('/performance/test/production', config)
    return data
  },

  runCustomTest: async (config: PerformanceTestConfig): Promise<{
    test_id: string
    message: string
    estimated_duration: number
  }> => {
    const { data } = await axiosInstance.post('/performance/test/custom', config)
    return data
  },

  // Test monitoring
  getTestResult: async (testId: string): Promise<PerformanceTestResult> => {
    const { data } = await axiosInstance.get<PerformanceTestResult>(`/performance/test/${testId}/result`)
    return data
  },

  getTestStatus: async (testId: string): Promise<{
    test_id: string
    status: string
    progress_percentage: number
    current_metrics: any
    estimated_completion: string
  }> => {
    const { data } = await axiosInstance.get(`/performance/test/${testId}/status`)
    return data
  },

  cancelTest: async (testId: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await axiosInstance.post(`/performance/test/${testId}/cancel`)
    return data
  },

  // Metrics and monitoring
  getCurrentMetrics: async (): Promise<PerformanceMetrics> => {
    const { data } = await axiosInstance.get<PerformanceMetrics>('/performance/metrics')
    return data
  },

  getLiveMetrics: async (): Promise<LivePerformanceStream> => {
    const { data } = await axiosInstance.get<LivePerformanceStream>('/performance/live')
    return data
  },

  // Reporting
  getReports: async (params?: {
    start_date?: string
    end_date?: string
    test_type?: string
    limit?: number
  }): Promise<{
    reports: PerformanceReport[]
    total: number
    has_more: boolean
  }> => {
    const { data } = await axiosInstance.get('/performance/reports', { params })
    return data
  },

  generateReport: async (config: {
    start_date: string
    end_date: string
    include_comparisons: boolean
    include_recommendations: boolean
  }): Promise<{
    report_id: string
    message: string
    estimated_completion: string
  }> => {
    const { data } = await axiosInstance.post('/performance/reports/generate', config)
    return data
  },

  getReport: async (reportId: string): Promise<PerformanceReport> => {
    const { data } = await axiosInstance.get<PerformanceReport>(`/performance/reports/${reportId}`)
    return data
  },

  downloadReport: async (reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<Blob> => {
    const response = await axiosInstance.get(`/performance/reports/${reportId}/download`, {
      params: { format },
      responseType: 'blob'
    })
    return response.data
  },

  // Comparison and analysis
  compareTests: async (testIds: string[]): Promise<{
    comparison_id: string
    tests: PerformanceTestResult[]
    analysis: {
      best_performing_test: string
      worst_performing_test: string
      key_differences: string[]
      recommendations: string[]
    }
  }> => {
    const { data } = await axiosInstance.post('/performance/compare', { test_ids: testIds })
    return data
  },

  // Configuration templates
  getTestTemplates: async (): Promise<{
    templates: {
      name: string
      description: string
      config: PerformanceTestConfig
      use_cases: string[]
    }[]
  }> => {
    const { data } = await axiosInstance.get('/performance/templates')
    return data
  },

  saveTestTemplate: async (template: {
    name: string
    description: string
    config: PerformanceTestConfig
  }): Promise<{ success: boolean; template_id: string }> => {
    const { data } = await axiosInstance.post('/performance/templates', template)
    return data
  },

  // System optimization
  getOptimizationSuggestions: async (): Promise<{
    suggestions: {
      category: string
      title: string
      description: string
      impact_level: 'low' | 'medium' | 'high'
      implementation_effort: 'easy' | 'moderate' | 'complex'
      estimated_improvement: string
    }[]
  }> => {
    const { data } = await axiosInstance.get('/performance/optimization/suggestions')
    return data
  },

  applyOptimization: async (optimizationId: string): Promise<{
    success: boolean
    message: string
    changes_applied: string[]
  }> => {
    const { data } = await axiosInstance.post(`/performance/optimization/${optimizationId}/apply`)
    return data
  }
}

// WebSocket for live performance monitoring
export class PerformanceLiveStream {
  private connId: string | null = null
  private listeners: ((data: LivePerformanceStream) => void)[] = []
  private reconnectTimer: number | null = null
  private msgHandler: ((ev: any) => void) | null = null
  private closeHandler: ((ev: any) => void) | null = null
  private errorHandler: ((ev: any) => void) | null = null

  async connect(): Promise<void> {
    if (this.connId) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/performance/live`

    try {
      const id = await defaultWebSocketPool.connect('performance', wsUrl)
      this.connId = id

      this.msgHandler = (ev: any) => {
        try {
          const data: LivePerformanceStream = JSON.parse(ev.data)
          this.listeners.forEach(l => l(data))
        } catch (err) {
          console.error('Failed to parse live performance data:', err)
        }
      }

      this.closeHandler = (ev: any) => {
        // Clear current connection id so subsequent connect attempts can run
        this.connId = null
        // schedule reconnect
        this.scheduleReconnect()
      }

      this.errorHandler = (ev: any) => {
        console.error('Performance WebSocket error:', ev)
      }

      defaultWebSocketPool.on(id, 'message', this.msgHandler)
      defaultWebSocketPool.on(id, 'close', this.closeHandler)
      defaultWebSocketPool.on(id, 'error', this.errorHandler)

    } catch (error) {
      console.error('Performance WebSocket connect failed:', error)
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    this.reconnectTimer = window.setTimeout(async () => {
      this.reconnectTimer = null
      try {
        await this.connect()
      } catch (err) {
        // if connect throws, schedule again
        this.scheduleReconnect()
      }
    }, 5000)
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.connId) {
      try {
        if (this.msgHandler) defaultWebSocketPool.off(this.connId, 'message', this.msgHandler)
        if (this.closeHandler) defaultWebSocketPool.off(this.connId, 'close', this.closeHandler)
        if (this.errorHandler) defaultWebSocketPool.off(this.connId, 'error', this.errorHandler)
      } catch (_) { }

      try {
        defaultWebSocketPool.close(this.connId)
      } catch (_) { }

      this.connId = null
    }
  }

  onData(listener: (data: LivePerformanceStream) => void): () => void {
    this.listeners.push(listener)

    return () => {
      const idx = this.listeners.indexOf(listener)
      if (idx > -1) this.listeners.splice(idx, 1)
    }
  }
}

// React Query hooks
export const usePerformanceStatus = () => {
  return {
    queryKey: ['performanceStatus'],
    queryFn: performanceApi.getStatus
  }
}

export const useSystemCheck = () => {
  return {
    queryKey: ['systemCheck'],
    queryFn: performanceApi.getSystemCheck,
    refetchInterval: 30000 // Refresh every 30 seconds
  }
}

export const usePerformanceMetrics = () => {
  return {
    queryKey: ['performanceMetrics'],
    queryFn: performanceApi.getCurrentMetrics,
    refetchInterval: 5000 // Refresh every 5 seconds
  }
}

export const useTestResult = (testId: string) => {
  return {
    queryKey: ['testResult', testId],
    queryFn: () => performanceApi.getTestResult(testId),
    enabled: !!testId
  }
}

export const usePerformanceReports = (params?: any) => {
  return {
    queryKey: ['performanceReports', params],
    queryFn: () => performanceApi.getReports(params)
  }
}
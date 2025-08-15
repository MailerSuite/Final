/**
 * Performance Optimized Admin Dashboard Hook
 * Manages all admin API calls with caching and error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AdminAPI, SystemHealth, SystemMetrics, SystemAlert } from '@/api/admin-services';

interface AdminDashboardState {
  // Data
  systemHealth: SystemHealth | null;
  systemMetrics: SystemMetrics | null;
  systemAlerts: SystemAlert[];
  
  // Loading states
  healthLoading: boolean;
  metricsLoading: boolean;
  alertsLoading: boolean;
  
  // Error states
  healthError: string | null;
  metricsError: string | null;
  alertsError: string | null;
  
  // Refresh functions
  refreshHealth: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Real-time control
  isLive: boolean;
  toggleLive: () => void;
  
  // Last update timestamps
  lastHealthUpdate: Date | null;
  lastMetricsUpdate: Date | null;
  lastAlertsUpdate: Date | null;
}

// Cache configuration
const CACHE_DURATION = {
  HEALTH: 5000,   // 5 seconds
  METRICS: 3000,  // 3 seconds  
  ALERTS: 30000,  // 30 seconds
};

// Performance optimized cache
class AdminDashboardCache {
  private static healthCache: { data: SystemHealth; timestamp: number } | null = null;
  private static metricsCache: { data: SystemMetrics; timestamp: number } | null = null;
  private static alertsCache: { data: SystemAlert[]; timestamp: number } | null = null;

  static isValid(cache: { timestamp: number } | null, duration: number): boolean {
    return cache !== null && (Date.now() - cache.timestamp) < duration;
  }

  static setHealth(data: SystemHealth) {
    this.healthCache = { data, timestamp: Date.now() };
  }

  static getHealth(): SystemHealth | null {
    return this.isValid(this.healthCache, CACHE_DURATION.HEALTH) 
      ? this.healthCache!.data 
      : null;
  }

  static setMetrics(data: SystemMetrics) {
    this.metricsCache = { data, timestamp: Date.now() };
  }

  static getMetrics(): SystemMetrics | null {
    return this.isValid(this.metricsCache, CACHE_DURATION.METRICS)
      ? this.metricsCache!.data
      : null;
  }

  static setAlerts(data: SystemAlert[]) {
    this.alertsCache = { data, timestamp: Date.now() };
  }

  static getAlerts(): SystemAlert[] | null {
    return this.isValid(this.alertsCache, CACHE_DURATION.ALERTS)
      ? this.alertsCache!.data
      : null;
  }

  static clear() {
    this.healthCache = null;
    this.metricsCache = null;
    this.alertsCache = null;
  }
}

export const useAdminDashboard = (): AdminDashboardState => {
  // State management
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  
  const [healthLoading, setHealthLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);
  
  const [healthError, setHealthError] = useState<string | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  
  const [isLive, setIsLive] = useState(true);
  
  const [lastHealthUpdate, setLastHealthUpdate] = useState<Date | null>(null);
  const [lastMetricsUpdate, setLastMetricsUpdate] = useState<Date | null>(null);
  const [lastAlertsUpdate, setLastAlertsUpdate] = useState<Date | null>(null);
  
  // Refs for intervals
  const healthIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch functions with caching and error handling
  const refreshHealth = useCallback(async () => {
    // Check cache first
    const cachedHealth = AdminDashboardCache.getHealth();
    if (cachedHealth) {
      setSystemHealth(cachedHealth);
      return;
    }

    setHealthLoading(true);
    setHealthError(null);
    
    try {
      const health = await AdminAPI.dashboard.getSystemHealth();
      AdminDashboardCache.setHealth(health);
      setSystemHealth(health);
      setLastHealthUpdate(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch system health';
      setHealthError(errorMessage);
      console.error('Health fetch error:', error);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const refreshMetrics = useCallback(async () => {
    // Check cache first
    const cachedMetrics = AdminDashboardCache.getMetrics();
    if (cachedMetrics) {
      setSystemMetrics(cachedMetrics);
      return;
    }

    setMetricsLoading(true);
    setMetricsError(null);
    
    try {
      const metrics = await AdminAPI.dashboard.getSystemMetrics();
      AdminDashboardCache.setMetrics(metrics);
      setSystemMetrics(metrics);
      setLastMetricsUpdate(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch system metrics';
      setMetricsError(errorMessage);
      console.error('Metrics fetch error:', error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const refreshAlerts = useCallback(async () => {
    // Check cache first
    const cachedAlerts = AdminDashboardCache.getAlerts();
    if (cachedAlerts) {
      setSystemAlerts(cachedAlerts);
      return;
    }

    setAlertsLoading(true);
    setAlertsError(null);
    
    try {
      const alerts = await AdminAPI.dashboard.getSystemAlerts();
      AdminDashboardCache.setAlerts(alerts);
      setSystemAlerts(alerts);
      setLastAlertsUpdate(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch system alerts';
      setAlertsError(errorMessage);
      console.error('Alerts fetch error:', error);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshHealth(),
      refreshMetrics(),
      refreshAlerts()
    ]);
  }, [refreshHealth, refreshMetrics, refreshAlerts]);

  const toggleLive = useCallback(() => {
    setIsLive(prev => !prev);
  }, []);

  // Set up real-time intervals
  useEffect(() => {
    if (!isLive) {
      // Clear all intervals when not live
      if (healthIntervalRef.current) clearInterval(healthIntervalRef.current);
      if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
      if (alertsIntervalRef.current) clearInterval(alertsIntervalRef.current);
      return;
    }

    // Initial fetch
    refreshAll();

    // Set up staggered intervals for optimal performance
    healthIntervalRef.current = setInterval(refreshHealth, CACHE_DURATION.HEALTH);
    metricsIntervalRef.current = setInterval(refreshMetrics, CACHE_DURATION.METRICS);
    alertsIntervalRef.current = setInterval(refreshAlerts, CACHE_DURATION.ALERTS);

    return () => {
      if (healthIntervalRef.current) clearInterval(healthIntervalRef.current);
      if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
      if (alertsIntervalRef.current) clearInterval(alertsIntervalRef.current);
    };
  }, [isLive, refreshAll, refreshHealth, refreshMetrics, refreshAlerts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (healthIntervalRef.current) clearInterval(healthIntervalRef.current);
      if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
      if (alertsIntervalRef.current) clearInterval(alertsIntervalRef.current);
    };
  }, []);

  return {
    // Data
    systemHealth,
    systemMetrics,
    systemAlerts,
    
    // Loading states
    healthLoading,
    metricsLoading,
    alertsLoading,
    
    // Error states
    healthError,
    metricsError,
    alertsError,
    
    // Refresh functions
    refreshHealth,
    refreshMetrics,
    refreshAlerts,
    refreshAll,
    
    // Real-time control
    isLive,
    toggleLive,
    
    // Last update timestamps
    lastHealthUpdate,
    lastMetricsUpdate,
    lastAlertsUpdate
  };
};
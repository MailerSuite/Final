/**
 * API Health Check Utilities
 * Helps diagnose backend connectivity and API issues
 */

export interface HealthCheckResult {
  status: 'online' | 'offline' | 'checking';
  endpoint: string;
  responseTime?: number;
  error?: string;
  suggestions?: string[];
}

/**
 * Comprehensive health check for the SGPT backend
 */
export async function checkBackendHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const endpoint = '/health';

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000)
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend health check successful:', data);

      return {
        status: 'online',
        endpoint,
        responseTime,
      };
    } else {
      console.warn('⚠️ Backend responded with error:', response.status);

      return {
        status: 'offline',
        endpoint,
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
        suggestions: [
          'Check if the backend server is running on port 8000',
          'Verify the health endpoint exists',
          'Check server logs for errors'
        ]
      };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    let errorMessage = 'Unknown error';
    let suggestions: string[] = [];

    if (error.name === 'AbortError') {
      errorMessage = 'Request timed out after 5 seconds';
      suggestions = [
        'Backend server may be down or unresponsive',
        'Check if FastAPI server is running: python3 -m uvicorn app.main:app --reload --port 8000',
        'Verify network connectivity'
      ];
    } else if (error.message?.includes('Failed to fetch')) {
      errorMessage = 'Failed to connect to backend';
      suggestions = [
        'Backend server is not running on port 8000',
        'Start the backend: cd backend && python3 -m uvicorn app.main:app --reload --port 8000',
        'Check if port 8000 is blocked by firewall'
      ];
    } else {
      errorMessage = error.message || 'Connection failed';
      suggestions = [
        'Check console for detailed error messages',
        'Verify backend server configuration',
        'Check if proxy settings are correct'
      ];
    }

    console.error('❌ Backend health check failed:', errorMessage);

    return {
      status: 'offline',
      endpoint,
      responseTime,
      error: errorMessage,
      suggestions
    };
  }
}

/**
 * Monitor backend health with periodic checks
 */
export class BackendHealthMonitor {
  private intervalId: number | null = null;
  private listeners: ((result: HealthCheckResult) => void)[] = [];

  constructor(private intervalMs: number = 30000) { }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.intervalId) {
      this.stop();
    }

    // Initial check
    this.performCheck();

    // Set up periodic checks
    this.intervalId = window.setInterval(() => {
      this.performCheck();
    }, this.intervalMs);

    console.log(`🔄 Backend health monitoring started (${this.intervalMs}ms interval)`);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Backend health monitoring stopped');
    }
  }

  /**
   * Add listener for health check results
   */
  onHealthChange(callback: (result: HealthCheckResult) => void): () => void {
    this.listeners.push(callback);

    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Perform health check and notify listeners
   */
  private async performCheck(): Promise<void> {
    const result = await checkBackendHealth();

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(result);
      } catch (error) {
        console.error('Error in health check listener:', error);
      }
    });
  }

  /**
   * Get current health status
   */
  async getCurrentHealth(): Promise<HealthCheckResult> {
    return await checkBackendHealth();
  }
}

/**
 * Debug function to test API connectivity
 * Available in development console as window.apiHealth.debug()
 */
export function debugApiConnectivity(): void {
  console.group('🔍 API Connectivity Debug');

  console.log('Frontend URL:', window.location.origin);
  console.log('Expected Backend:', 'http://localhost:8000');
  console.log('Health Endpoint:', '/health (proxied via Vite)');

  checkBackendHealth().then(result => {
    console.log('Health Check Result:', result);

    if (result.status === 'offline') {
      console.warn('💡 Backend appears to be down. Try:');
      result.suggestions?.forEach((suggestion, i) => {
        console.log(`   ${i + 1}. ${suggestion}`);
      });
    }

    console.groupEnd();
  });
}

// Expose debug utilities in development
if (import.meta.env.DEV) {
  (window as any).apiHealth = {
    check: checkBackendHealth,
    debug: debugApiConnectivity,
    monitor: BackendHealthMonitor
  };
} 
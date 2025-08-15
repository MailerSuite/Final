/**
 * Enhanced API Debugging System for SGPT Frontend
 * Provides detailed error tracking, request/response logging, and performance monitoring
 */

interface APIError {
  url: string;
  method: string;
  baseURL: string;
  status?: number;
  statusText?: string;
  responseData?: any;
  requestHeaders?: any;
  responseHeaders?: any;
  errorMessage?: string;
  errorCode?: string;
  timestamp: string;
  duration?: number;
}

interface APIDebugConfig {
  enabled: boolean;
  logToConsole: boolean;
  logToLocalStorage: boolean;
  maxStoredErrors: number;
  includeRequestBody: boolean;
  includeResponseBody: boolean;
}

class APIDebugger {
  private config: APIDebugConfig = {
    enabled: import.meta.env.DEV,
    logToConsole: true,
    logToLocalStorage: true,
    maxStoredErrors: 100,
    includeRequestBody: true,
    includeResponseBody: true,
  };

  private errors: APIError[] = [];

  constructor(config?: Partial<APIDebugConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.loadStoredErrors();
  }

  /**
   * Log an API error with enhanced details
   */
  logError(error: any, requestConfig?: any, startTime?: number): void {
    if (!this.config.enabled) return;

    const duration = startTime ? Date.now() - startTime : undefined;
    
    const apiError: APIError = {
      url: error.config?.url || error.url || 'unknown',
      method: error.config?.method?.toUpperCase() || 'unknown',
      baseURL: error.config?.baseURL || '',
      status: error.response?.status || error.status,
      statusText: error.response?.statusText || error.statusText,
      responseData: this.config.includeResponseBody ? error.response?.data : '[Hidden]',
      requestHeaders: error.config?.headers,
      responseHeaders: error.response?.headers,
      errorMessage: error.message,
      errorCode: error.code,
      timestamp: new Date().toISOString(),
      duration,
    };

    this.errors.unshift(apiError);
    
    // Limit stored errors
    if (this.errors.length > this.config.maxStoredErrors) {
      this.errors = this.errors.slice(0, this.config.maxStoredErrors);
    }

    if (this.config.logToConsole) {
      this.logToConsole(apiError);
    }

    if (this.config.logToLocalStorage) {
      this.saveToLocalStorage();
    }

    // Trigger custom event for UI components
    window.dispatchEvent(new CustomEvent('apiError', { detail: apiError }));
  }

  /**
   * Log successful API requests for performance monitoring
   */
  logSuccess(response: any, requestConfig?: any, startTime?: number): void {
    if (!this.config.enabled) return;

    const duration = startTime ? Date.now() - startTime : undefined;
    
    if (this.config.logToConsole) {
      console.log('🟢 [API] Success:', {
        url: response.config?.url,
        method: response.config?.method?.toUpperCase(),
        status: response.status,
        duration: duration ? `${duration}ms` : 'unknown',
        data: this.config.includeResponseBody ? response.data : '[Hidden]',
      });
    }
  }

  /**
   * Enhanced console logging with better formatting
   */
  private logToConsole(error: APIError): void {
    console.group('🔴 [API] Response Error:');
    console.error('Error Details:', error);
    
    if (error.status === 500) {
      console.warn('💥 Server Error (500) - Check backend logs');
      console.warn('Common causes: Database connection, missing models, import errors');
    }
    
    if (error.status === 404) {
      console.warn('🔍 Not Found (404) - Check endpoint URL');
    }
    
    if (error.status === 401 || error.status === 403) {
      console.warn('🔐 Authentication/Authorization Error - Check token');
    }

    console.groupEnd();
  }

  /**
   * Save errors to localStorage for persistence
   */
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('sgpt_api_errors', JSON.stringify(this.errors));
    } catch (e) {
      console.warn('Failed to save API errors to localStorage:', e);
    }
  }

  /**
   * Load stored errors from localStorage
   */
  private loadStoredErrors(): void {
    try {
      const stored = localStorage.getItem('sgpt_api_errors');
      if (stored) {
        this.errors = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load API errors from localStorage:', e);
    }
  }

  /**
   * Get all stored errors
   */
  getErrors(): APIError[] {
    return [...this.errors];
  }

  /**
   * Get errors by status code
   */
  getErrorsByStatus(status: number): APIError[] {
    return this.errors.filter(error => error.status === status);
  }

  /**
   * Get recent errors (last N minutes)
   */
  getRecentErrors(minutes: number = 5): APIError[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.errors.filter(error => new Date(error.timestamp) > cutoff);
  }

  /**
   * Clear all stored errors
   */
  clearErrors(): void {
    this.errors = [];
    localStorage.removeItem('sgpt_api_errors');
  }

  /**
   * Generate error summary for debugging
   */
  getErrorSummary(): object {
    const summary = {
      total: this.errors.length,
      byStatus: {} as Record<number, number>,
      byEndpoint: {} as Record<string, number>,
      recent: this.getRecentErrors().length,
    };

    this.errors.forEach(error => {
      if (error.status) {
        summary.byStatus[error.status] = (summary.byStatus[error.status] || 0) + 1;
      }
      
      const endpoint = error.url;
      summary.byEndpoint[endpoint] = (summary.byEndpoint[endpoint] || 0) + 1;
    });

    return summary;
  }

  /**
   * Enable/disable debugging
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
}

// Create global instance
export const apiDebugger = new APIDebugger();

// Global function for manual testing
if (typeof window !== 'undefined') {
  (window as any).sgptApiDebugger = apiDebugger;
}

export default apiDebugger; 
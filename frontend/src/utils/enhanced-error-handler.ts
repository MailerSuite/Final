/**
 * Enhanced Error Handler for SGPT Frontend
 * Provides intelligent error handling with auto-retry, user feedback, and debugging
 */

import { toast } from 'sonner';
import { apiDebugger } from './api-debug';

export interface ErrorHandlerConfig {
  showToast: boolean;
  autoRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  logErrors: boolean;
}

export interface APIErrorResponse {
  message?: string;
  detail?: string;
  errors?: unknown[];
  code?: string;
  status?: number;
}

class EnhancedErrorHandler {
  private config: ErrorHandlerConfig = {
    showToast: true,
    autoRetry: false,
    maxRetries: 3,
    retryDelay: 1000,
    logErrors: true,
  };

  private retryAttempts = new Map<string, number>();

  constructor(config?: Partial<ErrorHandlerConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Handle API errors with intelligent responses
   */
  async handleError(error: unknown, requestConfig?: any, retryFn?: () => Promise<unknown>): Promise<unknown> {
    const startTime = Date.now();
    
    if (this.config.logErrors) {
      apiDebugger.logError(error, requestConfig, startTime);
    }

    const errorResponse = this.parseErrorResponse(error);
    const userMessage = this.getUserFriendlyMessage(errorResponse);

    // Show user notification
    if (this.config.showToast) {
      this.showErrorToast(errorResponse, userMessage);
    }

    // Handle auto-retry for certain errors
    if (this.shouldRetry(error) && retryFn) {
      return this.handleRetry(error, retryFn, requestConfig);
    }

    throw error;
  }

  /**
   * Parse error response into standardized format
   */
  private parseErrorResponse(error: unknown): APIErrorResponse {
    const response = error.response?.data || {};
    
    return {
      message: response.message || response.detail || error.message,
      detail: response.detail,
      errors: response.errors,
      code: response.code || error.code,
      status: error.response?.status || error.status,
    };
  }

  /**
   * Generate user-friendly error messages
   */
  private getUserFriendlyMessage(errorResponse: APIErrorResponse): string {
    const { status, message, detail } = errorResponse;

    switch (status) {
      case 400:
        return detail || message || 'Invalid request. Please check your input.';
      
      case 401:
        return 'Please log in to continue.';
      
      case 403:
        return 'You don\'t have permission to perform this action.';
      
      case 404:
        return 'The requested resource was not found.';
      
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      
      case 500:
        return 'Server error. We\'re working to fix this issue.';
      
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again in a moment.';
      
      default:
        if (message) {
          return message;
        }
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Show appropriate toast notification
   */
  private showErrorToast(errorResponse: APIErrorResponse, userMessage: string): void {
    const { status } = errorResponse;

    if (status === 500) {
      toast.error('Server Error', {
        description: userMessage,
        action: {
          label: 'View Details',
          onClick: () => this.showErrorDetails(errorResponse),
        },
        duration: 8000,
      });
    } else if (status === 401) {
      toast.error('Authentication Required', {
        description: userMessage,
        action: {
          label: 'Login',
          onClick: () => window.location.href = '/login',
        },
        duration: 6000,
      });
    } else if (status && status >= 400 && status < 500) {
      toast.warning('Request Error', {
        description: userMessage,
        duration: 5000,
      });
    } else {
      toast.error('Error', {
        description: userMessage,
        duration: 4000,
      });
    }
  }

  /**
   * Show detailed error information for debugging
   */
  private showErrorDetails(errorResponse: APIErrorResponse): void {
    const summary = apiDebugger.getErrorSummary();
    const recent500s = apiDebugger.getErrorsByStatus(500);
    
    console.group('🔍 Error Details for Debugging');
    console.log('Current Error:', errorResponse);
    console.log('Recent 500 Errors:', recent500s.slice(0, 5));
    console.log('Error Summary:', summary);
    console.groupEnd();

    // Show debugging suggestions
    if (errorResponse.status === 500) {
      console.warn('💡 Debugging Suggestions:');
      console.warn('1. Check backend logs for detailed error traces');
      console.warn('2. Verify database connection and models');
      console.warn('3. Check for missing imports or dependencies');
      console.warn('4. Test API endpoints directly with curl');
    }
  }

  /**
   * Determine if error should trigger retry
   */
  private shouldRetry(error: unknown): boolean {
    if (!this.config.autoRetry) return false;

    const status = error.response?.status;
    
    // Retry on network errors, 5xx errors, and timeouts
    return (
      !status || // Network error
      status >= 500 || // Server error
      error.code === 'NETWORK_ERROR' ||
      error.code === 'TIMEOUT'
    );
  }

  /**
   * Handle retry logic with exponential backoff
   */
  private async handleRetry(
    error: unknown, 
    retryFn: () => Promise<unknown>, 
    requestConfig?: any
  ): Promise<unknown> {
    const requestKey = `${requestConfig?.method}-${requestConfig?.url}`;
    const attempts = this.retryAttempts.get(requestKey) || 0;

    if (attempts >= this.config.maxRetries) {
      this.retryAttempts.delete(requestKey);
      throw error;
    }

    this.retryAttempts.set(requestKey, attempts + 1);
    
    const delay = this.config.retryDelay * Math.pow(2, attempts);
    
    toast.info(`Retrying request... (${attempts + 1}/${this.config.maxRetries})`, {
      duration: 2000,
    });

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      const result = await retryFn();
      this.retryAttempts.delete(requestKey);
      return result;
    } catch (retryError) {
      return this.handleRetry(retryError, retryFn, requestConfig);
    }
  }

  /**
   * Reset retry attempts for a specific request
   */
  resetRetries(requestKey: string): void {
    this.retryAttempts.delete(requestKey);
  }

  /**
   * Clear all retry attempts
   */
  clearRetries(): void {
    this.retryAttempts.clear();
  }
}

// Create global instance
export const errorHandler = new EnhancedErrorHandler();

export default errorHandler; 
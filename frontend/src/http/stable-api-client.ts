/**
 * 🔧 Stable API Client - Single source of truth for all API calls
 * Consolidates all functionality from various conflicting API clients
 * Provides consistent error handling, authentication, and response patterns
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

// ==================== STANDARDIZED TYPES ====================

export interface StandardAPIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
}

export interface APIError {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
  search?: string;
  sort?: string;
  filter?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ==================== STABLE API CLIENT ====================

class StableAPIClient {
  private axios: AxiosInstance;
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    // Use environment variables with fallbacks
    this.baseURL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || '/api';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    this.axios = axios.create({
      baseURL: this.baseURL,
      headers: this.defaultHeaders,
      timeout: 30000, // 30 second timeout
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth and logging
    this.axios.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        // Log request in development
        if (import.meta.env.DEV) {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params,
          });
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and logging
    this.axios.interceptors.response.use(
      (response) => {
        // Log successful responses in development
        if (import.meta.env.DEV) {
          console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error: AxiosError) => {
        this.handleResponseError(error);
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    // Try to get token from localStorage or other sources
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || 
             localStorage.getItem('token') || 
             sessionStorage.getItem('auth_token') ||
             null;
    }
    return null;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleResponseError(error: AxiosError) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'API request failed';

    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`❌ API Error: ${status} ${error.config?.url}`, {
        message,
        data: error.response?.data,
        config: error.config,
      });
    }

    // Show user-friendly error messages
    if (status === 401) {
      toast.error('Authentication required. Please log in again.');
    } else if (status === 403) {
      toast.error('Access denied. You don\'t have permission for this action.');
    } else if (status === 404) {
      toast.error('Resource not found.');
    } else if (status === 500) {
      toast.error('Server error. Please try again later.');
    } else if (status && status >= 400) {
      toast.error(message);
    }
  }

  // ==================== CORE HTTP METHODS ====================

  async get<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<StandardAPIResponse<T>> {
    try {
      const response = await this.axios.get<T>(this.normalizeEndpoint(endpoint), config);
      return this.normalizeResponse<T>(response);
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async post<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<StandardAPIResponse<T>> {
    try {
      const response = await this.axios.post<T>(this.normalizeEndpoint(endpoint), data, config);
      return this.normalizeResponse<T>(response);
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async put<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<StandardAPIResponse<T>> {
    try {
      const response = await this.axios.put<T>(this.normalizeEndpoint(endpoint), data, config);
      return this.normalizeResponse<T>(response);
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async patch<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<StandardAPIResponse<T>> {
    try {
      const response = await this.axios.patch<T>(this.normalizeEndpoint(endpoint), data, config);
      return this.normalizeResponse<T>(response);
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async delete<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<StandardAPIResponse<T>> {
    try {
      const response = await this.axios.delete<T>(this.normalizeEndpoint(endpoint), config);
      return this.normalizeResponse<T>(response);
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  // ==================== UTILITY METHODS ====================

  private normalizeEndpoint(endpoint: string): string {
    // Remove leading slash if present
    if (endpoint.startsWith('/')) {
      endpoint = endpoint.substring(1);
    }
    
    // Add /api prefix if not present
    if (!endpoint.startsWith('api/')) {
      endpoint = `api/${endpoint}`;
    }
    
    return endpoint;
  }

  private normalizeResponse<T>(response: AxiosResponse): StandardAPIResponse<T> {
    const data = response.data;

    // If response is already in standard format
    if (data && typeof data === 'object' && 'success' in data) {
      return data as StandardAPIResponse<T>;
    }

    // Normalize legacy response formats
    return {
      success: response.status >= 200 && response.status < 300,
      data: data as T,
      message: data?.message || 'Success',
      meta: {
        total: data?.total,
        page: data?.page,
        limit: data?.limit,
        pages: data?.pages || (data?.total && data?.limit ? Math.ceil(data.total / data.limit) : undefined),
      },
    };
  }

  private normalizeError(error: unknown): APIError {
    if (axios.isAxiosError(error)) {
      return {
        message: error.response?.data?.message || error.message || 'API request failed',
        status: error.response?.status || 0,
        code: error.response?.data?.code,
        details: error.response?.data,
      };
    }
    
    return {
      message: error.message || 'Unknown error occurred',
      status: 0,
      details: error,
    };
  }

  // ==================== SPECIALIZED METHODS ====================

  async uploadFile(
    endpoint: string,
    file: File,
    fieldName: string = 'file',
    additionalData?: Record<string, any>
  ): Promise<StandardAPIResponse> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    return this.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async downloadFile(endpoint: string, filename?: string): Promise<void> {
    const response = await this.axios.get(this.normalizeEndpoint(endpoint), {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.get('/health/live');
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Get the underlying axios instance for advanced use cases
  getAxiosInstance(): AxiosInstance {
    return this.axios;
  }
}

// ==================== EXPORT SINGLETON ====================

export const apiClient = new StableAPIClient();
export default apiClient;

// ==================== UTILITY FUNCTIONS ====================

export const validateResponse = function<T>(
  response: StandardAPIResponse<T>
): T {
  if (!response.success) {
    throw new Error(response.error || response.message || 'API request failed');
  }
  return response.data as T;
};

// Export types for use in other files
export type { StandardAPIResponse, APIError, PaginationParams, ValidationError };

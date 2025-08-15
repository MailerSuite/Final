/**
 * Unified API Core - Base API Client with Advanced Features
 * Consolidates common API functionality across all services
 */

import type { AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: 'success' | 'error';
  timestamp: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface RequestOptions extends InternalAxiosRequestConfig {
  cache?: boolean;
  retry?: number;
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  deduplication?: boolean;
}

export class UnifiedApiCore {
  protected client: AxiosInstance;
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(baseURL = '/api/v1') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const { response } = error;
        
        // Handle authentication errors
        if (response?.status === 401) {
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_token');
          window.location.href = '/auth/login';
          return Promise.reject(error);
        }

        // Handle rate limiting
        if (response?.status === 429) {
          toast.error('Rate limit exceeded. Please wait before trying again.');
        }

        return Promise.reject(error);
      }
    );
  }

  private getCacheKey(url: string, params?: any): string {
    return `${url}:${JSON.stringify(params || {})}`;
  }

  private getFromCache(key: string): unknown | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: unknown, ttl = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  protected async makeRequest<T>(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      cache = false,
      retry = 1,
      showErrorToast = true,
      showSuccessToast = false,
      deduplication = true,
      ...axiosConfig
    } = options;

    const cacheKey = cache ? this.getCacheKey(url, { method, data, ...axiosConfig }) : '';
    
    // Check cache for GET requests
    if (cache && method === 'get') {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    // Request deduplication
    const requestKey = `${method}:${url}:${JSON.stringify(data)}`;
    if (deduplication && this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    const requestPromise = this.executeRequest<T>(method, url, data, axiosConfig, retry);
    
    if (deduplication) {
      this.pendingRequests.set(requestKey, requestPromise);
    }

    try {
      const result = await requestPromise;
      
      // Cache successful responses
      if (cache && method === 'get') {
        this.setCache(cacheKey, result);
      }

      if (showSuccessToast && method !== 'get') {
        toast.success(result.message || 'Operation completed successfully');
      }

      return result;
    } catch (error: unknown) {
      if (showErrorToast) {
        const message = error.response?.data?.message || error.message || 'An error occurred';
        toast.error(message);
      }
      throw error;
    } finally {
      if (deduplication) {
        this.pendingRequests.delete(requestKey);
      }
    }
  }

  private async executeRequest<T>(
    method: string,
    url: string,
    data?: any,
    config?: InternalAxiosRequestConfig,
    retryCount = 1
  ): Promise<T> {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        let response: AxiosResponse;
        
        switch (method) {
          case 'get':
            response = await this.client.get(url, config);
            break;
          case 'post':
            response = await this.client.post(url, data, config);
            break;
          case 'put':
            response = await this.client.put(url, data, config);
            break;
          case 'patch':
            response = await this.client.patch(url, data, config);
            break;
          case 'delete':
            response = await this.client.delete(url, config);
            break;
          default:
            throw new Error(`Unsupported HTTP method: ${method}`);
        }

        return response.data;
      } catch (error: unknown) {
        if (attempt === retryCount) throw error;
        
        // Exponential backoff for retries
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retry attempts reached');
  }

  clearCache(): void {
    this.cache.clear();
  }

  setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  removeAuthToken(): void {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  }
}

export default UnifiedApiCore;
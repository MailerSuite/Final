export * from './campaign'

// Basic API response structure
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  error?: string;
  status?: number;
}

// Generic API error response
export interface ApiError {
  message: string;
  status: number;
  details?: any;
}

// Paginated response structure
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

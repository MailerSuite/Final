/**
 * 🔧 Centralized API Exports
 * Single source of truth for all API functionality
 * Consolidates all API clients into one stable interface
 */

// Export the stable API client as the primary interface
export { 
  apiClient, 
  default as apiClientDefault,
  validateResponse,
  type StandardAPIResponse,
  type APIError,
  type PaginationParams,
  type ValidationError
} from '@/http/stable-api-client';

// Re-export for backward compatibility
export { apiClient as default } from '@/http/stable-api-client';

// Export the axios instance for advanced use cases
export { getAxiosInstance } from '@/http/stable-api-client';

/**
 * 🔧 Axios Instance - Re-exports from stable API client
 * Provides backward compatibility for existing imports
 * All functionality now comes from the stable API client
 */

// Re-export the stable API client's axios instance
export { apiClient as default, getAxiosInstance } from './stable-api-client';

// For backward compatibility, also export as axiosInstance
export const axiosInstance = apiClient.getAxiosInstance();

// Re-export types
export type { 
  StandardAPIResponse, 
  APIError, 
  PaginationParams, 
  ValidationError 
} from './stable-api-client';

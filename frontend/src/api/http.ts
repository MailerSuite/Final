import { apiDebugger } from '../utils/api-debug';
import { errorHandler } from '../utils/enhanced-error-handler';
import { axiosInstance } from '../http/axios';

axiosInstance.interceptors.request.use(
  (config) => {
    // Add request timing
    (config as any).startTime = Date.now();
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log('🟡 [API] Request:', {
        url: config.url,
        method: config.method?.toUpperCase(),
        baseURL: config.baseURL,
        headers: config.headers,
      });
    }
    
    return config;
  },
  (error) => {
    apiDebugger.logError(error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    // Log success with timing
    const startTime = (response.config as any).startTime;
    apiDebugger.logSuccess(response, response.config, startTime);
    
    return response;
  },
  async (error) => {
    // Enhanced error handling with debugging
    const startTime = (error.config as any)?.startTime;
    
    try {
      await errorHandler.handleError(error, error.config);
    } catch (handledError) {
      // Error handler threw, so we continue with the original error
    }
    
    return Promise.reject(error);
  }
); 
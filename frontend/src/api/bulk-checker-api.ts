import { apiClient } from '@/http/apiClient';

// In development, always prefer the Vite proxy ("/api") to avoid CORS.
// Keep env override for deployment builds.
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

interface BulkCheckRequest {
  combo_data: string;
  max_threads?: number;
  timeout?: number;
  enable_proxy?: boolean;
  enable_inbox_test?: boolean;
}

interface BulkCheckResponse {
  job_id: string;
  total_combos: number;
  message: string;
  estimated_duration?: string;
}

interface CheckProgressResponse {
  job_id: string;
  session_id: string;
  is_running: boolean;
  total: number;
  checked: number;
  valid: number;
  invalid: number;
  errors: number;
  percentage: number;
  speed: number;
  estimated_completion?: string;
  elapsed_time: string;
}

interface MessageResponse {
  message: string;
}

export const bulkCheckerApi = {
  // SMTP Bulk Checker endpoints
  async startSMTPBulkCheck(workspaceId: string, request: BulkCheckRequest): Promise<BulkCheckResponse> {
    const response = await apiClient.post(`/api/v1/bulk-checker/${workspaceId}/smtp/bulk`, request);
    return response.data;
  },

  async startSMTPFileCheck(workspaceId: string, formData: FormData): Promise<BulkCheckResponse> {
    const response = await apiClient.post(
      `/api/v1/bulk-checker/${workspaceId}/smtp/bulk-file`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async getSMTPProgress(workspaceId: string, jobId: string): Promise<CheckProgressResponse> {
    const response = await apiClient.get(`/api/v1/bulk-checker/${workspaceId}/smtp/progress/${jobId}`);
    return response.data;
  },

  async stopSMTPCheck(workspaceId: string, jobId: string): Promise<MessageResponse> {
    const response = await apiClient.post(`/api/v1/bulk-checker/${workspaceId}/smtp/stop/${jobId}`);
    return response.data;
  },

  async getSMTPResults(workspaceId: string, jobId: string): Promise<unknown> {
    const response = await apiClient.get(`/api/v1/bulk-checker/${workspaceId}/smtp/results/${jobId}`);
    return response.data;
  },

  // IMAP Bulk Checker endpoints
  async startIMAPBulkCheck(workspaceId: string, request: Omit<BulkCheckRequest, 'enable_inbox_test'>): Promise<BulkCheckResponse> {
    const response = await apiClient.post(`/api/v1/bulk-checker/${workspaceId}/imap/bulk`, request);
    return response.data;
  },

  async startIMAPFileCheck(workspaceId: string, formData: FormData): Promise<BulkCheckResponse> {
    const response = await apiClient.post(
      `/api/v1/bulk-checker/${workspaceId}/imap/bulk-file`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async getIMAPProgress(workspaceId: string, jobId: string): Promise<CheckProgressResponse> {
    const response = await apiClient.get(`/api/v1/bulk-checker/${workspaceId}/imap/progress/${jobId}`);
    return response.data;
  },

  async stopIMAPCheck(workspaceId: string, jobId: string): Promise<MessageResponse> {
    const response = await apiClient.post(`/api/v1/bulk-checker/${workspaceId}/imap/stop/${jobId}`);
    return response.data;
  },

  async getIMAPResults(workspaceId: string, jobId: string): Promise<unknown> {
    const response = await apiClient.get(`/api/v1/bulk-checker/${workspaceId}/imap/results/${jobId}`);
    return response.data;
  },
}; 
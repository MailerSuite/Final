import axios from 'axios';
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
  async startSMTPBulkCheck(sessionId: string, request: BulkCheckRequest): Promise<BulkCheckResponse> {
    const response = await apiClient.post(`/api/v1/bulk-checker/${sessionId}/smtp/bulk`, request);
    return response.data;
  },

  async startSMTPFileCheck(sessionId: string, formData: FormData): Promise<BulkCheckResponse> {
    const response = await apiClient.post(
      `/api/v1/bulk-checker/${sessionId}/smtp/bulk-file`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async getSMTPProgress(sessionId: string, jobId: string): Promise<CheckProgressResponse> {
    const response = await apiClient.get(`/api/v1/bulk-checker/${sessionId}/smtp/progress/${jobId}`);
    return response.data;
  },

  async stopSMTPCheck(sessionId: string, jobId: string): Promise<MessageResponse> {
    const response = await apiClient.post(`/api/v1/bulk-checker/${sessionId}/smtp/stop/${jobId}`);
    return response.data;
  },

  async getSMTPResults(sessionId: string, jobId: string): Promise<any> {
    const response = await apiClient.get(`/api/v1/bulk-checker/${sessionId}/smtp/results/${jobId}`);
    return response.data;
  },

  // IMAP Bulk Checker endpoints
  async startIMAPBulkCheck(sessionId: string, request: Omit<BulkCheckRequest, 'enable_inbox_test'>): Promise<BulkCheckResponse> {
    const response = await apiClient.post(`/api/v1/bulk-checker/${sessionId}/imap/bulk`, request);
    return response.data;
  },

  async startIMAPFileCheck(sessionId: string, formData: FormData): Promise<BulkCheckResponse> {
    const response = await apiClient.post(
      `/api/v1/bulk-checker/${sessionId}/imap/bulk-file`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async getIMAPProgress(sessionId: string, jobId: string): Promise<CheckProgressResponse> {
    const response = await apiClient.get(`/api/v1/bulk-checker/${sessionId}/imap/progress/${jobId}`);
    return response.data;
  },

  async stopIMAPCheck(sessionId: string, jobId: string): Promise<MessageResponse> {
    const response = await apiClient.post(`/api/v1/bulk-checker/${sessionId}/imap/stop/${jobId}`);
    return response.data;
  },

  async getIMAPResults(sessionId: string, jobId: string): Promise<any> {
    const response = await apiClient.get(`/api/v1/bulk-checker/${sessionId}/imap/results/${jobId}`);
    return response.data;
  },
}; 
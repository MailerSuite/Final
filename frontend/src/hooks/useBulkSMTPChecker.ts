import { useState, useCallback } from 'react';
import { bulkCheckerApi } from '@/api/bulk-checker-api';

interface BulkCheckRequest {
  combo_data: string;
  max_threads?: number;
  timeout?: number;
  enable_proxy?: boolean;
  enable_inbox_test?: boolean;
}

interface FileCheckRequest {
  file: File;
  maxThreads?: number;
  timeout?: number;
  enableProxy?: boolean;
  enableInboxTest?: boolean;
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

export const useBulkSMTPChecker = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startBulkCheck = useCallback(async (
    sessionId: string, 
    request: BulkCheckRequest
  ): Promise<BulkCheckResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await bulkCheckerApi.startSMTPBulkCheck(sessionId, request);
      return response;
    } catch (err: unknown) {
      const errorMessage = err.message || 'Failed to start bulk check';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const startFileCheck = useCallback(async (
    sessionId: string,
    request: FileCheckRequest
  ): Promise<BulkCheckResponse> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('combo_file', request.file);
      formData.append('max_threads', (request.maxThreads || 50).toString());
      formData.append('timeout', (request.timeout || 30).toString());
      formData.append('enable_proxy', (request.enableProxy !== false).toString());
      formData.append('enable_inbox_test', (request.enableInboxTest !== false).toString());

      const response = await bulkCheckerApi.startSMTPFileCheck(sessionId, formData);
      return response;
    } catch (err: unknown) {
      const errorMessage = err.message || 'Failed to start file check';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getProgress = useCallback(async (
    sessionId: string,
    jobId: string
  ): Promise<CheckProgressResponse> => {
    try {
      const response = await bulkCheckerApi.getSMTPProgress(sessionId, jobId);
      return response;
    } catch (err: unknown) {
      const errorMessage = err.message || 'Failed to get progress';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const stopCheck = useCallback(async (
    sessionId: string,
    jobId: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await bulkCheckerApi.stopSMTPCheck(sessionId, jobId);
    } catch (err: unknown) {
      const errorMessage = err.message || 'Failed to stop check';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getResults = useCallback(async (
    sessionId: string,
    jobId: string
  ): Promise<unknown> => {
    try {
      const response = await bulkCheckerApi.getSMTPResults(sessionId, jobId);
      return response;
    } catch (err: unknown) {
      const errorMessage = err.message || 'Failed to get results';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    startBulkCheck,
    startFileCheck,
    getProgress,
    stopCheck,
    getResults,
    loading,
    error,
    clearError: () => setError(null)
  };
}; 
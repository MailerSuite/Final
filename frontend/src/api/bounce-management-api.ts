import axiosInstance from '@/http/axios';

export interface BounceProcessRequest {
  email_address: string;
  bounce_message: string;
  smtp_response?: string;
  campaign_id?: string;
}

export interface BounceResponse {
  email_address: string;
  bounce_type: string;
  category: string;
  reason: string;
  should_suppress: boolean;
  should_retry: boolean;
  retry_after_hours?: number;
  confidence: number;
  processed_at: string;
}

export interface SuppressionListEntry {
  id: number;
  email_address: string;
  suppression_type: string;
  reason: string;
  added_at: string;
  is_active: boolean;
}

export interface DeliverabilityStats {
  domain: string;
  total_sent: number;
  total_bounced: number;
  hard_bounces: number;
  soft_bounces: number;
  reputation_issues: number;
  bounce_rate: number;
  last_updated: string;
}

export interface BounceStatistics {
  total_bounces: number;
  bounce_types: Record<string, number>;
  bounce_categories: Record<string, number>;
  period_days: number;
  domain?: string;
}

export const bounceManagementApi = {
  // Process a bounce
  processBounce: async (request: BounceProcessRequest): Promise<BounceResponse> => {
    const { data } = await axiosInstance.post('/api/v1/bounce-management/process', request);
    return data;
  },

  // Get suppression list with pagination
  getSuppressionList: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    suppression_type?: string;
  } = {}): Promise<SuppressionListEntry[]> => {
    const { data } = await axiosInstance.get('/api/v1/bounce-management/suppression-list', { params });
    return data;
  },

  // Remove email from suppression list
  removeFromSuppression: async (emailAddress: string, reason?: string): Promise<{ message: string }> => {
    const { data } = await axiosInstance.delete(`/api/v1/bounce-management/suppression/${emailAddress}`, {
      params: { reason }
    });
    return data;
  },

  // Get bounce statistics
  getBounceStatistics: async (params: {
    domain?: string;
    days?: number;
  } = {}): Promise<BounceStatistics> => {
    const { data } = await axiosInstance.get('/api/v1/bounce-management/statistics', { params });
    return data;
  },

  // Get deliverability statistics by domain
  getDeliverabilityStats: async (limit: number = 20): Promise<DeliverabilityStats[]> => {
    const { data } = await axiosInstance.get('/api/v1/bounce-management/deliverability-stats', {
      params: { limit }
    });
    return data;
  },

  // Get bounce history for specific email
  getBounceHistory: async (emailAddress: string): Promise<unknown[]> => {
    const { data } = await axiosInstance.get(`/api/v1/bounce-management/bounce-history/${emailAddress}`);
    return data;
  },

  // Check suppression status for multiple emails
  checkSuppressionStatus: async (emailAddresses: string[]): Promise<{
    results: Record<string, boolean>;
    total_checked: number;
    suppressed_count: number;
  }> => {
    const { data } = await axiosInstance.post('/api/v1/bounce-management/check-suppression', {
      email_addresses: emailAddresses
    });
    return data;
  },

  // Get domain reputation
  getDomainReputation: async (domain: string): Promise<{
    domain: string;
    has_data: boolean;
    reputation_score?: number;
    reputation_level?: string;
    bounce_rate?: number;
    total_sent?: number;
    total_bounced?: number;
    hard_bounces?: number;
    soft_bounces?: number;
    reputation_issues?: number;
    last_updated?: string;
    message?: string;
  }> => {
    const { data } = await axiosInstance.get(`/api/v1/bounce-management/domain-reputation/${domain}`);
    return data;
  },

  // Bulk remove from suppression list
  bulkRemoveFromSuppression: async (emailAddresses: string[], reason?: string): Promise<{
    total_processed: number;
    success_count: number;
    failed_count: number;
    failed_addresses: string[];
  }> => {
    const { data } = await axiosInstance.post('/api/v1/bounce-management/bulk-remove-suppression', {
      email_addresses: emailAddresses,
      reason
    });
    return data;
  }
};

export default bounceManagementApi; 
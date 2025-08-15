import { apiClient } from '@/http/apiClient';

export interface SMTPProviderOption {
    value: string;
    label: string;
    description: string;
}

export interface ProviderConfigCreate {
    provider: string;
    name: string;
    credentials: Record<string, string>;
    custom_limits?: Record<string, any>;
}

export interface ProviderConfigUpdate {
    name?: string;
    is_active?: boolean;
    sending_quota_daily?: number;
    sending_quota_hourly?: number;
    sending_rate_per_second?: number;
    max_concurrent_connections?: number;
    max_message_size_mb?: number;
    max_recipients_per_message?: number;
    is_warming_up?: boolean;
    warmup_daily_increment?: number;
}

export interface ProviderConfig {
    id: string;
    provider: string;
    name: string;
    is_active: boolean;
    is_verified: boolean;
    health_status: string;
    reputation_score: number;
    smtp_host: string;
    smtp_port: number;
    limits: {
        daily: { limit: number; used: number; remaining: number };
        hourly: { limit: number; used: number; remaining: number };
        per_second: number;
        concurrent_connections: number;
    };
    warmup: {
        is_warming_up: boolean;
        current_limit: number | null;
        start_date: string | null;
    };
    created_at: string;
    updated_at: string;
}

export interface ProviderQuotaCheck {
    allowed: boolean;
    checks: Record<string, boolean>;
    quotas: Record<string, any>;
    reason?: string;
}

export interface ProviderUsageStats {
    config_id: string;
    provider: string;
    name: string;
    period_hours: number;
    total_sent: number;
    total_bounced: number;
    total_complained: number;
    total_errors: number;
    bounce_rate: number;
    complaint_rate: number;
    average_send_time_ms?: number;
    reputation_score: number;
    health_status: string;
}

export const smtpProviderApi = {
    // Get available providers
    async getAvailableProviders(): Promise<SMTPProviderOption[]> {
        const response = await apiClient.get('/smtp-providers/available');
        return response.data;
    },

    // Create a new provider configuration
    async createConfig(data: ProviderConfigCreate): Promise<ProviderConfig> {
        const response = await apiClient.post('/smtp-providers/configs', data);
        return response.data;
    },

    // Get all provider configurations
    async getConfigs(provider?: string, activeOnly = true): Promise<ProviderConfig[]> {
        const params = new URLSearchParams();
        if (provider) params.append('provider', provider);
        params.append('active_only', activeOnly.toString());

        const response = await apiClient.get(`/smtp-providers/configs?${params}`);
        return response.data;
    },

    // Get a specific provider configuration
    async getConfig(configId: string): Promise<ProviderConfig> {
        const response = await apiClient.get(`/smtp-providers/configs/${configId}`);
        return response.data;
    },

    // Update a provider configuration
    async updateConfig(configId: string, data: ProviderConfigUpdate): Promise<ProviderConfig> {
        const response = await apiClient.put(`/smtp-providers/configs/${configId}`, data);
        return response.data;
    },

    // Delete a provider configuration
    async deleteConfig(configId: string): Promise<void> {
        await apiClient.delete(`/smtp-providers/configs/${configId}`);
    },

    // Check quota for a provider
    async checkQuota(configId: string, emailsToSend = 1): Promise<ProviderQuotaCheck> {
        const response = await apiClient.get(
            `/smtp-providers/configs/${configId}/quota?emails_to_send=${emailsToSend}`
        );
        return response.data;
    },

    // Get usage statistics
    async getUsageStats(configId: string): Promise<ProviderUsageStats> {
        const response = await apiClient.get(`/smtp-providers/configs/${configId}/usage`);
        return response.data;
    },

    // Test a provider configuration
    async testConfig(configId: string, testEmail: string): Promise<any> {
        const response = await apiClient.post(`/smtp-providers/configs/${configId}/test`, {
            test_email: testEmail,
        });
        return response.data;
    },

    // Start warmup process
    async startWarmup(configId: string, dailyIncrement = 50): Promise<any> {
        const response = await apiClient.post(
            `/smtp-providers/configs/${configId}/warmup/start?daily_increment=${dailyIncrement}`
        );
        return response.data;
    },

    // Stop warmup process
    async stopWarmup(configId: string): Promise<any> {
        const response = await apiClient.post(`/smtp-providers/configs/${configId}/warmup/stop`);
        return response.data;
    },
};

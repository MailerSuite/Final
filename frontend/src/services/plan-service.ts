/**
 * Plan Service - Frontend integration for SGPT plan enforcement
 * Handles all plan-related API calls and quota management
 */

import { ApiResponse } from '../types/api';
import axios from '../http/axios';

export interface PlanInfo {
  name: string;
  code: string;
  database_tier: string;
}

export interface PlanLimits {
  max_threads: number | null;
  max_ai_calls_daily: number | null;
  max_ai_tokens_monthly: number | null;
  max_concurrent_sessions: number;
}

export interface CurrentUsage {
  ai_calls_daily: number;
  ai_tokens_monthly: number;
  ai_calls_remaining: number | null;
}

export interface ResetTimes {
  ai_calls_reset: string;
  ai_tokens_reset: string;
}

export interface PlanStatus {
  user_id: string;
  plan_info: PlanInfo;
  limits: PlanLimits;
  current_usage: CurrentUsage;
  reset_times: ResetTimes;
  features: string[];
  has_premium_support: boolean;
  database_tier: string;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  message?: string;
  limit?: number;
  current?: number;
  reset_time?: string;
  upgrade_suggestion?: {
    suggested_plan: string;
    benefit: string;
    price: string;
  };
}

export interface ThreadCheckResult {
  allowed: boolean;
  allocated_threads?: number;
  message?: string;
  limit?: number;
  requested?: number;
  upgrade_suggestion?: {
    suggested_plan: string;
    benefit: string;
    price: string;
  };
}

export interface DatabaseTierInfo {
  database_tier: string;
  plan_name: string;
  tier_info: {
    performance: string;
    description: string;
    features: string[];
  };
  note: string;
}

class PlanService {
  /**
   * Get current user's plan status and usage
   */
  async getPlanStatus(): Promise<ApiResponse<PlanStatus>> {
    const response = await axios.get<PlanStatus>('/user/plan-status');
    return { success: true, data: response.data };
  }

  /**
   * Check if user can make AI request
   */
  async checkAiQuota(tokensRequested: number = 0): Promise<ApiResponse<QuotaCheckResult>> {
    const response = await axios.post<QuotaCheckResult>('/ai/quota-check', {
      tokens_requested: tokensRequested
    });
    return { success: true, data: response.data };
  }

  /**
   * Check thread limits for campaigns
   */
  async checkThreadLimit(requestedThreads: number): Promise<ApiResponse<ThreadCheckResult>> {
    const response = await axios.post<ThreadCheckResult>('/campaigns/thread-check', {
      requested_threads: requestedThreads
    });
    return { success: true, data: response.data };
  }

  /**
   * Check if user has access to specific feature
   */
  async hasFeature(featureName: string): Promise<ApiResponse<{ has_feature: boolean }>> {
    const response = await axios.get<{ has_feature: boolean }>(`/user/features/${featureName}`);
    return { success: true, data: response.data };
  }

  /**
   * Get database tier information
   */
  async getDatabaseInfo(): Promise<ApiResponse<DatabaseTierInfo>> {
    const response = await axios.get<DatabaseTierInfo>('/user/database-info');
    return { success: true, data: response.data };
  }

  /**
   * Create AI chat request with automatic quota enforcement
   */
  async createAiChat(prompt: string): Promise<ApiResponse<{
    response: string;
    tokens_used: number;
    plan: string;
    remaining_calls?: number;
  }>> {
    const response = await axios.post('/ai/chat/protected', { prompt });
    return { success: true, data: response.data };
  }

  /**
   * Create campaign with automatic thread limit enforcement
   */
  async createCampaignWithLimits(campaignData: any): Promise<ApiResponse<{
    success: boolean;
    campaign_id: string;
    threads_allocated: number;
    database_tier: string;
    message: string;
  }>> {
    const response = await axios.post('/campaigns/protected', campaignData);
    return { success: true, data: response.data };
  }

  /**
   * Access SOCKS STREAM feature (Premium+ only)
   */
  async getSocksConfig(): Promise<ApiResponse<{
    socks_enabled: boolean;
    socks_endpoints: string[];
    message: string;
  }>> {
    const response = await axios.get('/features/socks-stream');
    return { success: true, data: response.data };
  }

  /**
   * Access Premium Support features (Deluxe+ only)
   */
  async getPremiumSupport(): Promise<ApiResponse<{
    support_channels: string[];
    sla: string;
    dedicated_manager: boolean;
    message: string;
  }>> {
    const response = await axios.get('/features/premium-support');
    return { success: true, data: response.data };
  }

  /**
   * Create session with device fingerprint
   */
  async createSession(fingerprint: string): Promise<ApiResponse<{
    message: string;
    fingerprint: string;
    ip_address: string;
    session_type: string;
  }>> {
    const response = await axios.post('/auth/session/protected', {}, {
      headers: {
        'X-Device-Fingerprint': fingerprint
      }
    });
    return { success: true, data: response.data };
  }

  /**
   * Handle quota exceeded - show user-friendly upgrade prompt
   */
  handleQuotaExceeded(quotaResult: QuotaCheckResult): {
    title: string;
    message: string;
    upgradeInfo?: {
      plan: string;
      benefit: string;
      price: string;
    };
    resetTime?: string;
  } {
    const baseResponse = {
      title: 'Usage Limit Reached',
      message: quotaResult.message || "You've hit your limit for this period.",
      resetTime: quotaResult.reset_time
    };

    if (quotaResult.upgrade_suggestion) {
      return {
        ...baseResponse,
        upgradeInfo: {
          plan: quotaResult.upgrade_suggestion.suggested_plan,
          benefit: quotaResult.upgrade_suggestion.benefit,
          price: quotaResult.upgrade_suggestion.price
        }
      };
    }

    return baseResponse;
  }

  /**
   * Handle thread limit exceeded
   */
  handleThreadLimitExceeded(threadResult: ThreadCheckResult): {
    title: string;
    message: string;
    upgradeInfo?: {
      plan: string;
      benefit: string;
      price: string;
    };
  } {
    const baseResponse = {
      title: 'Thread Limit Reached',
      message: threadResult.message || 'Your plan has reached its thread limit.'
    };

    if (threadResult.upgrade_suggestion) {
      return {
        ...baseResponse,
        upgradeInfo: {
          plan: threadResult.upgrade_suggestion.suggested_plan,
          benefit: threadResult.upgrade_suggestion.benefit,
          price: threadResult.upgrade_suggestion.price
        }
      };
    }

    return baseResponse;
  }

  /**
   * Format plan status for display
   */
  formatPlanStatus(planStatus: PlanStatus): {
    planName: string;
    tierDisplay: string;
    threadsDisplay: string;
    aiCallsDisplay: string;
    aiUsagePercent: number;
    features: string[];
    isPremiumSupport: boolean;
  } {
    const { plan_info, limits, current_usage, features, has_premium_support } = planStatus;

    return {
      planName: plan_info.name,
      tierDisplay: this.formatTierDisplay(plan_info.database_tier),
      threadsDisplay: limits.max_threads ? `${limits.max_threads} threads` : 'Unlimited threads',
      aiCallsDisplay: limits.max_ai_calls_daily 
        ? `${current_usage.ai_calls_daily}/${limits.max_ai_calls_daily} AI calls today`
        : 'Unlimited AI calls',
      aiUsagePercent: limits.max_ai_calls_daily 
        ? Math.round((current_usage.ai_calls_daily / limits.max_ai_calls_daily) * 100)
        : 0,
      features,
      isPremiumSupport: has_premium_support
    };
  }

  /**
   * Format database tier for user display
   */
  private formatTierDisplay(tier: string): string {
    const tierMap: Record<string, string> = {
      'shared': 'Shared Infrastructure',
      'premium': 'Premium Infrastructure',
      'dedicated': 'Dedicated Infrastructure'
    };
    
    return tierMap[tier] || tier;
  }

  /**
   * Generate device fingerprint for session tracking
   */
  generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('SGPT', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency || 'unknown'
    ].join('|');
    
    // Simple hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
}

export const planService = new PlanService(); 
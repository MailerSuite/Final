/**
 * Consolidated Campaign Service
 * Replaces: campaign-api.ts, mailing-api.ts, automation-api.ts, templates-api.ts, analytics-api.ts
 */

import { UnifiedApiCore, ApiResponse } from '../unified-api-core';

export interface UnifiedCampaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  templateId?: string;
  listIds: string[];
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  createdAt: string;
  scheduledAt?: string;
  completedAt?: string;
  progress: number;
  estimatedCompletion?: string;
  targetAudience?: string;
}

export interface UnifiedTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'html' | 'text' | 'mjml';
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  previewUrl?: string;
  variables?: string[];
}

export interface CampaignAnalytics {
  metrics: unknown;
  trends: unknown;
  timeline: unknown[];
  performance: {
    openRate: number;
    clickRate: number;
    conversionRate: number;
    bounceRate: number;
    unsubscribeRate: number;
  };
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  triggers: unknown[];
  actions: unknown[];
  status: 'active' | 'paused' | 'draft';
  createdAt: string;
}

class ConsolidatedCampaignService extends UnifiedApiCore {
  // =============================================================================
  // CAMPAIGN METHODS
  // =============================================================================

  async getCampaigns(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<UnifiedCampaign[]>> {
    return this.makeRequest('get', '/campaigns', undefined, {
      params,
      cache: true
    });
  }

  async getCampaign(campaignId: string): Promise<UnifiedCampaign> {
    return this.makeRequest('get', `/campaigns/${campaignId}`, undefined, {
      cache: true
    });
  }

  async createCampaign(campaignData: Partial<UnifiedCampaign>): Promise<UnifiedCampaign> {
    return this.makeRequest('post', '/campaigns', campaignData, {
      showSuccessToast: true
    });
  }

  async updateCampaign(campaignId: string, campaignData: Partial<UnifiedCampaign>): Promise<UnifiedCampaign> {
    return this.makeRequest('put', `/campaigns/${campaignId}`, campaignData, {
      showSuccessToast: true
    });
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    return this.makeRequest('delete', `/campaigns/${campaignId}`, undefined, {
      showSuccessToast: true
    });
  }

  async duplicateCampaign(campaignId: string, newName?: string): Promise<UnifiedCampaign> {
    return this.makeRequest('post', `/campaigns/${campaignId}/duplicate`, { name: newName }, {
      showSuccessToast: true
    });
  }

  // Campaign execution
  async sendCampaign(campaignId: string): Promise<{ jobId: string }> {
    return this.makeRequest('post', `/campaigns/${campaignId}/send`, {}, {
      showSuccessToast: true,
      retry: 2
    });
  }

  async scheduleCampaign(campaignId: string, scheduledAt: string): Promise<void> {
    return this.makeRequest('post', `/campaigns/${campaignId}/schedule`, { scheduledAt }, {
      showSuccessToast: true
    });
  }

  async pauseCampaign(campaignId: string): Promise<void> {
    return this.makeRequest('post', `/campaigns/${campaignId}/pause`, {}, {
      showSuccessToast: true
    });
  }

  async resumeCampaign(campaignId: string): Promise<void> {
    return this.makeRequest('post', `/campaigns/${campaignId}/resume`, {}, {
      showSuccessToast: true
    });
  }

  async cancelCampaign(campaignId: string): Promise<void> {
    return this.makeRequest('post', `/campaigns/${campaignId}/cancel`, {}, {
      showSuccessToast: true
    });
  }

  // =============================================================================
  // TEMPLATE METHODS
  // =============================================================================

  async getTemplates(params?: {
    page?: number;
    limit?: number;
    category?: string;
    type?: string;
  }): Promise<ApiResponse<UnifiedTemplate[]>> {
    return this.makeRequest('get', '/templates', undefined, {
      params,
      cache: true
    });
  }

  async getTemplate(templateId: string): Promise<UnifiedTemplate> {
    return this.makeRequest('get', `/templates/${templateId}`, undefined, {
      cache: true
    });
  }

  async createTemplate(templateData: Partial<UnifiedTemplate>): Promise<UnifiedTemplate> {
    return this.makeRequest('post', '/templates', templateData, {
      showSuccessToast: true
    });
  }

  async updateTemplate(templateId: string, templateData: Partial<UnifiedTemplate>): Promise<UnifiedTemplate> {
    return this.makeRequest('put', `/templates/${templateId}`, templateData, {
      showSuccessToast: true
    });
  }

  async deleteTemplate(templateId: string): Promise<void> {
    return this.makeRequest('delete', `/templates/${templateId}`, undefined, {
      showSuccessToast: true
    });
  }

  async duplicateTemplate(templateId: string, newName?: string): Promise<UnifiedTemplate> {
    return this.makeRequest('post', `/templates/${templateId}/duplicate`, { name: newName }, {
      showSuccessToast: true
    });
  }

  async previewTemplate(templateId: string, variables?: Record<string, any>): Promise<{ html: string; text: string }> {
    return this.makeRequest('post', `/templates/${templateId}/preview`, { variables });
  }

  // =============================================================================
  // ANALYTICS METHODS
  // =============================================================================

  async getCampaignAnalytics(campaignId: string, timeRange = '30d'): Promise<CampaignAnalytics> {
    return this.makeRequest('get', `/campaigns/${campaignId}/analytics`, undefined, {
      params: { time_range: timeRange },
      cache: true
    });
  }

  async getCampaignMetrics(campaignId: string): Promise<UnifiedCampaign['metrics']> {
    return this.makeRequest('get', `/campaigns/${campaignId}/metrics`, undefined, {
      cache: true
    });
  }

  async getOverallAnalytics(timeRange = '30d'): Promise<{
    totalCampaigns: number;
    totalSent: number;
    averageOpenRate: number;
    averageClickRate: number;
    trends: unknown;
  }> {
    return this.makeRequest('get', '/analytics/overview', undefined, {
      params: { time_range: timeRange },
      cache: true
    });
  }

  async exportAnalytics(campaignId: string, format = 'csv'): Promise<{ downloadUrl: string }> {
    return this.makeRequest('post', `/campaigns/${campaignId}/export`, { format }, {
      showSuccessToast: true
    });
  }

  // =============================================================================
  // AUTOMATION METHODS
  // =============================================================================

  async getAutomationWorkflows(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<AutomationWorkflow[]>> {
    return this.makeRequest('get', '/automation/workflows', undefined, {
      params,
      cache: true
    });
  }

  async createAutomationWorkflow(workflowData: Partial<AutomationWorkflow>): Promise<AutomationWorkflow> {
    return this.makeRequest('post', '/automation/workflows', workflowData, {
      showSuccessToast: true
    });
  }

  async updateAutomationWorkflow(workflowId: string, workflowData: Partial<AutomationWorkflow>): Promise<AutomationWorkflow> {
    return this.makeRequest('put', `/automation/workflows/${workflowId}`, workflowData, {
      showSuccessToast: true
    });
  }

  async deleteAutomationWorkflow(workflowId: string): Promise<void> {
    return this.makeRequest('delete', `/automation/workflows/${workflowId}`, undefined, {
      showSuccessToast: true
    });
  }

  async activateAutomationWorkflow(workflowId: string): Promise<void> {
    return this.makeRequest('post', `/automation/workflows/${workflowId}/activate`, {}, {
      showSuccessToast: true
    });
  }

  async pauseAutomationWorkflow(workflowId: string): Promise<void> {
    return this.makeRequest('post', `/automation/workflows/${workflowId}/pause`, {}, {
      showSuccessToast: true
    });
  }

  // =============================================================================
  // A/B TESTING METHODS
  // =============================================================================

  async createABTest(campaignId: string, testData: {
    name: string;
    variants: Array<{
      name: string;
      subject?: string;
      content?: string;
      percentage: number;
    }>;
    metric: 'open_rate' | 'click_rate' | 'conversion_rate';
    duration: number;
  }): Promise<{ testId: string }> {
    return this.makeRequest('post', `/campaigns/${campaignId}/ab-test`, testData, {
      showSuccessToast: true
    });
  }

  async getABTestResults(campaignId: string, testId: string): Promise<{
    results: unknown[];
    winner?: string;
    confidence: number;
    status: 'running' | 'completed' | 'inconclusive';
  }> {
    return this.makeRequest('get', `/campaigns/${campaignId}/ab-test/${testId}/results`);
  }

  // =============================================================================
  // BULK OPERATIONS
  // =============================================================================

  async bulkUpdateCampaigns(campaignIds: string[], updates: Partial<UnifiedCampaign>): Promise<{
    updated: number;
    failed: number;
    errors: string[];
  }> {
    return this.makeRequest('put', '/campaigns/bulk', {
      campaignIds,
      updates
    }, {
      showSuccessToast: true
    });
  }

  async bulkDeleteCampaigns(campaignIds: string[]): Promise<{
    deleted: number;
    failed: number;
    errors: string[];
  }> {
    return this.makeRequest('delete', '/campaigns/bulk', {
      campaignIds
    }, {
      showSuccessToast: true
    });
  }

  // =============================================================================
  // REAL-TIME METHODS
  // =============================================================================

  async getCampaignRealTimeMetrics(campaignId: string): Promise<UnifiedCampaign['metrics']> {
    return this.makeRequest('get', `/campaigns/${campaignId}/metrics/real-time`, undefined, {
      cache: false // Never cache real-time data
    });
  }

  // WebSocket-like polling for real-time updates
  subscribeToRealtimeUpdates(campaignId: string, callback: (metrics: unknown) => void, interval = 10000): () => void {
    const poll = async () => {
      try {
        const metrics = await this.getCampaignRealTimeMetrics(campaignId);
        callback(metrics);
      } catch (error) {
        console.error('Real-time polling error:', error);
      }
    };

    const intervalId = setInterval(poll, interval);
    
    // Initial poll
    poll();

    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}

// Create singleton instance
const campaignService = new ConsolidatedCampaignService();

export default campaignService;
export { ConsolidatedCampaignService };
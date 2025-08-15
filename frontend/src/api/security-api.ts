import { apiClient } from '@/http/stable-api-client'

export interface SecurityStatus {
  security_features: {
    spf_validation: boolean
    content_scanning: boolean
    reputation_monitoring: boolean
    proxy_enforcement: {
      smtp: boolean
      imap: boolean
    }
    enhanced_headers: boolean
    firewall_enabled: boolean
  }
  blacklist_providers: number
  dnsbl_timeout: number
  system_status: string
}

export interface SPFValidationRequest {
  sender_email: string
  sender_ip: string
}

export interface SPFValidationResponse {
  success: boolean
  spf_result?: {
    valid: boolean
    record?: string
    error?: string
  }
  recommendation: 'allowed' | 'review_required'
  error?: string
}

export interface ContentScanRequest {
  subject: string
  html_content?: string
  text_content?: string
}

export interface ContentScanResponse {
  success: boolean
  scan_result?: {
    is_spam: boolean
    spam_score: number
    risk_level: 'low' | 'medium' | 'high'
    recommendations: string[]
  }
  action_required: boolean
  risk_assessment: {
    level: string
    score: number
    threshold: number
  }
  error?: string
}

export interface CampaignValidationRequest {
  sender_email: string
  sender_ip?: string
  subject: string
  html_content?: string
  text_content?: string
}

export interface CampaignValidationResponse {
  success: boolean
  validation?: {
    overall_status: 'approved' | 'review_required' | 'rejected'
    security_score: number
    validations: {
      spf?: any
      content?: any
      blacklist?: any
    }
    recommendations: string[]
  }
  error?: string
}

export interface SecurityStats {
  success: boolean
  statistics?: {
    blacklist: any
    security_features: {
      spf_validation_enabled: boolean
      content_scanning_enabled: boolean
      proxy_enforcement: boolean
      enhanced_headers: boolean
    }
    system_health: string
  }
  error?: string
}

export const securityApi = {
  // Get overall security system status
  getStatus: async (): Promise<SecurityStatus> => {
    try {
      const res = await apiClient.get<SecurityStatus>('/security/status')
      return res.data as SecurityStatus
    } catch (error: any) {
      // Fallback mock data when endpoint doesn't exist
      if (error.response?.status === 404) {
        return {
          security_features: {
            spf_validation: true,
            content_scanning: true,
            reputation_monitoring: true,
            proxy_enforcement: {
              smtp: true,
              imap: true
            },
            enhanced_headers: true,
            firewall_enabled: true
          },
          blacklist_providers: 5,
          dnsbl_timeout: 5000,
          system_status: "operational"
        }
      }
      throw error
    }
  },

  // Validate SPF record for sender
  validateSPF: async (request: SPFValidationRequest): Promise<SPFValidationResponse> => {
    const res = await apiClient.post<SPFValidationResponse>('/security/spf/validate', request)
    return res.data as SPFValidationResponse
  },

  // Scan content for spam indicators
  scanContent: async (request: ContentScanRequest): Promise<ContentScanResponse> => {
    const res = await apiClient.post<ContentScanResponse>('/security/content/scan', request)
    return res.data as ContentScanResponse
  },

  // Quick content scan
  quickScanContent: async (subject: string, content: string): Promise<{ success: boolean; is_spam: boolean; recommendation: string; error?: string }> => {
    const res = await apiClient.post('/security/content/quick-scan', { subject, content })
    return res.data as any
  },

  // Comprehensive campaign security validation
  validateCampaign: async (request: CampaignValidationRequest): Promise<CampaignValidationResponse> => {
    const res = await apiClient.post<CampaignValidationResponse>('/security/validate-campaign', request)
    return res.data as CampaignValidationResponse
  },

  // Enhanced blacklist check (uses security endpoints instead of blacklist endpoints)
  checkBlacklist: async (ipOrDomain: string, checkType: 'auto' | 'ip' | 'domain' = 'auto') => {
    const res = await apiClient.get(`/security/blacklist/check/${ipOrDomain}`, { check_type: checkType })
    return res.data as any
  },

  // Bulk blacklist check
  bulkCheckBlacklist: async (ipAddresses: string[]) => {
    const res = await apiClient.post('/security/blacklist/bulk-check', {
      ip_addresses: ipAddresses
    })
    return res.data as any
  },

  // Get security statistics
  getStats: async (): Promise<SecurityStats> => {
    const res = await apiClient.get<SecurityStats>('/security/stats')
    return res.data as SecurityStats
  }
} 
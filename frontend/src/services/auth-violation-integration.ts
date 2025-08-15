/**
 * Auth Violation Integration - SGPT Platform
 * Example integration between auth system and violation service
 */

import { NavigateFunction } from 'react-router-dom';
import ViolationService, { ViolationData } from './violation-service';

export interface AuthResponse {
  success: boolean;
  user?: any;
  violation?: {
    allowedDevices: number;
    detectedDevices: number;
    violationCount: number;
    reason: 'fingerprint_limit' | 'login_limit';
  };
}

/**
 * Enhanced auth error handler that redirects to appropriate violation pages
 * This should be integrated into your existing auth store/service
 */
export class AuthViolationIntegration {
  
  /**
   * Handle fingerprint violations during login
   * Call this in your auth store when you receive a fingerprint_limit error
   */
  static handleFingerprintViolation(
    violationData: {
      allowedDevices: number;
      detectedDevices: number;
      violationCount: number;
    },
    navigate: NavigateFunction
  ): void {
    
    // Use violation service to determine appropriate action
    const wasRedirected = ViolationService.checkAndHandleViolations(
      violationData.allowedDevices,
      violationData.detectedDevices,
      violationData.violationCount,
      navigate
    );

    if (!wasRedirected) {
      // Fallback: show normal error if no violations detected
      console.warn('No violations detected, but fingerprint_limit received');
    }
  }

  /**
   * Example integration with existing auth flow
   * Replace your current fingerprint_limit handling with this
   */
  static async handleAuthError(
    error: any,
    navigate: NavigateFunction
  ): Promise<boolean> {
    
    if (error.status === 429) {
      const reason = error.response?.data?.reason;
      
      if (reason === "fingerprint_limit") {
        // Extract violation data from error response
        // Note: This assumes your backend sends violation details
        const violationData = error.response?.data?.violation || {
          allowedDevices: 5,
          detectedDevices: 8, // Default example values
          violationCount: 3
        };

        this.handleFingerprintViolation(violationData, navigate);
        return true; // Handled
      }
    }

    return false; // Not handled, use existing error handling
  }

  /**
   * Check if user should be redirected from protected routes
   * Call this in route guards for suspended/banned users
   */
  static checkUserStatus(
    userStatus: 'active' | 'warning' | 'suspended' | 'banned',
    navigate: NavigateFunction
  ): boolean {
    
    switch (userStatus) {
      case 'warning':
        navigate('/auth/warning', { replace: true });
        return true;
        
      case 'suspended':
        navigate('/auth/suspended', { replace: true });
        return true;
        
      case 'banned':
        navigate('/auth/banned', { replace: true });
        return true;
        
      default:
        return false;
    }
  }

  /**
   * Mock function showing how backend might return violation data
   * Your actual backend should implement this logic
   */
  static mockBackendViolationCheck(fingerprint: string): ViolationData | null {
    // This is just an example - implement in your backend
    const mockUserViolations = {
      'suspicious-fingerprint-1': {
        allowedDevices: 5,
        detectedDevices: 8,
        violationCount: 3,
        violationType: 'warning' as const
      },
      'suspended-fingerprint-2': {
        allowedDevices: 5,
        detectedDevices: 15,
        violationCount: 8,
        violationType: 'suspension' as const,
        suspensionEndTime: Date.now() + (7 * 24 * 60 * 60 * 1000)
      },
      'banned-fingerprint-3': {
        allowedDevices: 5,
        detectedDevices: 25,
        violationCount: 15,
        violationType: 'ban' as const
      }
    };

    return (mockUserViolations as any)[fingerprint] || null;
  }
}

export default AuthViolationIntegration;
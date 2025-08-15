/**
 * Violation Service - SGPT Platform
 * Handles fingerprint violation detection and navigation to appropriate warning pages
 */

export interface ViolationData {
  allowedDevices: number;
  detectedDevices: number;
  violationCount: number;
  violationType: 'warning' | 'suspension' | 'ban';
  suspensionEndTime?: number; // Unix timestamp for suspension end
}

export interface ViolationThresholds {
  warningThreshold: number;    // Devices count that triggers warning
  suspensionThreshold: number; // Devices count that triggers suspension  
  banThreshold: number;        // Devices count that triggers permanent ban
}

export class ViolationService {
  private static readonly DEFAULT_THRESHOLDS: ViolationThresholds = {
    warningThreshold: 5,     // 5 allowed devices
    suspensionThreshold: 10, // 10+ devices = suspension
    banThreshold: 20         // 20+ devices = permanent ban
  };

  /**
   * Determine violation type based on device count and violation history
   */
  static determineViolationType(
    allowedDevices: number,
    detectedDevices: number,
    violationCount: number,
    thresholds: ViolationThresholds = this.DEFAULT_THRESHOLDS
  ): 'warning' | 'suspension' | 'ban' {
    // If already has multiple violations, escalate faster
    if (violationCount >= 5) {
      return 'ban';
    }
    
    if (violationCount >= 2 && detectedDevices >= thresholds.suspensionThreshold) {
      return 'suspension';
    }

    // Based on device count violations
    if (detectedDevices >= thresholds.banThreshold) {
      return 'ban';
    } else if (detectedDevices >= thresholds.suspensionThreshold) {
      return 'suspension';
    } else if (detectedDevices > allowedDevices) {
      return 'warning';
    }

    return 'warning'; // Default fallback
  }

  /**
   * Get the appropriate route for the violation type
   */
  static getViolationRoute(violationType: 'warning' | 'suspension' | 'ban'): string {
    const routes = {
      warning: '/auth/warning',
      suspension: '/auth/suspended',
      ban: '/auth/banned'
    };

    return routes[violationType];
  }

  /**
   * Navigate to appropriate warning page based on violation data
   */
  static navigateToViolationPage(
    violationData: ViolationData,
    navigate: (path: string, options?: any) => void
  ): void {
    const route = this.getViolationRoute(violationData.violationType);
    
    // Store violation data in session storage for the warning page to access
    sessionStorage.setItem('violationData', JSON.stringify(violationData));
    
    // Navigate with replace to prevent back navigation to login
    navigate(route, { replace: true });
  }

  /**
   * Check if user should be redirected to violation page
   * This should be called during login/auth processes
   */
  static checkAndHandleViolations(
    allowedDevices: number,
    detectedDevices: number,
    violationCount: number,
    navigate: (path: string, options?: any) => void,
    thresholds?: ViolationThresholds
  ): boolean {
    // Only redirect if there are violations
    if (detectedDevices <= allowedDevices) {
      return false;
    }

    const violationType = this.determineViolationType(
      allowedDevices,
      detectedDevices,
      violationCount,
      thresholds
    );

    const violationData: ViolationData = {
      allowedDevices,
      detectedDevices,
      violationCount,
      violationType,
      suspensionEndTime: violationType === 'suspension' 
        ? Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days from now
        : undefined
    };

    this.navigateToViolationPage(violationData, navigate);
    return true;
  }

  /**
   * Get violation data from session storage
   */
  static getStoredViolationData(): ViolationData | null {
    try {
      const stored = sessionStorage.getItem('violationData');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear stored violation data
   */
  static clearViolationData(): void {
    sessionStorage.removeItem('violationData');
  }

  /**
   * Get violation severity level (0-100)
   */
  static getViolationSeverity(
    allowedDevices: number,
    detectedDevices: number,
    violationCount: number
  ): number {
    const deviceRatio = detectedDevices / allowedDevices;
    const baseScore = Math.min(deviceRatio * 50, 70); // Max 70 from device ratio
    const violationBonus = Math.min(violationCount * 10, 30); // Max 30 from violation count
    
    return Math.min(baseScore + violationBonus, 100);
  }

  /**
   * Generate user-friendly violation description
   */
  static getViolationDescription(violationData: ViolationData): string {
    const { allowedDevices, detectedDevices, violationCount } = violationData;
    
    switch (violationData.violationType) {
      case 'warning':
        return `Your account has been accessed from ${detectedDevices} devices, but only ${allowedDevices} are allowed. This suggests potential account sharing.`;
      
      case 'suspension':
        return `Your account was accessed from ${detectedDevices} devices (${allowedDevices} allowed) after ${violationCount} previous warnings. This clearly indicates account sharing.`;
      
      case 'ban':
        return `Your account was accessed from ${detectedDevices}+ devices (${allowedDevices} allowed) after multiple warnings and suspensions. This constitutes blatant account sharing.`;
      
      default:
        return 'Unusual account activity detected.';
    }
  }
}

export default ViolationService;
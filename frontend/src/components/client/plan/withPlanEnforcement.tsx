/**
 * Higher-Order Component for Plan Enforcement
 * Wraps components to automatically enforce plan limits and show upgrade prompts
 */

import React, { ComponentType, useCallback, useEffect } from 'react';
import { usePlan } from '../../hooks/usePlan';
import { planService } from '../../services/plan-service';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { ExternalLink, Shield } from 'lucide-react';

interface PlanEnforcementConfig {
  // Features required to use this component
  requiredFeatures?: string[];
  
  // Thread limits
  checkThreadLimit?: {
    maxThreads: number;
    onLimitExceeded?: (allocatedThreads: number) => void;
  };
  
  // AI quota checks
  checkAiQuota?: {
    tokensRequired?: number;
    onQuotaExceeded?: () => void;
  };
  
  // Custom enforcement logic
  customCheck?: () => Promise<{ allowed: boolean; message?: string; upgradeRequired?: boolean }>;
  
  // UI options
  showUpgradePrompt?: boolean;
  blockAccess?: boolean; // If true, completely blocks access when limits exceeded
  gracefulDegradation?: boolean; // If true, allows limited access with warnings
}

interface PlanEnforcementState {
  allowed: boolean;
  loading: boolean;
  message?: string;
  upgradeRequired?: boolean;
  allocatedThreads?: number;
}

export function withPlanEnforcement<T extends object>(
  WrappedComponent: ComponentType<T>,
  config: PlanEnforcementConfig = {}
) {
  const EnforcedComponent: React.FC<T> = (props) => {
    const {
      hasFeature,
      checkAiQuota,
      checkThreadLimit,
      showUpgradePrompt,
      showThreadLimitPrompt,
      loading: planLoading
    } = usePlan();

    const [enforcementState, setEnforcementState] = React.useState<PlanEnforcementState>({
      allowed: true,
      loading: true
    });

    // Check all plan requirements
    const checkPlanRequirements = useCallback(async () => {
      try {
        setEnforcementState(prev => ({ ...prev, loading: true }));

        // Check required features
        if (config.requiredFeatures) {
          for (const feature of config.requiredFeatures) {
            const hasAccess = await hasFeature(feature);
            if (!hasAccess) {
              setEnforcementState({
                allowed: false,
                loading: false,
                message: `This feature requires ${feature.replace('_', ' ')}. Please upgrade your plan.`,
                upgradeRequired: true
              });
              return;
            }
          }
        }

        // Check AI quota
        if (config.checkAiQuota) {
          const quotaResult = await checkAiQuota(config.checkAiQuota.tokensRequired);
          if (!quotaResult.allowed) {
            if (config.checkAiQuota.onQuotaExceeded) {
              config.checkAiQuota.onQuotaExceeded();
            }
            
            if (config.blockAccess) {
              setEnforcementState({
                allowed: false,
                loading: false,
                message: quotaResult.message,
                upgradeRequired: true
              });
              return;
            } else if (!config.gracefulDegradation) {
              showUpgradePrompt(quotaResult);
            }
          }
        }

        // Check thread limits
        if (config.checkThreadLimit) {
          const threadResult = await checkThreadLimit(config.checkThreadLimit.maxThreads);
          if (!threadResult.allowed) {
            if (config.checkThreadLimit.onLimitExceeded && threadResult.allocated_threads) {
              config.checkThreadLimit.onLimitExceeded(threadResult.allocated_threads);
            }
            
            if (config.blockAccess) {
              setEnforcementState({
                allowed: false,
                loading: false,
                message: threadResult.message,
                upgradeRequired: true
              });
              return;
            } else {
              showThreadLimitPrompt(threadResult);
              setEnforcementState({
                allowed: true,
                loading: false,
                allocatedThreads: threadResult.allocated_threads
              });
              return;
            }
          }
        }

        // Custom check
        if (config.customCheck) {
          const customResult = await config.customCheck();
          if (!customResult.allowed) {
            setEnforcementState({
              allowed: config.gracefulDegradation || false,
              loading: false,
              message: customResult.message,
              upgradeRequired: customResult.upgradeRequired || false
            });
            return;
          }
        }

        // All checks passed
        setEnforcementState({
          allowed: true,
          loading: false
        });

    } catch (error) {
      console.error('Plan enforcement check failed:', error);
      // Allow access on error to avoid breaking functionality
      setEnforcementState({
        allowed: true,
        loading: false,
        message: 'Unable to verify plan status. Please refresh if issues persist.'
      });
    }
  }, [
    hasFeature,
    checkAiQuota,
    checkThreadLimit,
    showUpgradePrompt,
    showThreadLimitPrompt,
    config
  ]);

  // Run enforcement checks when plan data is ready
  useEffect(() => {
    if (!planLoading) {
      checkPlanRequirements();
    }
  }, [planLoading, checkPlanRequirements]);

  // Show loading state
  if (enforcementState.loading || planLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-muted-foreground">Checking plan access...</span>
      </div>
    );
  }

  // Show blocked access
  if (!enforcementState.allowed && config.blockAccess) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Alert className="border-orange-200 bg-orange-50">
          <Shield className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Plan Upgrade Required</AlertTitle>
          <AlertDescription className="text-orange-700 mb-4">
            {enforcementState.message || 'This feature requires a higher plan.'}
          </AlertDescription>
          {config.showUpgradePrompt !== false && (
            <Button 
              onClick={() => window.open('/pricing', '_blank')}
              className="w-full"
            >
              Upgrade Plan
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          )}
        </Alert>
      </div>
    );
  }

  // Show warning for graceful degradation
  const WarningBanner = enforcementState.message && config.gracefulDegradation ? (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
      <Shield className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800">Plan Limit Notice</AlertTitle>
      <AlertDescription className="text-yellow-700">
        {enforcementState.message}
      </AlertDescription>
    </Alert>
  ) : null;

  // Render wrapped component with enforcement
  return (
    <div>
      {WarningBanner}
      <WrappedComponent 
        {...props} 
        planEnforcement={{
          allocatedThreads: enforcementState.allocatedThreads,
          hasWarning: !!enforcementState.message,
          warningMessage: enforcementState.message,
          refreshEnforcement: checkPlanRequirements
        }}
      />
    </div>
  );
};

EnforcedComponent.displayName = `withPlanEnforcement(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

return EnforcedComponent;
}

// Preset configurations for common use cases
export const PlanEnforcementPresets = {
  // For SOCKS STREAM features (Premium+)
  socksStream: {
    requiredFeatures: ['socks_stream'],
    blockAccess: true,
    showUpgradePrompt: true
  },

  // For Premium Support features (Deluxe+)
  premiumSupport: {
    requiredFeatures: ['premium_support'],
    blockAccess: true,
    showUpgradePrompt: true
  },

  // For AI features with quota check
  aiFeature: (tokensRequired: number = 0) => ({
    checkAiQuota: {
      tokensRequired,
      onQuotaExceeded: () => console.log('AI quota exceeded')
    },
    gracefulDegradation: true,
    showUpgradePrompt: true
  }),

  // For campaign creation with thread limits
  campaignCreation: (maxThreads: number) => ({
    checkThreadLimit: {
      maxThreads,
      onLimitExceeded: (allocated: number) => {
        console.log(`Thread limit exceeded, allocated: ${allocated}`);
      }
    },
    gracefulDegradation: true,
    showUpgradePrompt: true
  }),

  // For team features (Team+)
  teamFeature: {
    requiredFeatures: ['team_management'],
    blockAccess: true,
    showUpgradePrompt: true
  },

  // For beta features (Lifetime only)
  betaFeature: {
    requiredFeatures: ['beta_features'],
    blockAccess: true,
    showUpgradePrompt: true
  }
};

// Type for components that receive plan enforcement props
export interface WithPlanEnforcementProps {
  planEnforcement?: {
    allocatedThreads?: number;
    hasWarning: boolean;
    warningMessage?: string;
    refreshEnforcement: () => Promise<void>;
  };
} 
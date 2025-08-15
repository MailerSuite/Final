/**
 * React Hook for Plan Management
 * Provides easy access to user plan information and feature checking
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { planService, UserPlan, UpgradeInfo, PlanError } from '@/services/plan-service'
import { useCallback } from 'react'

export interface UsePlanReturn {
  userPlan: UserPlan | undefined
  hasFeature: (feature: string) => boolean
  hasFeatures: (features: string[]) => boolean
  hasAnyFeature: (features: string[]) => boolean
  isAtLeastPlan: (planCode: string) => boolean
  upgradeInfo: UpgradeInfo | null
  usageWarnings: string[]
  isLoading: boolean
  error: any
  refetch: () => void
  clearCache: () => void
}

export function usePlan(): UsePlanReturn {
  const queryClient = useQueryClient()

  const { 
    data: userPlan, 
    isLoading, 
    error,
    refetch 
  } = useQuery<UserPlan>({
    queryKey: ['userPlan'],
    queryFn: () => planService.getUserPlan(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  // Get usage warnings
  const { data: usageWarnings = [] } = useQuery({
    queryKey: ['usageWarnings'],
    queryFn: () => planService.getUsageWarnings(),
    staleTime: 60 * 1000, // 1 minute
    enabled: !!userPlan
  })

  // Get upgrade info
  const { data: upgradeInfo = null } = useQuery<UpgradeInfo | null>({
    queryKey: ['upgradeInfo', userPlan?.code],
    queryFn: () => userPlan ? planService.getUpgradeInfo(userPlan.code) : null,
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!userPlan
  })

  // Feature checking functions
  const hasFeature = useCallback((feature: string): boolean => {
    return userPlan?.features.includes(feature) || false
  }, [userPlan?.features])

  const hasFeatures = useCallback((features: string[]): boolean => {
    if (!userPlan) return false
    return features.every(feature => userPlan.features.includes(feature))
  }, [userPlan?.features])

  const hasAnyFeature = useCallback((features: string[]): boolean => {
    if (!userPlan) return false
    return features.some(feature => userPlan.features.includes(feature))
  }, [userPlan?.features])

  const isAtLeastPlan = useCallback((planCode: string): boolean => {
    if (!userPlan) return false
    const hierarchy = ['basic', 'premium', 'deluxe', 'enterprise']
    const currentIndex = hierarchy.indexOf(userPlan.code)
    const requiredIndex = hierarchy.indexOf(planCode)
    return currentIndex >= requiredIndex
  }, [userPlan?.code])

  // Clear cache function
  const clearCache = useCallback(() => {
    planService.clearCache()
    queryClient.invalidateQueries({ queryKey: ['userPlan'] })
    queryClient.invalidateQueries({ queryKey: ['usageWarnings'] })
    queryClient.invalidateQueries({ queryKey: ['upgradeInfo'] })
  }, [queryClient])

  return {
    userPlan,
    hasFeature,
    hasFeatures,
    hasAnyFeature,
    isAtLeastPlan,
    upgradeInfo,
    usageWarnings,
    isLoading,
    error,
    refetch,
    clearCache
  }
}

/**
 * Hook for checking specific feature access with loading states
 */
export function useFeatureAccess(feature: string) {
  const { userPlan, hasFeature, isLoading } = usePlan()
  
  return {
    hasAccess: hasFeature(feature),
    isLoading,
    feature,
    userPlan
  }
}

/**
 * Hook for checking multiple features access
 */
export function useFeaturesAccess(features: string[], requireAll: boolean = true) {
  const { userPlan, hasFeatures, hasAnyFeature, isLoading } = usePlan()
  
  const hasAccess = requireAll ? hasFeatures(features) : hasAnyFeature(features)
  
  return {
    hasAccess,
    isLoading,
    features,
    requireAll,
    userPlan
  }
}

/**
 * Hook for plan tier checking
 */
export function usePlanTier(minimumTier: string) {
  const { userPlan, isAtLeastPlan, isLoading } = usePlan()
  
  return {
    hasAccess: isAtLeastPlan(minimumTier),
    currentTier: userPlan?.code,
    requiredTier: minimumTier,
    isLoading,
    userPlan
  }
}

/**
 * Hook for handling plan errors
 */
export function usePlanErrorHandler() {
  return {
    handlePlanError: (error: any): PlanError => {
      return planService.handlePlanError(error)
    }
  }
} 
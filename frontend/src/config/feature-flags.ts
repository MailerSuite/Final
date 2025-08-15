// Minimal feature flags stub used by components
// Replace with real remote-config driven flags later
export type FeatureFlags = Record<string, boolean>

const defaultFlags: FeatureFlags = {
  PERFORMANCE_MONITORING: true,
  LIVE_CONSOLE: true,
  AI_FEATURES: true,
}

export function useFeatureFlags(): FeatureFlags {
  return defaultFlags
}

export function getFeatureFlag(name: string, fallback = false): boolean {
  return defaultFlags[name] ?? fallback
}

/**
 * Base UI Kit (Canonical)
 * Combines ClientUIKit v1, Admin UI Kit, and StreamlinedDesignSystem
 * - Components: shadcn/ui primitives re-exported from the app's ui directory
 * - Animations: unified exports from client kits
 */

// Components (curated, extend as needed) - proxy to stable ui barrel
export * from '@/components/ui'

// Animations (unified) — temporarily disabled to avoid dev import issues.
// Re-enable when these modules are stable under Vite HMR in your environment.
// export { containerVariants, floatingVariants, pulseVariants, slideUpVariants, scaleVariants, fadeInVariants, hyperspaceVariants, morphVariants, holographicVariants } from '@/components/client/ClientUIKit'
// export { clientAnimations } from '@/components/client/ClientUIKitEnhanced'
// export { streamlinedAnimations } from '@/components/client/StreamlinedDesignSystem'

// Canonical flag for tooling
export const BASE_UI_KIT = true


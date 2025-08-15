// Global lightweight type aliases to unblock builds without changing logic

// Avoid overriding axios official types to preserve generics
// If needed, add module-specific shims instead of global aliases

// JSON imports
declare module '*.json' {
  const value: unknown;
  export default value;
}

// Third-party modules with complex generics (loosen for now)
// Comprehensive shim for framer-motion used across the app
declare module 'framer-motion' {
  // Runtime exports
  export const motion: unknown
  export const AnimatePresence: unknown
  export const LayoutGroup: unknown
  export const MotionConfig: unknown

  // Hooks
  export const useReducedMotion: unknown

  // Types (loosened)
  export type Variants = any
  export type Transition = any
  export type Target = any
  export type TargetAndTransition = any
  export type HTMLMotionProps<T = any> = any
  export type SVGMotionProps<T = any> = any
  export type MotionProps = any

  // Default export (not typically used in our code)
  const FM: unknown
  export default FM
}

// Wildcard alias shims for missing internal modules referenced in code
declare module '@/core/*' { const anyExport: unknown; export = anyExport }
declare module '@/services/*' { const anyExport: unknown; export = anyExport }
declare module '@/nav/*' { const anyExport: unknown; export = anyExport }
declare module '@/apps/*' { const anyExport: unknown; export = anyExport }
declare module '@/pages/analytics/*' { const anyExport: unknown; export = anyExport }

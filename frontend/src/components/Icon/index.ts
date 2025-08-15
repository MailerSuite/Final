// Export all icon components with consistent API
export { default as BlacklistIcon } from './BlacklistIcon'
export { default as DomainIcon } from './DomainIcon'
export { default as InboxIcon } from './InboxIcon'
export { default as InfoIcon } from './InfoIcon'
export { default as ProxyIcon } from './ProxyIcon'
export { default as SmtpIcon } from './SmtpIcon'
export { default as TemplateIcon } from './TemplateIcon'
export { default as WarningIcon } from './WarningIcon'

// Re-export the base Icon component
export { Icon } from '../ui/icon'

// Icon size types for consistency
export type IconSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'

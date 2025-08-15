/**
 * Domain Detection Utility
 * Determines which app to load based on the current domain
 * Simplified without tenant logic
 */

export type DomainType = 'landing' | 'admin' | 'client';

export interface DomainInfo {
  type: DomainType;
}

/**
 * Detect domain type from hostname
 */
export function detectDomain(): DomainInfo {
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Development environment
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Port-based routing in development
    if (port === '8001') {
      return { type: 'admin' };
    }
    if (port === '3001') {
      return { type: 'landing' };
    }
    if (port === '3000') {
      return { type: 'client' };
    }
    
    // Path-based routing fallback
    const path = window.location.pathname;
    if (path.startsWith('/admin')) {
      return { type: 'admin' };
    }
    if (path.startsWith('/landing')) {
      return { type: 'landing' };
    }
    return { type: 'client' };
  }
  
  // Production domains
  
  // Admin domain
  if (hostname.startsWith('admin.')) {
    return { type: 'admin' };
  }
  
  // Landing page domains
  if (hostname === 'www.sgpt.com' || hostname === 'sgpt.com') {
    return { type: 'landing' };
  }
  
  // Client domains (app.*)
  if (hostname.startsWith('app.')) {
    return { type: 'client' };
  }
  
  // Default to client
  return { type: 'client' };
}

/**
 * Check if current domain is admin
 */
export function isAdminDomain(): boolean {
  return detectDomain().type === 'admin';
}

/**
 * Check if current domain is landing
 */
export function isLandingDomain(): boolean {
  return detectDomain().type === 'landing';
}

/**
 * Check if current domain is client
 */
export function isClientDomain(): boolean {
  return detectDomain().type === 'client';
}

/**
 * Get base URL for API calls
 */
export function getApiBaseUrl(): string {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_BASE || 'https://api.sgpt.com';
  }
  
  // Development
  return import.meta.env.VITE_API_BASE || '/api';
}

/**
 * Get app name for display
 */
export function getAppName(): string {
  const domain = detectDomain();
  
  switch (domain.type) {
    case 'landing':
      return 'SGPT';
    case 'admin':
      return 'SGPT Admin';
    case 'client':
      return 'SGPT App';
    default:
      return 'SGPT';
  }
}
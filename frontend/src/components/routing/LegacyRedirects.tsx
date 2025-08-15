/**
 * 🔄 Legacy Redirects - Clean redirects for backward compatibility
 * Handles all legacy route redirects to new structure
 * Updated for React Router v6 compatibility
 */

import { Navigate, useLocation } from "react-router-dom";

// ==================== LEGACY REDIRECT MAPPINGS ====================
export const LEGACY_REDIRECTS: Record<string, string> = {
  // Showcase convenience
  '/showcase': '/showcase/hub',
  
  // Legacy finalui2 redirects - now all paths work without prefix
  // Keeping empty object for backward compatibility but not redirecting

  // Public pages
  '/contact': '/contact',
  '/pricing': '/pricing',
  '/status': '/status',

  // Auth
  '/auth/sign-up': '/auth/signup',

  // Core specials
  '/ai-dashboard': '/ai-dashboard',
  '/models': '/model-selection',
  '/me': '/profile',

  // Showcase direct aliases
  '/hub': '/showcase/hub',
  '/all': '/showcase/all',
  '/ui': '/showcase/ui',

  // Admin routes
  '/admin': '/admin',
  '/admin/plans': '/admin/plans',
  '/admin/users': '/admin/users',
  '/admin/stats': '/admin/analytics',
  '/admin/chat': '/admin/chat',

  // ClientUI v2 legacy paths → new client equivalents
  '/clientui': '/client/dashboard',
  '/clientui/dashboard': '/client/dashboard',
  '/clientui/campaigns': '/client/campaigns',
  '/clientui/analytics': '/client/analytics',
  '/clientui/leads': '/client/leads',
  '/clientui/templates': '/client/templates',
  '/clientui/settings': '/client/settings',

  // Landing aliases
  '/grok': '/landing/ai',
  '/ai-landing': '/landing/ai',
};

// ==================== LEGACY REDIRECTS COMPONENT ====================
export const LegacyRedirects = () => {
  // Guard: if used outside a Router, fail gracefully instead of throwing
  try {
    const location = useLocation();
    const currentPath = location.pathname;

    const redirectTo = LEGACY_REDIRECTS[currentPath];
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
  } catch {
    // Silently no-op if router context is missing
    return null;
  }

  return null;
};

// ==================== LEGACY REDIRECT HOOK ====================
export const useLegacyRedirect = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return LEGACY_REDIRECTS[currentPath] || null;
};

export default LegacyRedirects;
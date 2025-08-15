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
  // Dashboard redirects
  '/dashboard': '/finalui2/dashboard',
  '/client-dashboard': '/finalui2/dashboard',
  '/main-dashboard': '/finalui2/dashboard',
  '/overview': '/finalui2/dashboard',

  // Analytics redirects
  '/analytics': '/finalui2/analytics',
  '/campaigns-analytics': '/finalui2/analytics',
  '/stats': '/finalui2/analytics',
  '/reports': '/finalui2/analytics',

  // Campaign redirects
  '/campaigns': '/finalui2/campaigns',
  '/email-campaigns': '/finalui2/campaigns',
  '/mail-campaigns': '/finalui2/campaigns',
  '/campaign': '/finalui2/campaigns',
  '/campaign/create': '/finalui2/campaign/create',
  '/campaigns/create': '/finalui2/campaign/create',
  '/client/campaigns/create': '/finalui2/campaign/create',
  '/campaign/edit': '/finalui2/campaigns',
  '/campaign/settings': '/finalui2/campaign/settings',
  '/analytics/campaigns': '/finalui2/analytics',
  '/mailing-dashboard/campaigns': '/finalui2/campaigns',

  // Client tool redirects
  '/leads': '/finalui2/contacts',
  '/leads/create': '/finalui2/contacts',
  '/templates': '/finalui2/templates',
  '/template': '/finalui2/templates',
  '/template/create': '/finalui2/template-builder',
  '/template/import': '/finalui2/template-builder',
  '/proxies': '/finalui2/proxies',
  '/settings': '/finalui2/settings',

  // Tool redirects
  '/imap-checker': '/finalui2/imap/checker',
  '/smtp-checker': '/finalui2/smtp/checker',
  '/clientui/imap-checker': '/finalui2/imap/checker',
  '/clientui/smtp-checker': '/finalui2/smtp/checker',
  '/email-checker': '/finalui2/blacklist-status',
  '/proxy-checker': '/finalui2/proxies/checker',
  '/domain-checker': '/finalui2/domains',
  '/proxies/checker': '/finalui2/proxies/checker',
  '/proxies/blacklist-checker': '/finalui2/proxies/blacklist-checker',
  '/blacklist': '/finalui2/blacklist-status',
  '/inbox-check': '/finalui2/inbox-check',

  // Category redirects
  '/checkers': '/finalui2/live-console',
  '/validators': '/finalui2/live-console',
  '/testing-tools': '/finalui2/performance',
  '/tools': '/finalui2/live-console',

  // Performance testing redirects
  '/performance-testing': '/finalui2/performance',
  '/load-testing': '/finalui2/performance',
  '/stress-testing': '/finalui2/performance',

  // Mailbox
  '/mailbox': '/finalui2/mailbox',
  '/mailbox/list': '/finalui2/mailbox/list',
  '/mailbox/settings': '/finalui2/mailbox/settings',

  // SMTP / IMAP detailed
  '/smtp/list': '/finalui2/smtp/list',
  '/smtp/settings': '/finalui2/smtp/settings',
  '/smtp/checker/config': '/finalui2/smtp/checker',
  '/imap': '/finalui2/imap',
  '/imap/list': '/finalui2/imap/list',
  '/imap-monitor': '/finalui2/inbox-monitor',
  '/imap-checker/host-configuration': '/finalui2/imap/checker',
  '/imap-checker/live-test-results': '/finalui2/imap/checker',
  '/imap-checker/conditions': '/finalui2/imap/checker',

  // Domains
  '/domains': '/finalui2/domains',

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
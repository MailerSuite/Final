/**
 * 🎨 AdminUI Kit - Professional Admin Interface
 * Single source of truth for all admin components and styling
 */

// Core Admin Components
export { AdminPageHeader, AdminStatsCard, AdminStatus, AdminGrid, AdminSection, AdminCard, AdminStatusBadge } from './AdminUIKit';
export { adminAnimations, adminColors, getStatusColor, getStatusBadgeVariant } from './AdminUIKit';

// Design System
export { ADMIN_SPACING, ADMIN_TYPOGRAPHY, ADMIN_LAYOUT, ADMIN_COMPONENTS, adminClassNames } from './AdminDesignSystem';

// Sidebar
export { default as AdminSidebar } from './AdminSidebar';

// Layout - removed (use MainLayout)

// Re-export commonly used UI components for admin pages
export { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export { Button } from '@/components/ui/button';
export { Badge } from '@/components/ui/badge';
export { Separator } from '@/components/ui/separator';
export { Alert, AlertDescription } from '@/components/ui/alert';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Admin-specific utilities
export const adminUtils = {
  // Color utilities
  getStatusColor: (status: string, type: 'bg' | 'text' | 'border' = 'text') => {
    const statusColors = {
      online: { bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' },
      offline: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
      warning: { bg: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500' },
      error: { bg: 'bg-red-600', text: 'text-red-600', border: 'border-red-600' },
      success: { bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-600' },
      info: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
    };
    return statusColors[status as keyof typeof statusColors]?.[type] || statusColors.offline[type];
  },

  // Status badge variants
  getStatusBadgeVariant: (status: string) => {
    const statusVariants = {
      online: 'default',
      offline: 'destructive',
      warning: 'secondary',
      error: 'destructive',
      success: 'default',
      info: 'secondary',
    };
    return statusVariants[status as keyof typeof statusVariants] || 'secondary';
  },

  // Format utilities
  formatNumber: (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  },

  formatDate: (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Validation utilities
  isValidEmail: (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  isValidUrl: (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
};

// Admin theme configuration
export const adminTheme = {
  colors: {
    primary: 'hsl(0 72% 51%)',
    secondary: 'hsl(240 3.7% 15.9%)',
    accent: 'hsl(12 76% 61%)',
    success: 'hsl(142 71% 45%)',
    warning: 'hsl(38 92% 50%)',
    danger: 'hsl(0 84% 60%)',
    info: 'hsl(217 91% 60%)',
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
};

// Default export for convenience
export default {
  components: {
    AdminPageHeader: () => import('./AdminUIKit').then(m => m.AdminPageHeader),
    AdminStatsCard: () => import('./AdminUIKit').then(m => m.AdminStatsCard),
    AdminStatus: () => import('./AdminUIKit').then(m => m.AdminStatus),
    AdminGrid: () => import('./AdminUIKit').then(m => m.AdminGrid),
    AdminSection: () => import('./AdminUIKit').then(m => m.AdminSection),
    AdminCard: () => import('./AdminUIKit').then(m => m.AdminCard),
    AdminSidebar: () => import('./AdminSidebar'),
  },
  utils: adminUtils,
  theme: adminTheme,
  animations: () => import('./AdminUIKit').then(m => m.adminAnimations),
  colors: () => import('./AdminUIKit').then(m => m.adminColors),
};


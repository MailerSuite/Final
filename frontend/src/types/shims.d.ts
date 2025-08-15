// Temporary shims for modules missing type declarations
// Prefer replacing with proper types or fixed imports later.

declare module '@tanstack/react-query';
declare module '@hookform/resolvers/zod';
declare module '@tanstack/react-table';
declare module 'react-loading-skeleton';
declare module 'embla-carousel-react';
declare module 'react-resizable-panels';
declare module '@radix-ui/react-accordion';
declare module '@radix-ui/react-alert-dialog';
declare module '@radix-ui/react-radio-group';
declare module '@radix-ui/react-toggle-group';
declare module '@radix-ui/react-toggle';
declare module 'react-select';
declare module 'react-joyride';

// Missing internal path fallbacks used across code (temporary)
declare module '@/core/error-system' { const anyExport: unknown; export = anyExport }
// Remove any-based shim for '@/http/axios' to allow real types to flow
declare module '@/config/feature-flags'
declare module '@/lib/constants/models'
declare module '@/lib/api/imap'

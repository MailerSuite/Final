// We re-export from the stable API client to guarantee symbols exist during type-checking
// This consolidates all API types into one stable interface

export { apiClient as default } from '@/http/stable-api-client';
export * from '@/http/stable-api-client';

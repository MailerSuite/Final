import React, { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import apiClient from '@/http/stable-api-client';

interface DemoModeGuardProps {
  children: React.ReactNode;
}

/**
 * DemoModeGuard
 * - Blocks destructive clicks (send, delete, save, etc.)
 * - Prevents non-GET network mutations (fetch/axios) on demo routes
 * - Shows a small floating "Demo Mode" badge
 */
const DemoModeGuard: React.FC<DemoModeGuardProps> = ({ children }) => {
  const originalFetchRef = useRef<typeof window.fetch | null>(null);
  const axiosReqInterceptorRef = useRef<number | null>(null);

  useEffect(() => {
    const isDemoRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/landing/spamgpt/demo');
    if (!isDemoRoute) return;

    const blockedKeywords = [
      'send', 'delete', 'save', 'start', 'pause', 'stop', 'connect', 'upload', 'test', 'verify', 'buy', 'subscribe',
      'checkout', 'create', 'update', 'remove', 'launch', 'import', 'export', 'start campaign'
    ];

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const clickable = target.closest('button, [type="submit"], a, [role="button"], input[type="submit"], .shad-button');
      if (!clickable) return;

      // Allow opt-out via explicit attr
      if ((clickable as HTMLElement).getAttribute('data-demo-allow') === 'true') {
        return;
      }

      const text = (clickable.textContent || '').trim().toLowerCase();
      const aria = ((clickable as HTMLElement).getAttribute('aria-label') || '').toLowerCase();
      const title = ((clickable as HTMLElement).getAttribute('title') || '').toLowerCase();
      const combined = `${text} ${aria} ${title}`;

      const isDanger = blockedKeywords.some(k => combined.includes(k));
      if (isDanger) {
        event.preventDefault();
        event.stopPropagation();
        toast({ variant: 'destructive', description: 'Demo mode: This action is disabled.' });
      }
    };

    document.addEventListener('click', handleClick, true);

    // Patch fetch to block non-GET methods
    originalFetchRef.current = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method || 'GET').toUpperCase();
      if (method !== 'GET') {
        // Simulate success without performing the action
        const body = JSON.stringify({ success: false, message: 'Demo mode: Mutation blocked' });
        return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return originalFetchRef.current!(input, init);
    };

    // Patch axios instance to block non-GET as well
    const axios = apiClient.getAxiosInstance();
    axiosReqInterceptorRef.current = axios.interceptors.request.use((config) => {
      const method = (config.method || 'get').toUpperCase();
      if (method !== 'GET') {
        // eslint-disable-next-line @typescript-eslint/return-await
        toast({ variant: 'destructive', description: 'Demo mode: API mutation blocked' });
        // Short-circuit the request with a fake fulfilled response via adapter
        config.adapter = async () => ({
          data: { success: false, message: 'Demo mode: Mutation blocked' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {}
        });
      }
      return config;
    });

    return () => {
      document.removeEventListener('click', handleClick, true);
      if (originalFetchRef.current) {
        window.fetch = originalFetchRef.current;
      }
      if (axiosReqInterceptorRef.current !== null) {
        const axios = apiClient.getAxiosInstance();
        axios.interceptors.request.eject(axiosReqInterceptorRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      {children}
      <div className="fixed bottom-4 right-4 z-50">
        <Badge variant="secondary">Demo Mode</Badge>
      </div>
    </div>
  );
};

export default DemoModeGuard;
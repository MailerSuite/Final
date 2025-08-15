import React, { useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { useDemoStore } from '@/store/demo';

interface DemoSandboxProps {
    children: React.ReactNode;
    blockApiMethods?: Array<'POST' | 'PUT' | 'PATCH' | 'DELETE'>;
    note?: string;
}

/**
 * DemoSandbox
 * - Forces demo mode on while mounted
 * - Blocks unsafe HTTP methods (POST/PUT/PATCH/DELETE) with a friendly response
 * - Renders a subtle banner indicating limited interactivity
 */
const DemoSandbox: React.FC<DemoSandboxProps> = ({
    children,
    blockApiMethods = ['POST', 'PUT', 'PATCH', 'DELETE'],
    note = 'Interactive demo — write actions are disabled',
}) => {
    const { isDemoMode, setDemoMode } = useDemoStore();

    // Patch fetch to block unsafe methods within the sandbox lifecycle
    useEffect(() => {
        const originalFetch = window.fetch;

        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            const method = (init?.method || 'GET').toUpperCase();
            if (blockApiMethods.includes(method as any)) {
                const body = JSON.stringify({ ok: false, demo: true, error: 'Demo mode: write actions are disabled' });
                return new Response(body, {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            return originalFetch(input, init);
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, [blockApiMethods]);

    // Force demo mode on while mounted
    useEffect(() => {
        const previous = isDemoMode;
        setDemoMode(true);
        return () => setDemoMode(previous);
    }, [isDemoMode, setDemoMode]);

    const Banner = useMemo(() => (
        <div className="sticky top-14 z-40 mx-4 my-2">
            <div className="flex items-center justify-between gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-200 border-amber-400/30">Demo</Badge>
                    <span>{note}</span>
                </div>
            </div>
        </div>
    ), [note]);

    return (
        <div className="relative">
            {Banner}
            {children}
        </div>
    );
};

export default DemoSandbox;

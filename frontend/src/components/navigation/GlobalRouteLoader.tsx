import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageLoader from '@/components/PageLoader';

/**
 * GlobalRouteLoader
 * Lightweight overlay that shows the branded PageLoader briefly on route changes.
 * Ensures a consistent AI loader experience when navigating between top-level pages
 * like /client and /auth/login, even when routes aren't lazy-loaded.
 */
export default function GlobalRouteLoader() {
    const location = useLocation();
    const previousPathRef = useRef<string>(location.pathname + location.search);
    const [isNavigating, setIsNavigating] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const current = location.pathname + location.search;
        if (current !== previousPathRef.current) {
            previousPathRef.current = current;
            // Start overlay immediately; keep it visible minimally to avoid flicker
            setIsNavigating(true);
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
            // Hide after a short duration; extend if needed by UX
            timeoutRef.current = window.setTimeout(() => {
                setIsNavigating(false);
                timeoutRef.current = null;
            }, 450);
        }

        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [location.pathname, location.search]);

    if (!isNavigating) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-background/70 backdrop-blur-sm flex items-center justify-center">
            <PageLoader />
        </div>
    );
}


import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'sgpt_last_route';
const EXCLUDED_PATHS = ['/auth', '/login', '/signup', '/landing', '/404'];

export default function usePersistedRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const lastSavedRouteRef = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up any invalid routes on initialization
  useEffect(() => {
    const savedRoute = localStorage.getItem(STORAGE_KEY);
    if (savedRoute && EXCLUDED_PATHS.some(path => savedRoute.startsWith(path))) {
      console.log('🧹 usePersistedRoute: Cleaning up invalid route on init:', savedRoute);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Restore last route on app initialization (only for root path when user is authenticated)
  useEffect(() => {
    const currentPath = location.pathname;
    const isRoot = currentPath === '/' || currentPath === '/landing';
    
    if (isRoot) {
      const lastRoute = localStorage.getItem(STORAGE_KEY);
      
      // Clean up any invalid routes from storage
      if (lastRoute && EXCLUDED_PATHS.some(path => lastRoute.startsWith(path))) {
        console.log('🧹 usePersistedRoute: Clearing invalid saved route:', lastRoute);
        localStorage.removeItem(STORAGE_KEY);
      }
      
      // Only restore saved routes for authenticated private routes
      // For unauthenticated users, let them stay on landing/root
      const isValidPrivateRoute = lastRoute && 
        !EXCLUDED_PATHS.some(path => lastRoute.startsWith(path)) && 
        lastRoute !== '/' && 
        lastRoute !== '/landing' &&
        !lastRoute.startsWith('/auth');
      
      if (isValidPrivateRoute) {
        // Check if this looks like a private route (dashboard, analytics, etc.)
        const privateRoutePatterns = ['/dashboard', '/analytics', '/campaigns', '/mailbox', '/admin', '/me', '/sessions', '/jobs'];
        const isPrivateRoute = privateRoutePatterns.some(pattern => lastRoute.startsWith(pattern));
        
        if (isPrivateRoute) {
          console.log('🔄 usePersistedRoute: Restoring last private route:', lastRoute);
          navigate(lastRoute, { replace: true });
        } else {
          console.log('🔄 usePersistedRoute: Staying on landing page for public navigation');
        }
      } else {
        console.log('🔄 usePersistedRoute: No valid private route to restore, staying on current page');
      }
    }
  }, [location.pathname, navigate]);

  // Save current route to localStorage (exclude auth pages) with debouncing
  useEffect(() => {
    const currentPath = location.pathname;
    const fullPath = currentPath + location.search + location.hash;
    
    // Don't save auth routes or root path
    const shouldSave = !EXCLUDED_PATHS.some(path => currentPath.startsWith(path)) && currentPath !== '/';
    
    if (shouldSave && lastSavedRouteRef.current !== fullPath) {
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce the save operation
      saveTimeoutRef.current = setTimeout(() => {
        console.log('💾 usePersistedRoute: Saving route:', fullPath);
        localStorage.setItem(STORAGE_KEY, fullPath);
        lastSavedRouteRef.current = fullPath;
      }, 200); // 200ms debounce
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [location.pathname, location.search, location.hash]);
}

// Helper function to get last saved route
export function getLastSavedRoute(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

// Helper function to clear saved route
export function clearSavedRoute(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Helper function to check if route should be preserved
export function shouldPreserveRoute(path: string): boolean {
  return !EXCLUDED_PATHS.some(excludedPath => path.startsWith(excludedPath)) && path !== '/';
}

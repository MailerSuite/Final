import React, { useEffect, useState, useRef } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Lock, UserX } from "lucide-react";
import { useSecurityContext } from "./security-provider";
import { IUser } from "../../types";
import { clearSavedRoute } from "@/hooks/usePersistedRoute";
import { useAuthStore } from "@/store/auth";
import useAuth from "@/hooks/useAuth";
import PageLoader from "@/components/PageLoader";

interface RouteGuardProps {
  children?: React.ReactNode;
  requiredAuth?: boolean;
  requiredRole?: "admin" | "user";
  adminOnly?: boolean;
  highSecurity?: boolean;
  userData?: IUser | null;
}

export const RouteGuard = ({
  children,
  requiredAuth = true,
  requiredRole,
  adminOnly = false,
  highSecurity = false,
  userData: propUserData
}: RouteGuardProps) => {
  const { isWithinRateLimit, getCurrentUsage } = useSecurityContext();
  const [isCheckingLimits, setIsCheckingLimits] = useState(true);
  const [navigationLoopCount, setNavigationLoopCount] = useState(0);
  const location = useLocation();
  const { userData: storeUserData, isLoading, token } = useAuthStore();
  const { isAdmin: isAdminFn } = useAuth();
  const lastPathRef = useRef<string>('');
  const rateLimitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigationHistoryRef = useRef<string[]>([]);

  // Use prop userData if provided, otherwise use store userData
  const userData = propUserData || storeUserData;

  // Navigation loop detection
  useEffect(() => {
    const currentPath = location.pathname;
    const history = navigationHistoryRef.current;

    // Add current path to history
    history.push(currentPath);

    // Keep only last 10 navigation entries
    if (history.length > 10) {
      history.shift();
    }

    // Check for navigation loops (same path visited 5+ times in recent history) - LESS AGGRESSIVE
    const pathOccurrences = history.filter(path => path === currentPath).length;
    if (pathOccurrences >= 5) {
      console.warn(`🔄 RouteGuard: Navigation loop detected for ${currentPath} (${pathOccurrences} times)`);
      setNavigationLoopCount(prev => prev + 1);

      // Security: Log potential route enumeration attacks (more lenient threshold)
      if (pathOccurrences >= 10) {
        console.error(`🚨 Security Alert: Potential route enumeration attack detected for ${currentPath}`);
        // Could send security alert to backend here
      }

      // FIXED: Don't redirect users away from legitimate 404/error pages - only redirect on severe abuse
      // Exception list: pages that should never trigger redirects
      const legitimateErrorPages = ['/404', '/403', '/500', '/not-found', '/unauthorized'];
      const isLegitimateErrorPage = legitimateErrorPages.some(page => currentPath === page);

      // Only redirect on SEVERE loops (15+ visits) and NOT on legitimate error pages
      if (!isLegitimateErrorPage && pathOccurrences >= 15) {
        console.warn(`🔄 RouteGuard: Breaking SEVERE navigation loop for ${currentPath} (${pathOccurrences} times)`)
        clearSavedRoute();
        window.location.href = '/client/dashboard'; // Go to enhanced dashboard
      } else if (isLegitimateErrorPage) {
        console.log(`🛡️ RouteGuard: Allowing multiple visits to legitimate error page: ${currentPath}`);
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    // Only check rate limits if path actually changed
    if (lastPathRef.current === location.pathname) {
      setIsCheckingLimits(false);
      return;
    }

    lastPathRef.current = location.pathname;

    // Skip API calls for specific public routes to prevent logout on 404/error pages
    const publicRoutesThatDontNeedApiChecks = ['/404', '/403', '/500', '/error', '/maintenance', '/not-found', '/unauthorized'];
    const isPublicErrorRoute = publicRoutesThatDontNeedApiChecks.some(route =>
      location.pathname === route || location.pathname.startsWith(route + '/')
    );

    // For ALL error pages (regardless of auth requirement), skip API calls to prevent false logouts
    if (isPublicErrorRoute) {
      console.log('⚠️ RouteGuard: Skipping API checks for error route:', location.pathname);
      setIsCheckingLimits(false);
      return;
    }

    // Additional check: Skip API calls for any path that looks like an error
    if (location.pathname.includes('error') || location.pathname.includes('404') || location.pathname.includes('not-found')) {
      console.log('⚠️ RouteGuard: Skipping API checks for error-like route:', location.pathname);
      setIsCheckingLimits(false);
      return;
    }

    // Clear any existing timeout
    if (rateLimitTimeoutRef.current) {
      clearTimeout(rateLimitTimeoutRef.current);
    }

    // Debounce rate limit checks to prevent excessive API calls
    rateLimitTimeoutRef.current = setTimeout(async () => {
      try {
        await isWithinRateLimit('route-access');
        setIsCheckingLimits(false);
      } catch (error) {
        console.error('Route access rate limit check failed:', error);
        // For error pages, don't block rendering even if rate limit check fails
        if (isPublicErrorRoute) {
          console.warn('Rate limit check failed for error page, allowing access anyway');
        }
        setIsCheckingLimits(false);
      }
    }, 100); // 100ms debounce

    return () => {
      if (rateLimitTimeoutRef.current) {
        clearTimeout(rateLimitTimeoutRef.current);
      }
    };
  }, [location.pathname, requiredAuth]); // Add requiredAuth as dependency

  // Rate limiting check
  if (isCheckingLimits || isLoading) {
    return <PageLoader />;
  }

  // If auth is required but user is not authenticated
  // Dev bypass: allow unrestricted access in development
  if (import.meta.env.DEV) {
    return <Outlet />;
  }
  if (requiredAuth && !userData) {
    clearSavedRoute();
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If auth is not required and user is authenticated, redirect to dashboard
  // EXCEPTION: Don't redirect from error pages, special pages, or tools
  if (!requiredAuth && userData) {
    const currentPath = location.pathname;
    const allowedPublicRoutesForAuthenticatedUsers = [
      '/404', '/403', '/500', '/error', '/not-found', '/unauthorized',
      '/contact', '/status', '/pricing', '/features', '/about', '/landing',
      '/deliverability-checker', // Public tool
      '/auth/warning', '/auth/suspended', '/auth/banned' // Auth status pages
    ];

    const shouldAllowAccess = allowedPublicRoutesForAuthenticatedUsers.some(route =>
      currentPath === route || currentPath.startsWith(route + '/')
    );

    if (!shouldAllowAccess) {
      return <Navigate to="/client/dashboard" replace />;
    }
  }

  // Admin route protection - isAdminFn is already available from top of component
  if (process.env.NODE_ENV === 'development' && (adminOnly || requiredRole === "admin")) {
    console.log('🔒 RouteGuard: Admin check', {
      adminOnly,
      requiredRole,
      userData: userData ? { id: userData.id, is_admin: userData.is_admin } : null,
      isAdmin: isAdminFn(),
      isLoading,
      token: !!token
    });
  }

  // FIXED: For admin routes, show loading if we have a token but no userData yet
  if ((adminOnly || requiredRole === "admin")) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 RouteGuard: Admin route check:', {
        adminOnly,
        requiredRole,
        hasToken: !!token,
        hasUserData: !!userData,
        userDataAdmin: userData?.is_admin,
        isAdmin: isAdminFn(),
        isLoading
      });
    }

    // IMPROVED: If we have a token but no userData yet, show loading (prevents race condition)
    if (token && !userData) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 RouteGuard: Have token but no user data, showing loading...');
      }
      return <PageLoader />;
    }

    // Now check admin status
    if (!isAdminFn()) {
      // Enhanced admin security: Also check if we have a token
      if (!token) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🚫 RouteGuard: No token, redirecting to login');
        }
        clearSavedRoute();
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🚫 RouteGuard: Not admin, showing access denied');
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Alert className="max-w-md">
            <UserX className="h-4 w-4" />
            <AlertDescription>
              Access denied. Administrator privileges required.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ RouteGuard: Admin access granted');
    }
  }

  // High security route additional checks
  if (highSecurity) {
    const usage = getCurrentUsage();
    const isHighRisk = usage.requests > 100 || usage.errors > 10;

    if (isHighRisk) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Alert className="max-w-md" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              High security area temporarily restricted due to elevated activity.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  return <Outlet />;
};

interface PrivateRouteProps {
  children: React.ReactNode;
  highSecurity?: boolean;
}

export const PrivateRoute = ({ children, highSecurity = false }: PrivateRouteProps) => {
  const { userData, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!userData) {
    // Clear saved route when user is not authenticated
    clearSavedRoute();
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Ensure current protected route is saved for future restoration
  const currentPath = location.pathname + location.search + location.hash;
  const excludedPaths = ['/auth', '/login', '/signup', '/landing'];
  const shouldSave = !excludedPaths.some(path => currentPath.startsWith(path)) && currentPath !== '/';

  if (shouldSave) {
    console.log('🔒 RouteGuard: Preserving protected route:', currentPath);
    localStorage.setItem('sgpt_last_route', currentPath);
  }

  return (
    <RouteGuard
      adminOnly={false}
      highSecurity={highSecurity}
      userData={userData}
    >
      {children}
    </RouteGuard>
  );
};

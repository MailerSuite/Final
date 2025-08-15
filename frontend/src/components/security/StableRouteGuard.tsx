/**
 * Stable Route Guard Component
 * Ensures all hooks are called consistently to prevent React hooks errors
 */

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
import { isAuthBypassed } from "@/utils/devMode";

interface StableRouteGuardProps {
  children: React.ReactNode;
  requiredAuth?: boolean;
  requiredRole?: "admin" | "user";
  adminOnly?: boolean;
  highSecurity?: boolean;
  userData?: IUser | null;
}

export const StableRouteGuard = ({
  children,
  requiredAuth = true,
  requiredRole,
  adminOnly = false,
  highSecurity = false,
  userData: propUserData
}: StableRouteGuardProps) => {
  const { isWithinRateLimit, getCurrentUsage } = useSecurityContext();
  const [isCheckingLimits, setIsCheckingLimits] = useState(true);
  const location = useLocation();
  const { userData: storeUserData, isLoading, token } = useAuthStore();
  const { isAdmin: isAdminFn } = useAuth();
  const lastPathRef = useRef<string>('');
  const rateLimitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use prop userData if provided, otherwise use store userData
  const userData = propUserData || storeUserData;

  // Effect for rate limiting check
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkLimits = async () => {
      try {
        if (!isWithinRateLimit(location.pathname)) {
          await new Promise(resolve => {
            timeoutId = setTimeout(resolve, 1000);
          });
        }
      } catch (error) {
        console.warn("Rate limit check failed:", error);
      } finally {
        setIsCheckingLimits(false);
      }
    };

    checkLimits();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [location.pathname, isWithinRateLimit]);

  // Now we can safely use conditional logic since all hooks are called

  // Rate limiting check
  if (isCheckingLimits || isLoading) {
    return <PageLoader />;
  }

  // DEVELOPMENT MODE: Bypass all authentication checks
  if (isAuthBypassed()) {
    console.log('🔓 DEV MODE: Bypassing authentication - allowing access to all pages');
    return <Outlet />;
  }

  // Dev bypass: allow unrestricted access in development
  if (import.meta.env.DEV) {
    return <>{children}</>;
  }

  // If auth is required but user is not authenticated
  if (requiredAuth && !userData) {
    // 🛡️ ENHANCED LOGOUT PROTECTION: Check if logout is already in progress
    const logoutInProgress = sessionStorage.getItem('logout_in_progress')
    const lastLogout = sessionStorage.getItem('last_logout_time')

    // Check if we're on an error page that shouldn't trigger auth redirects
    const currentPath = location.pathname;
    const errorPages = ['/404', '/403', '/500', '/error', '/not-found', '/unauthorized', '/maintenance'];
    const isErrorPage = errorPages.some(page =>
      currentPath === page || currentPath.startsWith(page + '/')
    );

    // Don't redirect if we're on an error page (prevents logout on legitimate 404s)
    if (isErrorPage) {
      console.warn('🛡️ StableRouteGuard: Skipping auth redirect for error page:', currentPath)
      return <>{children}</> // Allow error page to render without auth
    }

    // Don't redirect if logout happened recently (prevents redirect loops)
    if (lastLogout && (Date.now() - parseInt(lastLogout)) < 30000) {
      console.warn('🛡️ StableRouteGuard: Skipping redirect - recent logout detected')
      return <PageLoader />
    }

    // Don't redirect if logout is in progress 
    if (logoutInProgress) {
      console.warn('🛡️ StableRouteGuard: Skipping redirect - logout in progress')
      return <PageLoader />
    }

    clearSavedRoute();
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If auth is not required and user is authenticated, redirect to dashboard
  if (!requiredAuth && userData) {
    return <Navigate to="/client/dashboard" replace />;
  }

  // Admin route protection  
  if ((adminOnly || requiredRole === "admin") && userData) {
    // FIXED: For admin routes, show loading if we have a token but no userData yet
    if (token && !userData && isLoading) {
      console.log('🔄 StableRouteGuard: Loading user data for admin route...');
      return <PageLoader />;
    }

    if (!isAdminFn()) {
      console.log('🔒 StableRouteGuard: Admin access denied', {
        adminOnly,
        requiredRole,
        userData: userData ? { ...userData, is_admin: userData.is_admin } : 'null',
        isAdmin: isAdminFn(),
        isLoading,
        hasToken: !!token
      });

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
  }

  // High security route additional checks
  if (highSecurity) {
    const usage = getCurrentUsage();
    const isHighRisk = usage.requests > 100 || usage.errors > 10;

    if (isHighRisk) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Alert className="max-w-md" variant="destructive">
            <AlertDescription>
              High security area temporarily restricted due to elevated activity.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default StableRouteGuard;
/**
 * 🔐 Auth Routes - Authentication, Registration, and Security Pages
 * Handles all authentication-related routing
 */

import { Suspense, lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import { RouteGuard } from "../security/route-guard";
import PageLoader from "../PageLoader";
import RouteErrorBoundary from "./RouteErrorBoundary";

// Auth pages - Direct imports to fix dynamic import issue
import Login from "@/pages/auth/login/page";
import SignUp from "@/pages/auth/sign-up/page";

// ==================== ROUTE GUARDS ====================
const PublicRoute = ({ children }: { children: React.ReactNode }) => (
  <RouteGuard requiredAuth={false}>{children}</RouteGuard>
);

// ==================== LAZY LOADED COMPONENTS ====================
// Warning/Violation pages
const WarningPage = lazy(() => import("../../pages/auth/warning/page"));
const TemporarySuspendPage = lazy(() => import("../../pages/auth/suspended/page"));
const PermanentBanPage = lazy(() => import("../../pages/auth/banned/page"));

// ==================== ROUTE WRAPPER ====================
const RouteWrapper = ({ children, guard: GuardComponent = ({ children }) => <>{children}</> }: {
  children: React.ReactNode;
  guard?: React.ComponentType<{ children: React.ReactNode }>;
}) => (
  <GuardComponent>
    <RouteErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  </GuardComponent>
);

// ==================== AUTH ROUTES COMPONENT ====================
export const AuthRoutes = () => {
  return (
    <>
      {/* ==================== AUTH ROUTES ==================== */}
      <Route
        path="/auth/login"
        element={
          <RouteWrapper guard={PublicRoute}>
            <Login />
          </RouteWrapper>
        }
      />
      <Route
        path="/login"
        element={<Navigate to="/auth/login" replace />}
      />
      <Route
        path="/login/auth"
        element={<Navigate to="/auth/login" replace />}
      />
      <Route
        path="/auth/sign-up"
        element={
          <RouteWrapper guard={PublicRoute}>
            <SignUp />
          </RouteWrapper>
        }
      />
      <Route
        path="/signup"
        element={<Navigate to="/auth/sign-up" replace />}
      />
      <Route
        path="/sign-up"
        element={<Navigate to="/auth/sign-up" replace />}
      />

      {/* ==================== WARNING/VIOLATION ROUTES ==================== */}
      <Route
        path="/auth/warning"
        element={
          <RouteWrapper guard={PublicRoute}>
            <WarningPage />
          </RouteWrapper>
        }
      />
      <Route
        path="/auth/suspended"
        element={
          <RouteWrapper guard={PublicRoute}>
            <TemporarySuspendPage />
          </RouteWrapper>
        }
      />
      <Route
        path="/auth/banned"
        element={
          <RouteWrapper guard={PublicRoute}>
            <PermanentBanPage />
          </RouteWrapper>
        }
      />
    </>
  );
};

export default AuthRoutes;
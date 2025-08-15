import React, { useEffect } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, Outlet } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import PremiumMailLoader from '@/components/ui/PremiumMailLoader'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from 'sonner'
import GlobalLoadingOverlay from '@/components/ui/GlobalLoadingOverlay'
import CommandPalette, { useCommandPalette } from '@/components/ui/command-palette'
import FloatingActionButton from '@/components/ui/floating-action-button'
import { AnimatePresence } from 'framer-motion'
// Centralized routes moved from ./router
import { CommandLineIcon, ArrowUpIcon } from '@heroicons/react/24/outline'
import { RouteGuard } from '@/components/security/route-guard'
import { SecurityProvider } from '@/components/security/security-provider'
import { AuthProvider } from '@/context/AuthProvider'
import { AppProvider } from '@/context/AppProvider'
import RouteErrorBoundary from '@/components/routing/RouteErrorBoundary'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft, RefreshCw } from 'lucide-react'
import { initDevConsole } from '@/utils/dev-console'
// Remove sample Vite styles to avoid conflicts

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

// Lazy with optional preview delay (?slow=1)
const lazyWithDelay = (importer: () => Promise<unknown>, ms?: number) =>
  lazy(() => {
    const params = new URLSearchParams(location.search)
    const delay = ms ?? (params.has('slow') ? 1500 : 0)
    if (!delay) return importer()
    return new Promise<void>(resolve => setTimeout(resolve, delay)).then(importer)
  })

// Lazy pages
const AuthLogin = lazyWithDelay(() => import('@/pages/login/page'))
const AuthSignUp = lazy(() => import('@/pages/sign-up/page'))
const AuthForgot = lazy(() => import('@/pages/forgot/page'))
const AuthVerify2FA = lazy(() => import('@/pages/verify-2fa/page'))
const AuthBanned = lazy(() => import('@/pages/banned/page'))
const AuthSuspended = lazy(() => import('@/pages/suspended/page'))
const AuthWarning = lazy(() => import('@/pages/warning/page'))

const AdminDashboard = lazy(() => import('@/pages/admin/page'))
const AdminAnalytics = lazy(() => import('@/pages/admin/analytics/page'))
const AdminUsers = lazy(() => import('@/pages/admin/users/page'))
const AdminSettings = lazy(() => import('@/pages/admin/settings/page'))

const FinalUI2 = lazyWithDelay(() => import('@/pages/finalui2/index'))
const DashboardEnhancedStandalone = lazy(() => import('@/pages/finalui2/pages/UnifiedFunctionsDashboard'))
const HubPage = lazyWithDelay(() => import('@/pages/finalui2/pages/NavigationHub'))
const WorkspaceTestPage = lazy(() => import('@/pages/WorkspaceTestPage'))
const AnimationDemo = lazy(() => import('@/pages/AnimationDemo'))
// Removed OpenAI App shell
const ContactPage = lazy(() => import('@/pages/contact/page'))
const StatusPage = lazy(() => import('@/pages/status/page'))
const PricingPage = lazy(() => import('@/pages/pricing/page'))
const HelpPage = lazy(() => import('@/pages/help/page'))
const SupportPage = lazy(() => import('@/pages/support/page'))
const TermsPage = lazy(() => import('@/pages/legal/terms'))
const PrivacyPage = lazy(() => import('@/pages/legal/privacy'))

// Landing Pages
const SpamGPTLandingPage = lazy(() => import('@/pages/landing/spamgpt/page'))
const OptimizerDemoPage = lazy(() => import('@/pages/landing/spamgpt/demo/OptimizerDemoPage'))
const AnalyticsDemoPage = lazy(() => import('@/pages/landing/spamgpt/demo/AnalyticsDemoPage'))
const TutorDemoPage = lazy(() => import('@/pages/landing/spamgpt/demo/TutorDemoPage'))
const CampaignWizardDemoPage = lazy(() => import('@/pages/landing/spamgpt/demo/CampaignWizardDemoPage'))
const ContentGeneratorDemoPage = lazy(() => import('@/pages/landing/spamgpt/demo/ContentGeneratorDemoPage'))
const SMTPDemoPage = lazy(() => import('@/pages/landing/spamgpt/demo/SMTPDemoPage'))
const DeliverabilityDemoPage = lazy(() => import('@/pages/landing/spamgpt/demo/DeliverabilityDemoPage'))
const AssistantDemoPage = lazy(() => import('@/pages/landing/spamgpt/demo/AssistantDemoPage'))
const LandingPageIndex = lazy(() => import('@/pages/landing'))
const AILandingPlaceholder = lazy(() => import('@/pages/landing/ai/page'))
const AIOpenAIPlaceholder = lazy(() => import('@/pages/landing/ai-openai/page'))

import SkeletonAI from '@/components/ui/SkeletonAI'
import MainLayout from '@/layouts/MainLayout'

const Loading = () => (
  <SkeletonAI />
)

// Wrapper component that provides the command palette and floating action buttons
const AppWrapper: React.FC = () => {
  const commandPalette = useCommandPalette()

  // Initialize development console utilities
  useEffect(() => {
    initDevConsole();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        items={commandPalette.commands}
        placeholder="Search commands or navigate... (⌘K)"
      />

      {/* Floating Action Buttons */}
      <FloatingActionButton
        position="bottom-right"
        onClick={commandPalette.open}
        tooltip="Open Command Palette (⌘K)"
        variant="ai"
      >
        <CommandLineIcon className="h-5 w-5" />
      </FloatingActionButton>

      <FloatingActionButton
        position="bottom-right"
        offset="80px"
        onClick={scrollToTop}
        tooltip="Scroll to top"
        variant="glass"
        showOnScroll
        scrollThreshold={300}
      >
        <ArrowUpIcon className="h-5 w-5" />
      </FloatingActionButton>
    </>
  )
}

const router = createBrowserRouter([
  {
    path: '/dev/loading',
    element: <SkeletonAI />
  },
  {
    path: '/auth/login',
    element: (
      <Suspense fallback={<Loading />}>
        <AuthLogin />
        <AppWrapper />
      </Suspense>
    )
  },
  {
    path: '/auth/sign-up',
    element: (
      <Suspense fallback={<Loading />}>
        <AuthSignUp />
        <AppWrapper />
      </Suspense>
    )
  },
  {
    path: '/auth/forgot',
    element: (
      <Suspense fallback={<Loading />}>
        <AuthForgot />
        <AppWrapper />
      </Suspense>
    )
  },
  {
    path: '/auth/verify-2fa',
    element: (
      <Suspense fallback={<Loading />}>
        <AuthVerify2FA />
        <AppWrapper />
      </Suspense>
    )
  },
  {
    path: '/auth/banned',
    element: (
      <Suspense fallback={<Loading />}>
        <AuthBanned />
        <AppWrapper />
      </Suspense>
    )
  },
  {
    path: '/auth/suspended',
    element: (
      <Suspense fallback={<Loading />}>
        <AuthSuspended />
        <AppWrapper />
      </Suspense>
    )
  },
  {
    path: '/auth/warning',
    element: (
      <Suspense fallback={<Loading />}>
        <AuthWarning />
        <AppWrapper />
      </Suspense>
    )
  },
  {
    path: '/admin',
    element: (
      <AppProvider>
        <AuthProvider>
          <SecurityProvider>
            <RouteGuard requiredAuth={true} adminOnly={true}>
              <Suspense fallback={<Loading />}>
                <MainLayout>
                  <Outlet />
                </MainLayout>
                <AppWrapper />
              </Suspense>
            </RouteGuard>
          </SecurityProvider>
        </AuthProvider>
      </AppProvider>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Loading />}>
            <AdminDashboard />
          </Suspense>
        ),
      },
      {
        path: 'analytics',
        element: (
          <Suspense fallback={<Loading />}>
            <AdminAnalytics />
          </Suspense>
        ),
      },
      {
        path: 'users',
        element: (
          <Suspense fallback={<Loading />}>
            <AdminUsers />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<Loading />}>
            <AdminSettings />
          </Suspense>
        ),
      },
    ],
  },
  // Landing Pages
  {
    path: '/landing',
    element: (
      <Suspense fallback={<Loading />}>
        <LandingPageIndex />
        <AppWrapper />
      </Suspense>
    )
  },
  {
    path: '/landing/ai',
    element: (
      <Suspense fallback={<Loading />}>
        <AILandingPlaceholder />
        <AppWrapper />
      </Suspense>
    )
  },
  {
    path: '/landing/ai-openai',
    element: (
      <Suspense fallback={<Loading />}>
        <AIOpenAIPlaceholder />
        <AppWrapper />
      </Suspense>
    )
  },

  // SpamGPT Landing
  {
    path: '/landing/spamgpt',
    element: (
      <Suspense fallback={<Loading />}>
        <SpamGPTLandingPage />
        <AppWrapper />
      </Suspense>
    )
  },
  {
    path: '/landing/spamgpt/demo/optimizer',
    element: (
      <Suspense fallback={<Loading />}>
        <OptimizerDemoPage />
        <AppWrapper />
      </Suspense>
    )
  },
  {
    path: '/landing/spamgpt/demo/analytics',
    element: (
      <Suspense fallback={<Loading />}>
        <AnalyticsDemoPage />
        <AppWrapper />
      </Suspense>
    )
  },
  {
    path: '/landing/spamgpt/demo/tutor',
    element: (
      <Suspense fallback={<Loading />}>
        <TutorDemoPage />
        <AppWrapper />
      </Suspense>
    )
  },
  {
    path: '/landing/spamgpt/demo/campaign-wizard',
    element: (
      <Suspense fallback={<Loading />}>
        <CampaignWizardDemoPage />
        <AppWrapper />
      </Suspense>
    )
  },
  {
    path: '/landing/spamgpt/demo/content-generator',
    element: (
      <Suspense fallback={<Loading />}>
        <ContentGeneratorDemoPage />
        <AppWrapper />
      </Suspense>
    )
  },
  {
    path: '/landing/spamgpt/demo/smtp',
    element: (
      <Suspense fallback={<Loading />}>
        <SMTPDemoPage />
        <AppWrapper />
      </Suspense>
    )
  },
  {
    path: '/landing/spamgpt/demo/deliverability',
    element: (
      <Suspense fallback={<Loading />}>
        <DeliverabilityDemoPage />
        <AppWrapper />
      </Suspense>
    )
  },
  {
    path: '/landing/spamgpt/demo/assistant',
    element: (
      <Suspense fallback={<Loading />}>
        <AssistantDemoPage />
        <AppWrapper />
      </Suspense>
    )
  },

  // 404 Error Page - must come before the catch-all route
  {
    path: '/404',
    element: (
      <Suspense fallback={<Loading />}>
        <RouteErrorBoundary>
          <div className="min-h-screen grid place-items-center bg-background text-foreground p-4">
            <div className="w-full max-w-2xl mx-auto text-center">
              <h1 className="text-4xl font-bold text-foreground mb-4">404 - Page Not Found</h1>
              <p className="text-xl text-muted-foreground mb-8">
                The page you're looking for doesn't exist or has been moved.
              </p>
              <div className="space-y-4">
                <Link to="/dashboard" className="inline-block">
                  <Button size="lg">
                    <Home className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={() => window.history.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </RouteErrorBoundary>
      </Suspense>
    )
  },

  // Main app routes - everything handled by FinalUI2
  {
    path: '/*',
    element: (
      <Suspense fallback={<Loading />}>
        <MainLayout>
          <FinalUI2 />
        </MainLayout>
        <AppWrapper />
      </Suspense>
    ),
    errorElement: (
      <Suspense fallback={<Loading />}>
        <SkeletonAI />
      </Suspense>
    ),
  },
])

const AppContent: React.FC = () => {
  return (
    <>
      {/* Main App Router */}
      <RouterProvider router={router} />

      {/* Toast notifications */}
      <Toaster />

      {/* React Query Devtools - only in development */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="opus-ui-theme">
        <div className="relative z-10">
          <GlobalLoadingOverlay />
          <AppContent />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App;

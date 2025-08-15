import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Removed layout wrapper here; main app routes will wrap with MainLayout
// Use only global shadcn/tokens; remove local FinalUI2 CSS layers
import MailLoader from '@/components/ui/MailLoader';
import RouteErrorBoundary from '@/components/routing/RouteErrorBoundary';

// Import pages from other locations as needed
const ContactPage = lazy(() => import('@/pages/contact/page'));
const StatusPage = lazy(() => import('@/pages/status/page'));
const PricingPage = lazy(() => import('@/pages/pricing/page'));
const HelpPage = lazy(() => import('@/pages/help/page'));
const SupportPage = lazy(() => import('@/pages/support/page'));
const TermsPage = lazy(() => import('@/pages/legal/terms'));
const PrivacyPage = lazy(() => import('@/pages/legal/privacy'));
const WorkspaceTestPage = lazy(() => import('@/pages/WorkspaceTestPage'));
const AnimationDemo = lazy(() => import('@/pages/AnimationDemo'));

// Auth pages
const AuthLogin = lazy(() => import('@/pages/login/page'));
const AuthSignUp = lazy(() => import('@/pages/sign-up/page'));
const AuthForgot = lazy(() => import('@/pages/forgot/page'));
const AuthVerify2FA = lazy(() => import('@/pages/verify-2fa/page'));
const AuthBanned = lazy(() => import('@/pages/banned/page'));
const AuthSuspended = lazy(() => import('@/pages/suspended/page'));
const AuthWarning = lazy(() => import('@/pages/warning/page'));

// Admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/page'));
const AdminAnalytics = lazy(() => import('@/pages/admin/analytics/page'));
const AdminUsers = lazy(() => import('@/pages/admin/users/page'));
const AdminSettings = lazy(() => import('@/pages/admin/settings/page'));

// Landing pages
const SpamGPTLandingPage = lazy(() => import('@/pages/landing/spamgpt/page'));
const OptimizerDemoPage = lazy(() => import('@/pages/landing/spamgpt/demo/OptimizerDemoPage'));
const AnalyticsDemoPageLanding = lazy(() => import('@/pages/landing/spamgpt/demo/AnalyticsDemoPage'));
const TutorDemoPage = lazy(() => import('@/pages/landing/spamgpt/demo/TutorDemoPage'));
const CampaignWizardDemoPage = lazy(() => import('@/pages/landing/spamgpt/demo/CampaignWizardDemoPage'));
const ContentGeneratorDemoPage = lazy(() => import('@/pages/landing/spamgpt/demo/ContentGeneratorDemoPage'));
const SMTPDemoPage = lazy(() => import('@/pages/landing/spamgpt/demo/SMTPDemoPage'));
const DeliverabilityDemoPage = lazy(() => import('@/pages/landing/spamgpt/demo/DeliverabilityDemoPage'));
const AssistantDemoPage = lazy(() => import('@/pages/landing/spamgpt/demo/AssistantDemoPage'));
const LandingPageIndex = lazy(() => import('@/pages/landing'));
const AILandingPlaceholder = lazy(() => import('@/pages/landing/ai/page'));
const AIOpenAIPlaceholder = lazy(() => import('@/pages/landing/ai-openai/page'));

// Lazily-loaded pages to reduce initial parallel requests
// Deprecated dashboards removed in favor of UnifiedFunctionsDashboard
const AICampaigns = lazy(() => import('./pages/AICampaigns').then(m => ({ default: m.AICampaigns })));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage'));
const CampaignDetails = lazy(() => import('./pages/CampaignDetails'));
const CampaignCreateWizard = lazy(() => import('./pages/CampaignCreateWizard'));
const AITemplates = lazy(() => import('./pages/AITemplates').then(m => ({ default: m.AITemplates })));
const AIContacts = lazy(() => import('./pages/AIContacts').then(m => ({ default: m.AIContacts })));
const AIAnalytics = lazy(() => import('./pages/AIAnalytics').then(m => ({ default: m.AIAnalytics })));
const AIAssistant = lazy(() => import('./pages/AIAssistant').then(m => ({ default: m.AIAssistant })));
const UnifiedFunctionsDashboard = lazy(() => import('./pages/UnifiedFunctionsDashboard'));
const AISettings = lazy(() => import('./pages/AISettings').then(m => ({ default: m.AISettings })));
const AIPlayground = lazy(() => import('./pages/AIPlayground').then(m => ({ default: m.AIPlayground })));
const LiveConsolePage = lazy(() => import('./pages/LiveConsolePage'));
const LiveConsoleEnhanced = lazy(() => import('./pages/LiveConsoleEnhanced'));
const SMTPTesterPage = lazy(() => import('./pages/SMTPTesterPage'));
const SMTPCheckerPage = lazy(() => import('./pages/SMTPCheckerPage'));
const SMTPListPage = lazy(() => import('./pages/SMTPListPage'));
const SMTPSettingsPage = lazy(() => import('./pages/SMTPSettingsPage'));
const SMTPCheckerRouter = lazy(() => import('./pages/SMTPCheckerRouter'));
const LogoShowcase = lazy(() => import('./pages/LogoShowcase'));
const IMAPInboxPage = lazy(() => import('./pages/IMAPInboxPage'));
const IMAPListPage = lazy(() => import('./pages/IMAPListPage'));
const IMAPCheckerRouter = lazy(() => import('./pages/IMAPCheckerRouter'));
// Archived: BlacklistStatusPage
const BlacklistCheckerEnhanced = lazy(() => import('./pages/BlacklistCheckerEnhanced'));
const TemplateBuilderPage = lazy(() => import('./pages/TemplateBuilderPage'));
const TemplateBuilderEnhanced = lazy(() => import('./pages/TemplateBuilderEnhanced'));
const LiveAnalyticsPage = lazy(() => import('./pages/LiveAnalyticsPage'));
const ProxiesPage = lazy(() => import('./pages/ProxiesPage'));
const ProxyManagerPage = lazy(() => import('./pages/ProxyManagerPage'));
const DomainsPage = lazy(() => import('./pages/DomainsPage'));
const MailboxPage = lazy(() => import('./pages/MailboxPage'));
const MailboxListPage = lazy(() => import('./pages/MailboxListPage'));
const MailboxSettingsPage = lazy(() => import('./pages/MailboxSettingsPage'));
const InboxCheckPage = lazy(() => import('./pages/InboxCheckPage'));
const PerformanceTestingPage = lazy(() => import('./pages/PerformanceTestingPage'));
const MailingDashboard = lazy(() => import('./pages/MailingDashboard'));
const EmailManagementPage = lazy(() => import('./pages/EmailManagementPage'));
const NavigationHub = lazy(() => import('./pages/NavigationHub'));
// Deprecated marketing dashboard removed
const AccountRouter = lazy(() => import('./pages/AccountRouter'));

// New UI Flow Pages
const MarketplacePage = lazy(() => import('../integrations/MarketplacePage'))
const DeliverabilityDashboard = lazy(() => import('../deliverability/DeliverabilityDashboard'))

// Recent AI Pages
const AIAnalyticsDashboard = lazy(() => import('./pages/AIAnalyticsDashboard'));
const AIContentGenerator = lazy(() => import('./pages/AIContentGenerator'));
const AIContentPersonalizer = lazy(() => import('./pages/AIContentPersonalizer'));
const AIEmailOptimizer = lazy(() => import('./pages/AIEmailOptimizer'));
const AILeadScorer = lazy(() => import('./pages/AILeadScorer'));
const LeadBasesPage = lazy(() => import('./pages/LeadBasesPage'));
const SegmentBuilderPage = lazy(() => import('./pages/SegmentBuilderPage'));
const ComplianceManagementPage = lazy(() => import('./pages/ComplianceManagementPage'));
const AdvancedReportingPage = lazy(() => import('./pages/AdvancedReportingPage'));
const BounceManagementPage = lazy(() => import('./pages/BounceManagementPage'));
const SmtpPoolPage = lazy(() => import('../pools/SmtpPoolPage'));
const ProxyPoolPage = lazy(() => import('../pools/ProxyPoolPage'));
const SpamTutorPage = lazy(() => import('../ai-tutor/SpamTutorPage'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const TestPage = lazy(() => import('../TestPage'));

export const FinalUI2: React.FC = () => {
  console.log('🚀 FinalUI2 component rendered, current path:', window.location.pathname);

  return (
    <Suspense fallback={<div className="p-10 flex items-center justify-center"><MailLoader icon="paper" size="xl" variant="ring" /></div>}>
      <RouteErrorBoundary>
        <Routes>
          {/* Root navigation */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard routes */}
          <Route path="/dashboard" element={<UnifiedFunctionsDashboard />} />
          <Route path="/dashboard/unified" element={<UnifiedFunctionsDashboard />} />
          <Route path="/hub" element={<NavigationHub />} />
          
          {/* Static pages */}
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/legal/terms" element={<TermsPage />} />
          <Route path="/legal/privacy" element={<PrivacyPage />} />
          
          {/* Auth routes */}
          <Route path="/auth/login" element={<AuthLogin />} />
          <Route path="/auth/sign-up" element={<AuthSignUp />} />
          <Route path="/auth/forgot" element={<AuthForgot />} />
          <Route path="/auth/verify-2fa" element={<AuthVerify2FA />} />
          <Route path="/auth/banned" element={<AuthBanned />} />
          <Route path="/auth/suspended" element={<AuthSuspended />} />
          <Route path="/auth/warning" element={<AuthWarning />} />
          <Route path="/onboarding" element={<AuthLogin />} />
          
          {/* Admin routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          
          {/* Test pages */}
          <Route path="/workspace-test" element={<WorkspaceTestPage />} />
          <Route path="/animation-demo" element={<AnimationDemo />} />
          {/* Legacy routes kept for compatibility */}
          <Route path="/dashboard-ai" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard-enhanced" element={<Navigate to="/dashboard" replace />} />
          <Route path="/marketing-dashboard" element={<Navigate to="/dashboard" replace />} />
          {/* Showcase and SidebarDemo removed */}
          <Route path="/logo-showcase" element={<LogoShowcase />} />
          <Route path="/campaigns/*" element={<CampaignsPage />} />
          <Route path="/campaigns/create" element={<CampaignCreateWizard />} />
          <Route path="/campaigns/:id" element={<CampaignDetails />} />
          <Route path="/campaigns-old/*" element={<AICampaigns />} />
          <Route path="/templates/*" element={<AITemplates />} />
          <Route path="/contacts/*" element={<AIContacts />} />
          <Route path="/lead-bases" element={<LeadBasesPage />} />
          <Route path="/segments" element={<SegmentBuilderPage />} />
          <Route path="/compliance" element={<ComplianceManagementPage />} />
          <Route path="/reporting" element={<AdvancedReportingPage />} />
          <Route path="/bounce-management" element={<BounceManagementPage />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/analytics-dashboard" element={<AIAnalyticsDashboard />} />
          <Route path="/content-generator" element={<AIContentGenerator />} />
          <Route path="/content-personalizer" element={<AIContentPersonalizer />} />
          <Route path="/email-optimizer" element={<AIEmailOptimizer />} />
          <Route path="/lead-scorer" element={<AILeadScorer />} />
          <Route path="/ai-tutor" element={<SpamTutorPage />} />
          <Route path="/assistant" element={<AIAssistant />} />
          <Route path="/playground" element={<AIPlayground />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/settings/*" element={<AISettings />} />
          {/* Account management */}
          <Route path="/account/*" element={<AccountRouter />} />

          {/* New UI Flows */}
          <Route path="/integrations" element={<MarketplacePage />} />
          <Route path="/deliverability" element={<DeliverabilityDashboard />} />

          {/* Live Tools */}
          {/* Blacklist routes */}
          <Route path="/blacklist-status" element={<BlacklistCheckerEnhanced />} />
          <Route path="/blacklist" element={<BlacklistCheckerEnhanced />} />
          <Route path="/smtp-checker" element={<SMTPCheckerPage />} />
          <Route path="/smtp-tester" element={<SMTPTesterPage />} />
          <Route path="/imap-inbox" element={<IMAPInboxPage />} />
          {/* SMTP suite parity */}
          <Route path="/smtp/list" element={<SMTPListPage />} />
          <Route path="/smtp/settings" element={<SMTPSettingsPage />} />
          <Route path="/smtp/checker" element={<SMTPCheckerRouter />} />
          {/* IMAP suite parity */}
          <Route path="/imap" element={<IMAPListPage />} />
          <Route path="/imap/list" element={<IMAPListPage />} />
          <Route path="/imap/checker" element={<IMAPCheckerRouter />} />
          <Route path="/inbox-monitor" element={<IMAPInboxPage />} />
          <Route path="/live-console" element={<LiveConsoleEnhanced />} />
          {/* Archived: blacklist-status standalone page */}
          <Route path="/live-analytics" element={<LiveAnalyticsPage />} />
          <Route path="/proxies" element={<ProxiesPage />} />
          <Route path="/proxies/checker" element={<ProxiesPage />} />
          <Route path="/proxies/blacklist-checker" element={<BlacklistCheckerEnhanced />} />
          <Route path="/proxy-manager" element={<ProxyManagerPage />} />
          <Route path="/proxy-pool" element={<ProxyPoolPage />} />
          <Route path="/smtp-pool" element={<SmtpPoolPage />} />
          <Route path="/domains" element={<DomainsPage />} />
          {/* Mailbox parity */}
          <Route path="/mailbox" element={<MailboxPage />} />
          <Route path="/mailbox/list" element={<MailboxListPage />} />
          <Route path="/mailbox/settings" element={<MailboxSettingsPage />} />
          <Route path="/inbox-check" element={<InboxCheckPage />} />
          <Route path="/performance" element={<PerformanceTestingPage />} />
          <Route path="/mailing-dashboard" element={<MailingDashboard />} />
          <Route path="/email-management" element={<EmailManagementPage />} />
          <Route path="/template-builder" element={<TemplateBuilderEnhanced />} />
          {/* Legacy dashboard removed */}
          {/* Campaign parity */}
          <Route path="/campaign/create" element={<CampaignCreateWizard />} />
          <Route path="/campaign/settings" element={<CampaignsPage />} />

          {/* Legacy Live Routes for backward compatibility */}
          <Route path="/live/console" element={<LiveConsolePage />} />
          <Route path="/live/smtp" element={<SMTPCheckerPage />} />
          <Route path="/live/imap" element={<IMAPInboxPage />} />
          <Route path="/live/blacklist" element={<BlacklistCheckerEnhanced />} />
          <Route path="/live/templates" element={<TemplateBuilderPage />} />
          <Route path="/live/analytics" element={<LiveAnalyticsPage />} />
          <Route path="/live/proxies" element={<ProxiesPage />} />
          <Route path="/live/domains" element={<DomainsPage />} />
          <Route path="/live/inbox-check" element={<InboxCheckPage />} />
          <Route path="/live/performance" element={<PerformanceTestingPage />} />

          {/* Legacy AI Routes redirects */}
          <Route path="/ai/content-generator" element={<Navigate to="/content-generator" replace />} />
          <Route path="/ai/email-optimizer" element={<Navigate to="/email-optimizer" replace />} />
          <Route path="/ai/analytics" element={<Navigate to="/analytics-dashboard" replace />} />
          <Route path="/ai/lead-scorer" element={<Navigate to="/lead-scorer" replace />} />
          <Route path="/ai/personalizer" element={<Navigate to="/content-personalizer" replace />} />

          {/* Landing pages */}
          <Route path="/landing" element={<LandingPageIndex />} />
          <Route path="/landing/ai" element={<AILandingPlaceholder />} />
          <Route path="/landing/ai-openai" element={<AIOpenAIPlaceholder />} />
          <Route path="/landing/spamgpt" element={<SpamGPTLandingPage />} />
          <Route path="/landing/spamgpt/demo/optimizer" element={<OptimizerDemoPage />} />
          <Route path="/landing/spamgpt/demo/analytics" element={<AnalyticsDemoPageLanding />} />
          <Route path="/landing/spamgpt/demo/tutor" element={<TutorDemoPage />} />
          <Route path="/landing/spamgpt/demo/campaign-wizard" element={<CampaignWizardDemoPage />} />
          <Route path="/landing/spamgpt/demo/content-generator" element={<ContentGeneratorDemoPage />} />
          <Route path="/landing/spamgpt/demo/smtp" element={<SMTPDemoPage />} />
          <Route path="/landing/spamgpt/demo/deliverability" element={<DeliverabilityDemoPage />} />
          <Route path="/landing/spamgpt/demo/assistant" element={<AssistantDemoPage />} />
          
          {/* Debug route to verify component is working */}
          <Route path="/debug" element={<div className="p-10 text-center"><h1>FinalUI2 Router Working!</h1><p>Path: {window.location.pathname}</p></div>} />
          {/* Test route to verify basic rendering */}
          <Route path="/test-page" element={<div className="p-10 text-center"><h1>Test Page</h1><p>This is a test page to verify routing works</p></div>} />
          {/* Fallback route to catch unmatched paths */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </RouteErrorBoundary>
    </Suspense>
  );
};

export default FinalUI2;
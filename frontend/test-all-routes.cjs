#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// All routes from Sidebar.tsx navigation
const sidebarRoutes = [
  '/dashboard',
  '/campaigns',
  '/templates',
  '/contacts',
  '/lead-bases',
  '/analytics',
  '/ai-tutor',
  '/assistant',
  '/content-generator',
  '/email-optimizer',
  '/analytics-dashboard',
  '/lead-scorer',
  '/content-personalizer',
  '/smtp-checker',
  '/smtp/checker?tab=bulk',
  '/smtp-pool',
  '/imap-inbox',
  '/imap/checker?tab=host-config',
  '/live-console',
  '/blacklist-status',
  '/proxies',
  '/proxies/checker',
  '/proxy-pool',
  '/domains',
  '/performance',
  '/playground',
  '/workspace-test',
  '/animation-demo',
  '/account/profile',
  '/account/subscription',
  '/account/billing',
  '/admin',
  '/admin/users',
  '/admin/analytics',
  '/admin/settings',
  '/settings',
  '/help',
];

// Additional routes from App.tsx
const appRoutes = [
  '/',
  '/hub',
  '/contact',
  '/status',
  '/pricing',
  '/support',
  '/legal/terms',
  '/legal/privacy',
  '/onboarding',
  '/integrations',
  '/deliverability',
  '/auth/login',
  '/auth/sign-up',
  '/auth/forgot',
  '/auth/verify-2fa',
  '/auth/banned',
  '/auth/suspended',
  '/auth/warning',
  '/landing',
  '/landing/spamgpt',
  '/oauth/callback',
  '/error',
];

// FinalUI2 specific routes
const finalUI2Routes = [
  '/bounce-management',
  '/compliance',
  '/reporting',
  '/segments',
  '/test',
  '/campaigns/create',
  '/template-builder',
  '/email-management',
  '/mailing-dashboard',
  '/inbox-check',
  '/mailbox',
  '/mailbox/list',
  '/mailbox/settings',
  '/proxy-manager',
  '/live-analytics',
  '/smtp-tester',
  '/smtp/list',
  '/smtp/settings',
  '/imap',
  '/imap/list',
  '/inbox-monitor',
];

const allRoutes = [...new Set([...sidebarRoutes, ...appRoutes, ...finalUI2Routes])];

console.log('=== COMPREHENSIVE ROUTE TESTING REPORT ===\n');
console.log(`Total unique routes to test: ${allRoutes.length}\n`);

// Test each route with curl
const http = require('http');

async function testRoute(route) {
  const cleanRoute = route.split('?')[0]; // Remove query params for testing
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: cleanRoute,
      method: 'GET',
      timeout: 2000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        // Check if response contains React app HTML
        const isValidReactApp = data.includes('root') && data.includes('script');
        const hasError = data.includes('Route Not Found') || data.includes('404') || data.includes('Error');
        
        resolve({
          route: cleanRoute,
          status: res.statusCode,
          valid: res.statusCode === 200 && isValidReactApp && !hasError,
          hasError,
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        route: cleanRoute,
        status: 0,
        valid: false,
        error: error.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        route: cleanRoute,
        status: 0,
        valid: false,
        error: 'Timeout',
      });
    });

    req.end();
  });
}

// Test all routes
(async () => {
  console.log('Testing routes (this may take a moment)...\n');
  
  const results = {
    working: [],
    notFound: [],
    errors: [],
  };

  for (const route of allRoutes) {
    const result = await testRoute(route);
    
    if (result.valid) {
      results.working.push(route);
      process.stdout.write('✅');
    } else if (result.hasError || result.status === 404) {
      results.notFound.push(route);
      process.stdout.write('❌');
    } else if (result.error) {
      results.errors.push({ route, error: result.error });
      process.stdout.write('⚠️');
    } else {
      results.notFound.push(route);
      process.stdout.write('❓');
    }
  }

  console.log('\n\n=== RESULTS ===\n');
  
  console.log(`✅ Working routes: ${results.working.length}/${allRoutes.length}`);
  if (results.working.length > 0 && results.working.length <= 20) {
    results.working.forEach(route => console.log(`   ${route}`));
  }
  
  if (results.notFound.length > 0) {
    console.log(`\n❌ Routes with issues: ${results.notFound.length}`);
    results.notFound.forEach(route => console.log(`   ${route}`));
  }
  
  if (results.errors.length > 0) {
    console.log(`\n⚠️  Routes with errors: ${results.errors.length}`);
    results.errors.forEach(({ route, error }) => console.log(`   ${route}: ${error}`));
  }

  // Suggest fixes
  if (results.notFound.length > 0) {
    console.log('\n📝 SUGGESTED FIXES:');
    console.log('1. Check that all lazy-loaded components exist');
    console.log('2. Verify route paths match component imports');
    console.log('3. Ensure FinalUI2 nested routes are properly configured');
    console.log('4. Check for typos in route definitions');
  }

  console.log('\n✨ Route testing complete!');
})();
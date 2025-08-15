#!/usr/bin/env node

const http = require('http');

// Key routes with expected content
const routeTests = [
  { path: '/dashboard', expectedContent: ['Dashboard', 'Welcome'] },
  { path: '/campaigns', expectedContent: ['Campaign'] },
  { path: '/templates', expectedContent: ['Template'] },
  { path: '/contacts', expectedContent: ['Contact'] },
  { path: '/lead-bases', expectedContent: ['Lead'] },
  { path: '/analytics', expectedContent: ['Analytics'] },
  { path: '/ai-tutor', expectedContent: ['Tutor', 'AI', 'Spam'] },
  { path: '/assistant', expectedContent: ['Assistant', 'AI'] },
  { path: '/content-generator', expectedContent: ['Content', 'Generator'] },
  { path: '/email-optimizer', expectedContent: ['Email', 'Optimizer'] },
  { path: '/analytics-dashboard', expectedContent: ['Analytics'] },
  { path: '/lead-scorer', expectedContent: ['Lead', 'Score'] },
  { path: '/content-personalizer', expectedContent: ['Personal'] },
  { path: '/smtp-checker', expectedContent: ['SMTP'] },
  { path: '/smtp-pool', expectedContent: ['SMTP', 'Pool'] },
  { path: '/imap-inbox', expectedContent: ['IMAP', 'Inbox'] },
  { path: '/live-console', expectedContent: ['Console'] },
  { path: '/blacklist-status', expectedContent: ['Blacklist'] },
  { path: '/proxies', expectedContent: ['Prox'] },
  { path: '/proxy-pool', expectedContent: ['Proxy', 'Pool'] },
  { path: '/domains', expectedContent: ['Domain'] },
  { path: '/performance', expectedContent: ['Performance'] },
  { path: '/playground', expectedContent: ['Playground'] },
  { path: '/admin', expectedContent: ['Admin'] },
  { path: '/settings', expectedContent: ['Settings'] },
  { path: '/help', expectedContent: ['Help'] },
  { path: '/pricing', expectedContent: ['Pricing'] },
  { path: '/contact', expectedContent: ['Contact'] },
  { path: '/status', expectedContent: ['Status'] },
];

async function fetchPageContent(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: 'GET',
      timeout: 3000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          content: data,
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        path,
        status: 0,
        error: error.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        path,
        status: 0,
        error: 'Timeout',
      });
    });

    req.end();
  });
}

console.log('=== PAGE CONTENT VERIFICATION ===\n');

(async () => {
  const results = {
    passed: [],
    failed: [],
    errors: [],
  };

  for (const test of routeTests) {
    const result = await fetchPageContent(test.path);
    
    if (result.error) {
      results.errors.push({ path: test.path, error: result.error });
      process.stdout.write('⚠️');
    } else if (result.status === 200) {
      // Check if expected content is present
      const hasExpectedContent = test.expectedContent.some(keyword => 
        result.content.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasExpectedContent) {
        results.passed.push(test.path);
        process.stdout.write('✅');
      } else {
        results.failed.push({ 
          path: test.path, 
          reason: 'Missing expected content',
          expected: test.expectedContent 
        });
        process.stdout.write('❌');
      }
    } else {
      results.failed.push({ 
        path: test.path, 
        reason: `HTTP ${result.status}` 
      });
      process.stdout.write('❌');
    }
  }

  console.log('\n\n=== RESULTS ===\n');
  
  console.log(`✅ Pages with correct content: ${results.passed.length}/${routeTests.length}`);
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Pages with issues: ${results.failed.length}`);
    results.failed.forEach(({ path, reason, expected }) => {
      console.log(`   ${path}: ${reason}`);
      if (expected) {
        console.log(`      Expected keywords: ${expected.join(', ')}`);
      }
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\n⚠️  Pages with errors: ${results.errors.length}`);
    results.errors.forEach(({ path, error }) => {
      console.log(`   ${path}: ${error}`);
    });
  }

  // Summary
  const successRate = Math.round((results.passed.length / routeTests.length) * 100);
  console.log(`\n📊 Success Rate: ${successRate}%`);
  
  if (successRate === 100) {
    console.log('🎉 All pages are rendering with expected content!');
  } else if (successRate >= 90) {
    console.log('✨ Most pages are working correctly. Minor fixes needed.');
  } else if (successRate >= 70) {
    console.log('⚠️  Several pages need attention.');
  } else {
    console.log('❌ Significant issues found. Many pages need fixes.');
  }
})();
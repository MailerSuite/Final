import { test, expect } from '@playwright/test';

test.describe('Basic Route Navigation', () => {
  test('homepage should redirect to dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should load finalui2 app without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Listen for uncaught exceptions
    page.on('pageerror', err => {
      errors.push(err.message);
    });

    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we don't have critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('DevTools') && 
      !error.includes('Download the React DevTools') &&
      !error.includes('font-smoothing') &&
      !error.includes('parsing value')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('auth routes should be accessible', async ({ page }) => {
    const authRoutes = [
      '/auth/login',
      '/auth/sign-up', 
      '/auth/forgot',
    ];

    for (const route of authRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Should not show a 404 or error page
      const hasErrorMessage = await page.locator('text=404').isVisible().catch(() => false);
      expect(hasErrorMessage).toBe(false);
    }
  });

  test('admin routes should be accessible', async ({ page }) => {
    const adminRoutes = [
      '/admin',
      '/admin/users',
      '/admin/analytics',
      '/admin/settings'
    ];

    for (const route of adminRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Should not show a 404 or error page
      const hasErrorMessage = await page.locator('text=404').isVisible().catch(() => false);
      expect(hasErrorMessage).toBe(false);
    }
  });

  test('landing page should load', async ({ page }) => {
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');
    
    // Should contain some content
    const hasContent = await page.locator('h1').isVisible();
    expect(hasContent).toBe(true);
  });
});
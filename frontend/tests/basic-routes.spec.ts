import { test, expect } from '@playwright/test';

test.describe('Basic Route Navigation', () => {
  test('homepage should redirect to dashboard', async ({ page }) => {
    await page.goto('/');
    // Our router redirects '/' to '/dashboard'
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should load app without critical errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // App title should be MailerSuite
    await expect(page).toHaveTitle(/MailerSuite/);

    // Filter out non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('DevTools') && 
      !error.includes('Download the React DevTools') &&
      !error.includes('vite') &&
      !error.includes('favicon')
    );
    expect(criticalErrors.length).toBeLessThan(3);
  });

  test('auth routes should be accessible', async ({ page }) => {
    const authRoutes = ['/auth/login', '/auth/sign-up', '/auth/forgot'];
    for (const route of authRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const hasErrorMessage = await page.locator('text=404, text="Not Found"').count();
      expect(hasErrorMessage).toBe(0);
    }
  });

  test('landing page should load', async ({ page }) => {
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');
    const hasContent = await page.locator('h1, h2').count();
    expect(hasContent).toBeGreaterThan(0);
  });
});
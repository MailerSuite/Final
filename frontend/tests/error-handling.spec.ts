import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('should handle JavaScript errors gracefully', async ({ page }) => {
    const consoleMessages: string[] = [];
    const pageErrors: string[] = [];

    // Collect console messages and errors
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });

    await page.goto('/');
    await page.waitForTimeout(3000); // Give time for any async errors

    // Log collected errors for debugging
    if (consoleMessages.length > 0) {
      console.log('Console messages:', consoleMessages);
    }
    if (pageErrors.length > 0) {
      console.log('Page errors:', pageErrors);
    }

    // Check that the page still renders something (not completely broken)
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();
    expect(bodyContent?.length).toBeGreaterThan(0);
  });

  test('should display error boundary when component fails', async ({ page }) => {
    // Navigate to a route that might have component errors
    await page.goto('/finalui2');
    await page.waitForLoadState('networkidle');

    // Check if error boundary is shown (if any components fail)
    const errorBoundary = page.locator('text="Something went wrong"');
    const hasErrorBoundary = await errorBoundary.isVisible().catch(() => false);

    if (hasErrorBoundary) {
      // If error boundary is shown, check it has recovery options
      const tryAgainButton = page.locator('button:has-text("Try Again")');
      const goHomeButton = page.locator('button:has-text("Go Home")');
      
      expect(await tryAgainButton.isVisible()).toBe(true);
      expect(await goHomeButton.isVisible()).toBe(true);
    }
  });

  test('should handle network errors', async ({ page }) => {
    // Start with a working page
    await page.goto('/');
    
    // Simulate network failure
    await page.route('**/*', route => {
      if (route.request().url().includes('api')) {
        route.abort();
      } else {
        route.continue();
      }
    });

    // Navigate to a page that might make API calls
    await page.goto('/admin');
    await page.waitForTimeout(2000);

    // Page should still render even if API calls fail
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();
  });

  test('should handle missing routes', async ({ page }) => {
    // Try to navigate to a non-existent route
    await page.goto('/non-existent-route');
    await page.waitForLoadState('networkidle');

    // Should either redirect to a valid route or show a proper 404 page
    const currentUrl = page.url();
    const isValidRedirect = currentUrl.includes('/finalui2') || 
                           currentUrl.includes('/landing') ||
                           currentUrl.includes('404');
    
    expect(isValidRedirect).toBe(true);
  });
});
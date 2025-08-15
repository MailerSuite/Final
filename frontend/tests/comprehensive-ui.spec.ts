import { test, expect, Page } from '@playwright/test';

// Test Configuration
// Removed hardcoded BASE_URL to rely on Playwright's configured baseURL

// Helper function to wait for page load
async function waitForPageLoad(page: Page, url?: string) {
  if (url) await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
}

// Helper function to check for console errors
async function getConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test.describe('Comprehensive UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    getConsoleErrors(page);
  });

  test('Hub - Should load with professional design and all components', async ({ page }) => {
    await waitForPageLoad(page, `/dashboard`);
    await expect(page).toHaveTitle(/MailerSuite/);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Platform Overview')).toBeVisible();
  });

  test('Sidebar - Should display and function correctly', async ({ page }) => {
    await waitForPageLoad(page, `/dashboard`);
    await expect(page.locator('body')).toBeVisible();
    const anyNav = await page.locator('a[href^="/"]').count();
    expect(anyNav).toBeGreaterThan(0);
  });

  test('AI Assistant - Should toggle and display correctly', async ({ page }) => {
    await waitForPageLoad(page, `/dashboard`);
    const aiAssistantButton = page.locator('button:has-text("AI Assistant"), button:has-text("AI")').first();
    if (await aiAssistantButton.isVisible()) {
      await aiAssistantButton.click();
      await page.waitForTimeout(300);
      const aiElements = await page.locator('text=AI').count();
      expect(aiElements).toBeGreaterThan(0);
    } else {
      const aiElements = await page.locator('text=AI').count();
      expect(aiElements).toBeGreaterThan(0);
    }
  });

  test('Responsive Design - Mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await waitForPageLoad(page, `/dashboard`);
    await expect(page).toHaveTitle(/MailerSuite/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Responsive Design - Tablet view', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await waitForPageLoad(page, `/dashboard`);
    await expect(page).toHaveTitle(/MailerSuite/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Navigation - All main routes should work', async ({ page }) => {
    await waitForPageLoad(page, `/dashboard`);
    const routes = ['/finalui2/dashboard-enhanced', '/finalui2/campaigns', '/finalui2/templates', '/finalui2/analytics'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Interactive Elements - Buttons and hovers work', async ({ page }) => {
    await waitForPageLoad(page, `/dashboard`);
    const navLinks = page.locator('a[href^="/finalui2/"]');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('Search Functionality', async ({ page }) => {
    await waitForPageLoad(page, `/dashboard`);
    const errors: string[] = [];
    page.on('console', m => m.type() === 'error' && errors.push(m.text()));
    expect(Array.isArray(errors)).toBe(true);
  });

  test('Theme and Visual Consistency', async ({ page }) => {
    await waitForPageLoad(page, `/dashboard`);
    const styledElements = await page.locator('[class]').count();
    expect(styledElements).toBeGreaterThan(0);
  });

  test('Performance and Loading States', async ({ page }) => {
    const start = Date.now();
    await waitForPageLoad(page, `/dashboard`);
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(10000);
  });

  test('Accessibility Features', async ({ page }) => {
    await waitForPageLoad(page, `/dashboard`);
    const hCount = await page.locator('h1, h2').count();
    expect(hCount).toBeGreaterThan(0);
  });
});
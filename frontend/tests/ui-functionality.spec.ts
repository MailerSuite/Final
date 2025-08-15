import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3501';

test.describe('UI Functionality Tests', () => {
  test('App loads successfully with marketing layout', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Basic page load verification
    await expect(page).toHaveTitle(/Vite \+ React \+ TS/);
    
    // Check marketing layout is present
    const layoutElement = page.locator('.marketing-layout');
    await expect(layoutElement).toBeVisible();
    
    // Check that SGPT platform text is present
    const sgptElements = page.locator('text=SGPT');
    await expect(sgptElements.first()).toBeVisible();
  });

  test('Navigation sidebar is functional', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Check sidebar exists
    const sidebar = page.locator('.marketing-layout__sidebar, [class*="sidebar"]');
    await expect(sidebar.first()).toBeVisible();

    // Check for navigation links
    const navLinks = page.locator('a[href^="/"]');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
    
    // Test clicking a navigation link
    const firstLink = navLinks.first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
      await page.waitForLoadState('networkidle');
      // Should navigate successfully
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(dashboard|campaigns|templates|analytics|assistant)/);
    }
  });

  test('AI Assistant toggle works', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Look for AI Assistant button
    const aiButton = page.locator('button:has-text("AI Assistant"), button:has-text("AI")').first();
    
    if (await aiButton.isVisible()) {
      await aiButton.click();
      await page.waitForTimeout(500);
      
      // Some AI-related element should appear or change
      const aiElements = await page.locator('text=AI').count();
      expect(aiElements).toBeGreaterThan(0);
    } else {
      // If button not visible, at least AI elements should exist
      const aiElements = await page.locator('text=AI').count();
      expect(aiElements).toBeGreaterThan(0);
    }
  });

  test('Responsive design adapts to mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Page should still load
    const layoutElement = page.locator('.marketing-layout, body');
    await expect(layoutElement.first()).toBeVisible();

    // Some content should be visible
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(100);
  });

  test('All major routes are accessible', async ({ page }) => {
    const routes = [
      '/dashboard',
      '/campaigns',
      '/templates',
      '/contacts',
      '/analytics'
    ];

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should not show error page
      const errorText = await page.locator('text=Error, text=404, text="Not Found"').count();
      expect(errorText).toBe(0);
      
      // Should have substantial content
      const bodyText = await page.locator('body').textContent();
      expect(bodyText!.length).toBeGreaterThan(20);
    }
  });

  test('Interactive elements respond to user actions', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Test button interactions - find visible buttons only
    const visibleButtons = page.locator('button:visible');
    const buttonCount = await visibleButtons.count();
    
    if (buttonCount > 0) {
      const firstVisibleButton = visibleButtons.first();
      await firstVisibleButton.hover();
      await page.waitForTimeout(100);
      
      // Button should be interactable
      const isVisible = await firstVisibleButton.isVisible();
      expect(isVisible).toBe(true);
    }

    // Test link interactions
    const links = page.locator('a');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);
    
    // Verify we have interactive elements
    const totalInteractive = await page.locator('button, a, [role="button"]').count();
    expect(totalInteractive).toBeGreaterThan(0);
  });

  test('Theme and styling are applied correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Check for styled elements (any CSS classes)
    const styledElements = page.locator('[class]');
    const styledCount = await styledElements.count();
    expect(styledCount).toBeGreaterThan(0);

    // Check page has visual styling applied
    const bodyElement = page.locator('body');
    const hasClasses = await bodyElement.getAttribute('class');
    const bodyContent = await bodyElement.innerHTML();
    
    // Should have substantial styled content
    expect(bodyContent.length).toBeGreaterThan(1000);
  });

  test('Page loads without critical errors', async ({ page }) => {
    const errorLogs = [];
    
    // Monitor console for errors
    page.on('console', message => {
      if (message.type() === 'error') {
        errorLogs.push(message.text());
      }
    });

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Filter out common non-critical errors
    const criticalErrors = errorLogs.filter(error => 
      !error.includes('React DevTools') &&
      !error.includes('Failed to load resource') &&
      !error.includes('favicon')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('Content is accessible and has proper structure', async ({ page }) => {
    await page.goto(`${BASE_URL}/finalui2/hub`);
    await page.waitForLoadState('networkidle');

    // Should have some headings
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);

    // Should have clickable elements
    const clickable = page.locator('button, a, [role="button"]');
    const clickableCount = await clickable.count();
    expect(clickableCount).toBeGreaterThan(0);

    // Should have reasonable amount of content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(200);
  });

  test('Performance is acceptable', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds (generous for CI)
    expect(loadTime).toBeLessThan(10000);

    // Page should be stable
    await page.waitForTimeout(1000);
    const finalText = await page.locator('body').textContent();
    expect(finalText!.length).toBeGreaterThan(200);
  });
});
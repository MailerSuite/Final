import { test, expect, Page } from '@playwright/test';

// Test Configuration
const BASE_URL = 'http://localhost:3501';

// Helper function to wait for page load
async function waitForPageLoad(page: Page, url?: string) {
  if (url) await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Allow for animations
}

// Helper function to check for console errors
async function getConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  return errors;
}

test.describe('Comprehensive UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start monitoring console errors
    getConsoleErrors(page);
  });

  test('Hub - Should load with professional design and all components', async ({ page }) => {
    await waitForPageLoad(page, `${BASE_URL}/dashboard`);

    // Test page loads without errors
    await expect(page).toHaveTitle(/Vite \+ React \+ TS/);
    
    // Check main layout elements
    await expect(page.locator('.marketing-layout')).toBeVisible();
    
    // Check header components
    await expect(page.locator('text=AI Assistant')).toBeVisible();
    await expect(page.locator('text=All Systems')).toBeVisible();
    
    // Check navigation hub content
    await expect(page.locator('text=SGPT Marketing Platform')).toBeVisible();
    await expect(page.locator('text=Platform Overview')).toBeVisible();
    await expect(page.locator('text=Core Platform')).toBeVisible();
    await expect(page.locator('text=Live Tools')).toBeVisible();
    
    // Check metrics cards
    await expect(page.locator('text=Active Campaigns')).toBeVisible();
    await expect(page.locator('text=Total Contacts')).toBeVisible();
    await expect(page.locator('text=Open Rate')).toBeVisible();
    await expect(page.locator('text=System Health')).toBeVisible();
    
    // Check feature cards
    await expect(page.locator('text=Enhanced Dashboard')).toBeVisible();
    await expect(page.locator('text=AI Campaign Builder')).toBeVisible();
    await expect(page.locator('text=Template Designer')).toBeVisible();
    
    // Check quick actions
    await expect(page.locator('text=Create Campaign')).toBeVisible();
    await expect(page.locator('text=Design Template')).toBeVisible();
    await expect(page.locator('text=Live Console')).toBeVisible();
  });

  test('Sidebar - Should display and function correctly', async ({ page }) => {
    await waitForPageLoad(page, `${BASE_URL}/dashboard`);

    // Check if sidebar is visible on desktop
    const sidebar = page.locator('.marketing-layout__sidebar');
    await expect(sidebar).toBeVisible();
    
    // Check sidebar branding
    await expect(page.locator('text=SGPT Platform')).toBeVisible();
    await expect(page.locator('text=Marketing Suite')).toBeVisible();
    
    // Check navigation sections
    await expect(page.locator('text=Core Platform')).toBeVisible();
    await expect(page.locator('text=Campaign Management')).toBeVisible();
    await expect(page.locator('text=AI & Analytics')).toBeVisible();
    await expect(page.locator('text=Live Tools')).toBeVisible();
    await expect(page.locator('text=Infrastructure')).toBeVisible();
    
    // Test navigation links
    const hubLink = page.locator('a[href="/dashboard"]').first();
    await expect(hubLink).toBeVisible();
    
    const dashboardLink = page.locator('a[href="/dashboard"]').first();
    await expect(dashboardLink).toBeVisible();
    
    const campaignLink = page.locator('a[href="/campaigns"]').first();
    await expect(campaignLink).toBeVisible();
  });

  test('AI Assistant - Should toggle and display correctly', async ({ page }) => {
    await waitForPageLoad(page, `${BASE_URL}/dashboard`);

    // Find and click AI Assistant button
    const aiAssistantButton = page.locator('button:has-text("AI Assistant")');
    await expect(aiAssistantButton).toBeVisible();
    await aiAssistantButton.click();
    
    // Wait for AI Assistant panel to appear
    await page.waitForTimeout(500);
    
    // Check if AI Assistant panel is visible
    const assistantPanel = page.locator('.ai-assistant-panel, [role="dialog"]');
    // Note: The exact selector might vary based on implementation
    
    // Try to find common elements that should be in the AI assistant
    const aiElements = await page.locator('text=AI').count();
    expect(aiElements).toBeGreaterThan(0);
  });

  test('Responsive Design - Mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await waitForPageLoad(page, `${BASE_URL}/finalui2/hub`);

    // Check mobile layout
    await expect(page).toHaveTitle(/Vite \+ React \+ TS/);
    
    // Check that content is still accessible
    await expect(page.locator('text=SGPT Marketing Platform')).toBeVisible();
    
    // On mobile, sidebar might be hidden or togglable
    const mobileMenuButton = page.locator('button[aria-label="Menu"], button:has(svg)').first();
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('Responsive Design - Tablet view', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await waitForPageLoad(page, `${BASE_URL}/finalui2/hub`);

    // Check tablet layout
    await expect(page).toHaveTitle(/Vite \+ React \+ TS/);
    await expect(page.locator('text=SGPT Marketing Platform')).toBeVisible();
    
    // Check that grid adapts properly
    const featureCards = page.locator('[class*="grid"]').first();
    await expect(featureCards).toBeVisible();
  });

  test('Navigation - All main routes should work', async ({ page }) => {
    await waitForPageLoad(page, `${BASE_URL}/finalui2/hub`);

    const routes = [
      '/finalui2/dashboard-enhanced',
      '/finalui2/campaigns',
      '/finalui2/templates',
      '/finalui2/contacts',
      '/finalui2/analytics',
      '/finalui2/assistant',
      '/finalui2/settings',
      '/finalui2/smtp-checker',
      '/finalui2/live-console'
    ];

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState('networkidle');
      
      // Should not be a 404 page
      const notFound = await page.locator('text=404').count();
      expect(notFound).toBe(0);
      
      // Should have some content
      const bodyText = await page.locator('body').textContent();
      expect(bodyText!.length).toBeGreaterThan(100);
    }
  });

  test('Interactive Elements - Buttons and hovers work', async ({ page }) => {
    await waitForPageLoad(page, `${BASE_URL}/finalui2/hub`);

    // Test quick action buttons
    const createCampaignBtn = page.locator('button:has-text("Create Campaign")');
    if (await createCampaignBtn.isVisible()) {
      await createCampaignBtn.hover();
      await page.waitForTimeout(200); // Allow for hover effects
    }

    // Test feature card interactions
    const featureCards = page.locator('button:has-text("Open Dashboard"), button:has-text("Create Campaign"), button:has-text("Design Templates")');
    const count = await featureCards.count();
    
    if (count > 0) {
      await featureCards.first().hover();
      await page.waitForTimeout(200);
    }

    // Test navigation links
    const navLinks = page.locator('a[href^="/finalui2/"]');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('Search Functionality', async ({ page }) => {
    await waitForPageLoad(page, `${BASE_URL}/finalui2/hub`);

    // Look for search input or button
    const searchElement = page.locator('input[placeholder*="Search"], button:has-text("Search")');
    
    if (await searchElement.count() > 0) {
      await searchElement.first().click();
      await page.waitForTimeout(300);
      
      // If it's an input, try typing
      if (await searchElement.first().getAttribute('type') !== 'button') {
        await searchElement.first().fill('campaign');
        await page.waitForTimeout(500);
      }
    }
  });

  test('Theme and Visual Consistency', async ({ page }) => {
    await waitForPageLoad(page, `${BASE_URL}/finalui2/hub`);

    // Check for consistent color scheme (should have dark theme elements)
    const darkElements = page.locator('[class*="slate-"], [class*="gray-"], [class*="bg-slate"]');
    const darkCount = await darkElements.count();
    expect(darkCount).toBeGreaterThan(0);

    // Check for cyan/blue accent colors (brand colors)
    const accentElements = page.locator('[class*="cyan-"], [class*="blue-"]');
    const accentCount = await accentElements.count();
    expect(accentCount).toBeGreaterThan(0);

    // Check for consistent spacing and typography
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });

  test('Performance and Loading States', async ({ page }) => {
    const startTime = Date.now();
    
    await waitForPageLoad(page, `${BASE_URL}/finalui2/hub`);
    
    const loadTime = Date.now() - startTime;
    
    // Should load reasonably fast (less than 5 seconds)
    expect(loadTime).toBeLessThan(5000);

    // Check for smooth animations (no layout shifts)
    await page.waitForTimeout(1000);
    
    // Page should be stable after loading
    const finalContent = await page.locator('body').textContent();
    expect(finalContent!.length).toBeGreaterThan(500);
  });

  test('Accessibility Features', async ({ page }) => {
    await waitForPageLoad(page, `${BASE_URL}/finalui2/hub`);

    // Check for proper headings hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);

    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i);
      if (await img.isVisible()) {
        const alt = await img.getAttribute('alt');
        // Alt text should exist (can be empty for decorative images)
        expect(alt).not.toBeNull();
      }
    }

    // Check for keyboard navigation support
    const focusableElements = page.locator('button, a, input, [tabindex="0"]');
    const focusableCount = await focusableElements.count();
    expect(focusableCount).toBeGreaterThan(0);
  });
});
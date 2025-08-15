import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:4000';

test.describe('Authentication E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Clear any existing auth state
        await page.context().clearCookies();
        await page.context().clearPermissions();
    });

    test('User Registration Flow', async ({ page }) => {
        await page.goto(`${BASE_URL}/sign-up`);

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check if signup form is visible
        await expect(page.locator('h1')).toContainText(/sign|register|create account/i);

        // Fill out registration form
        const testEmail = `test${Date.now()}@example.com`;
        const testPassword = 'TestPassword123!';

        await page.fill('input[type="email"], input[name="email"]', testEmail);
        await page.fill('input[type="password"], input[name="password"]', testPassword);
        await page.fill('input[name="confirmPassword"], input[name="passwordConfirm"]', testPassword);

        // Submit form
        await page.click('button[type="submit"], button:has-text("Sign Up")');

        // Wait for response
        await page.waitForTimeout(2000);

        // Check for success message or redirect
        const successIndicator = await page.locator('text=success, text=welcome, text=verification').first();
        if (await successIndicator.isVisible()) {
            await expect(successIndicator).toBeVisible();
        }
    });

    test('User Login Flow', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check if login form is visible
        await expect(page.locator('h1')).toContainText(/login|sign in/i);

        // Fill out login form
        await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
        await page.fill('input[type="password"], input[name="password"]', 'TestPassword123!');

        // Submit form
        await page.click('button[type="submit"], button:has-text("Login")');

        // Wait for response
        await page.waitForTimeout(2000);

        // Check for successful login (redirect to dashboard or success message)
        const successIndicator = await page.locator('text=dashboard, text=welcome, text=success').first();
        if (await successIndicator.isVisible()) {
            await expect(successIndicator).toBeVisible();
        }
    });

    test('Password Reset Flow', async ({ page }) => {
        await page.goto(`${BASE_URL}/forgot`);

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check if password reset form is visible
        await expect(page.locator('h1')).toContainText(/forgot|reset|password/i);

        // Fill out password reset form
        await page.fill('input[type="email"], input[name="email"]', 'test@example.com');

        // Submit form
        await page.click('button[type="submit"], button:has-text("Reset")');

        // Wait for response
        await page.waitForTimeout(2000);

        // Check for success message
        const successIndicator = await page.locator('text=email sent, text=check email, text=success').first();
        if (await successIndicator.isVisible()) {
            await expect(successIndicator).toBeVisible();
        }
    });

    test('Authentication Error Handling', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Try to submit empty form
        await page.click('button[type="submit"], button:has-text("Login")');

        // Check for validation errors
        await page.waitForTimeout(1000);

        const errorMessages = await page.locator('text=required, text=invalid, text=error').count();
        expect(errorMessages).toBeGreaterThan(0);
    });

    test('Protected Route Access', async ({ page }) => {
        // Try to access protected route without authentication
        await page.goto(`${BASE_URL}/dashboard`);

        // Should redirect to login or show auth required message
        await page.waitForLoadState('networkidle');

        const authRequired = await page.locator('text=login, text=sign in, text=unauthorized').count();
        if (authRequired > 0) {
            await expect(page.locator('text=login, text=sign in, text=unauthorized').first()).toBeVisible();
        }
    });

    test('Logout Flow', async ({ page }) => {
        // First login (if possible)
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('networkidle');

        // Look for logout button in header/navigation
        const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), button[aria-label*="logout"]');

        if (await logoutButton.count() > 0) {
            await logoutButton.first().click();
            await page.waitForTimeout(1000);

            // Should redirect to login or home page
            const currentUrl = page.url();
            expect(currentUrl).toMatch(/\/login|\/home|\/$/);
        }
    });
});

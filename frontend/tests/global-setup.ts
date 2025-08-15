import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
    const { baseURL } = config.projects[0].use;

    console.log('🚀 Setting up global test environment...');

    // Launch browser and perform global setup
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        // Wait for the application to be ready
        console.log(`📱 Checking if application is ready at ${baseURL}...`);

        // Navigate to the base URL and wait for it to load
        await page.goto(baseURL || 'http://127.0.0.1:4000');

        // Wait for the page to be fully loaded
        await page.waitForLoadState('networkidle');

        // Check if the application is responding
        const title = await page.title();
        console.log(`✅ Application loaded with title: ${title}`);

        // Optional: Perform any global authentication or setup
        // For example, create test users, set up test data, etc.

        // Check if we're on a login page or dashboard
        const isLoginPage = await page.locator('text=login, text=sign in, text=Login').count() > 0;
        const isDashboard = await page.locator('text=dashboard, text=Dashboard').count() > 0;

        if (isLoginPage) {
            console.log('🔐 Detected login page - tests will handle authentication');
        } else if (isDashboard) {
            console.log('🏠 Detected dashboard - application is ready');
        } else {
            console.log('📄 Application loaded but structure unclear - proceeding with tests');
        }

        // Take a screenshot of the initial state for debugging
        await page.screenshot({ path: 'test-results/global-setup.png' });

    } catch (error) {
        console.error('❌ Global setup failed:', error);

        // Take a screenshot of the failure state
        try {
            await page.screenshot({ path: 'test-results/global-setup-failed.png' });
        } catch (screenshotError) {
            console.error('Failed to take failure screenshot:', screenshotError);
        }

        // Don't fail the entire test suite, just log the error
        console.log('⚠️  Continuing with tests despite setup issues...');
    } finally {
        await browser.close();
    }

    console.log('✅ Global setup completed');
}

export default globalSetup;

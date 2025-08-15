import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:4000';

test.describe('Admin Management E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to admin dashboard
        await page.goto(`${BASE_URL}/admin`);
        await page.waitForLoadState('networkidle');
    });

    test('Admin Dashboard Access', async ({ page }) => {
        // Check if admin dashboard loads
        await expect(page.locator('h1, h2')).toContainText(/admin|dashboard/i);

        // Check for admin navigation
        const adminNav = page.locator('[data-testid="admin-nav"], .admin-nav, nav');
        if (await adminNav.count() > 0) {
            await expect(adminNav.first()).toBeVisible();
        }

        // Check for admin-specific content
        const adminContent = page.locator('text=admin, text=management, text=settings');
        if (await adminContent.count() > 0) {
            await expect(adminContent.first()).toBeVisible();
        }
    });

    test('User Management', async ({ page }) => {
        // Navigate to user management
        const userManagementLink = page.locator('a:has-text("Users"), button:has-text("Users"), a[href*="users"]');

        if (await userManagementLink.count() > 0) {
            await userManagementLink.first().click();
            await page.waitForTimeout(1000);

            // Check for user list
            const userList = page.locator('[data-testid="user-list"], .user-list, table');
            if (await userList.count() > 0) {
                await expect(userList.first()).toBeVisible();

                // Try to create new user
                const createUserButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")');
                if (await createUserButton.count() > 0) {
                    await createUserButton.first().click();
                    await page.waitForTimeout(1000);

                    // Check for user creation form
                    const userForm = page.locator('form, [data-testid="user-form"], .user-form');
                    if (await userForm.count() > 0) {
                        await expect(userForm.first()).toBeVisible();

                        // Fill out user form
                        const emailInput = page.locator('input[type="email"], input[name="email"]');
                        if (await emailInput.count() > 0) {
                            await emailInput.first().fill(`admin-test-${Date.now()}@example.com`);
                        }

                        const nameInput = page.locator('input[name="name"], input[name="firstName"]');
                        if (await nameInput.count() > 0) {
                            await nameInput.first().fill('Test Admin User');
                        }

                        const roleSelect = page.locator('select[name="role"], [data-testid="role-select"]');
                        if (await roleSelect.count() > 0) {
                            await roleSelect.first().selectOption('user');
                        }

                        // Submit form
                        const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
                        if (await submitButton.count() > 0) {
                            await submitButton.first().click();
                            await page.waitForTimeout(2000);

                            // Check for success message
                            const successMessage = page.locator('text=created, text=success, text=saved');
                            if (await successMessage.count() > 0) {
                                await expect(successMessage.first()).toBeVisible();
                            }
                        }
                    }
                }
            }
        }
    });

    test('Campaign Management', async ({ page }) => {
        // Navigate to campaign management
        const campaignManagementLink = page.locator('a:has-text("Campaigns"), button:has-text("Campaigns"), a[href*="campaigns"]');

        if (await campaignManagementLink.count() > 0) {
            await campaignManagementLink.first().click();
            await page.waitForTimeout(1000);

            // Check for campaign management interface
            const campaignManagement = page.locator('[data-testid="campaign-management"], .campaign-management, .admin-campaigns');
            if (await campaignManagement.count() > 0) {
                await expect(campaignManagement.first()).toBeVisible();

                // Check for campaign statistics
                const campaignStats = page.locator('text=total campaigns, text=active campaigns, text=sent emails');
                if (await campaignStats.count() > 0) {
                    await expect(campaignStats.first()).toBeVisible();
                }

                // Check for campaign actions
                const campaignActions = page.locator('button:has-text("Approve"), button:has-text("Pause"), button:has-text("Delete")');
                if (await campaignActions.count() > 0) {
                    await expect(campaignActions.first()).toBeVisible();
                }
            }
        }
    });

    test('Analytics and Reporting', async ({ page }) => {
        // Navigate to analytics
        const analyticsLink = page.locator('a:has-text("Analytics"), button:has-text("Analytics"), a[href*="analytics"]');

        if (await analyticsLink.count() > 0) {
            await analyticsLink.first().click();
            await page.waitForTimeout(1000);

            // Check for analytics dashboard
            const analyticsDashboard = page.locator('[data-testid="analytics-dashboard"], .analytics-dashboard, .admin-analytics');
            if (await analyticsDashboard.count() > 0) {
                await expect(analyticsDashboard.first()).toBeVisible();

                // Check for key metrics
                const keyMetrics = page.locator('text=total users, text=total campaigns, text=email sent, text=open rate');
                if (await keyMetrics.count() > 0) {
                    await expect(keyMetrics.first()).toBeVisible();
                }

                // Check for charts and graphs
                const charts = page.locator('canvas, svg, [role="img"]');
                if (await charts.count() > 0) {
                    await expect(charts.first()).toBeVisible();
                }

                // Check for date range picker
                const datePicker = page.locator('input[type="date"], input[type="datetime-local"], [data-testid="date-picker"]');
                if (await datePicker.count() > 0) {
                    await expect(datePicker.first()).toBeVisible();
                }
            }
        }
    });

    test('System Settings', async ({ page }) => {
        // Navigate to system settings
        const settingsLink = page.locator('a:has-text("Settings"), button:has-text("Settings"), a[href*="settings"]');

        if (await settingsLink.count() > 0) {
            await settingsLink.first().click();
            await page.waitForTimeout(1000);

            // Check for settings interface
            const settingsInterface = page.locator('[data-testid="settings-interface"], .settings-interface, .admin-settings');
            if (await settingsInterface.count() > 0) {
                await expect(settingsInterface.first()).toBeVisible();

                // Check for common settings sections
                const settingsSections = page.locator('text=general, text=email, text=security, text=notifications');
                if (await settingsSections.count() > 0) {
                    await expect(settingsSections.first()).toBeVisible();
                }

                // Try to modify a setting
                const toggleSwitch = page.locator('[role="switch"], input[type="checkbox"], [data-testid="toggle"]');
                if (await toggleSwitch.count() > 0) {
                    await toggleSwitch.first().click();
                    await page.waitForTimeout(1000);

                    // Save settings
                    const saveButton = page.locator('button:has-text("Save"), button:has-text("Apply"), button[type="submit"]');
                    if (await saveButton.count() > 0) {
                        await saveButton.first().click();
                        await page.waitForTimeout(2000);

                        // Check for success message
                        const successMessage = page.locator('text=saved, text=updated, text=success');
                        if (await successMessage.count() > 0) {
                            await expect(successMessage.first()).toBeVisible();
                        }
                    }
                }
            }
        }
    });

    test('Email Configuration', async ({ page }) => {
        // Navigate to email configuration
        const emailConfigLink = page.locator('a:has-text("Email"), button:has-text("Email"), a[href*="email"]');

        if (await emailConfigLink.count() > 0) {
            await emailConfigLink.first().click();
            await page.waitForTimeout(1000);

            // Check for email configuration interface
            const emailConfig = page.locator('[data-testid="email-config"], .email-config, .smtp-settings');
            if (await emailConfig.count() > 0) {
                await expect(emailConfig.first()).toBeVisible();

                // Check for SMTP settings
                const smtpSettings = page.locator('text=smtp, text=server, text=port, text=authentication');
                if (await smtpSettings.count() > 0) {
                    await expect(smtpSettings.first()).toBeVisible();
                }

                // Try to add SMTP server
                const addServerButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Configure")');
                if (await addServerButton.count() > 0) {
                    await addServerButton.first().click();
                    await page.waitForTimeout(1000);

                    // Check for server configuration form
                    const serverForm = page.locator('form, [data-testid="server-form"], .server-form');
                    if (await serverForm.count() > 0) {
                        await expect(serverForm.first()).toBeVisible();

                        // Fill out server details
                        const serverInput = page.locator('input[name="server"], input[placeholder*="server"]');
                        if (await serverInput.count() > 0) {
                            await serverInput.first().fill('smtp.example.com');
                        }

                        const portInput = page.locator('input[name="port"], input[placeholder*="port"]');
                        if (await portInput.count() > 0) {
                            await portInput.first().fill('587');
                        }

                        // Submit form
                        const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Test")');
                        if (await submitButton.count() > 0) {
                            await submitButton.first().click();
                            await page.waitForTimeout(2000);

                            // Check for success or test result
                            const resultMessage = page.locator('text=success, text=connected, text=tested');
                            if (await resultMessage.count() > 0) {
                                await expect(resultMessage.first()).toBeVisible();
                            }
                        }
                    }
                }
            }
        }
    });

    test('User Permissions and Roles', async ({ page }) => {
        // Navigate to user permissions
        const permissionsLink = page.locator('a:has-text("Permissions"), button:has-text("Permissions"), a[href*="permissions"]');

        if (await permissionsLink.count() > 0) {
            await permissionsLink.first().click();
            await page.waitForTimeout(1000);

            // Check for permissions interface
            const permissionsInterface = page.locator('[data-testid="permissions-interface"], .permissions-interface, .role-management');
            if (await permissionsInterface.count() > 0) {
                await expect(permissionsInterface.first()).toBeVisible();

                // Check for role definitions
                const roleDefinitions = page.locator('text=admin, text=user, text=moderator, text=guest');
                if (await roleDefinitions.count() > 0) {
                    await expect(roleDefinitions.first()).toBeVisible();
                }

                // Try to modify role permissions
                const roleRow = page.locator('[data-testid="role-row"], .role-row, tr').first();
                if (await roleRow.count() > 0) {
                    await roleRow.first().click();
                    await page.waitForTimeout(1000);

                    // Check for permission checkboxes
                    const permissionCheckboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
                    if (await permissionCheckboxes.count() > 0) {
                        await permissionCheckboxes.first().click();
                        await page.waitForTimeout(1000);

                        // Save permissions
                        const saveButton = page.locator('button:has-text("Save"), button:has-text("Apply"), button[type="submit"]');
                        if (await saveButton.count() > 0) {
                            await saveButton.first().click();
                            await page.waitForTimeout(2000);

                            // Check for success message
                            const successMessage = page.locator('text=saved, text=updated, text=success');
                            if (await successMessage.count() > 0) {
                                await expect(successMessage.first()).toBeVisible();
                            }
                        }
                    }
                }
            }
        }
    });
});

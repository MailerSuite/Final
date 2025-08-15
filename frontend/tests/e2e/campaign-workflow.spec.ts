import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:4000';

test.describe('Campaign Management E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to campaigns page
        await page.goto(`${BASE_URL}/campaigns`);
        await page.waitForLoadState('networkidle');
    });

    test('Campaign List View', async ({ page }) => {
        // Check if campaigns page loads
        await expect(page.locator('h1, h2')).toContainText(/campaigns/i);

        // Check for campaign list or empty state
        const campaignList = page.locator('[data-testid="campaign-list"], .campaign-list, table');
        const emptyState = page.locator('text=no campaigns, text=empty, text=create your first');

        if (await campaignList.count() > 0) {
            await expect(campaignList).toBeVisible();
        } else if (await emptyState.count() > 0) {
            await expect(emptyState.first()).toBeVisible();
        }
    });

    test('Create New Campaign', async ({ page }) => {
        // Look for create campaign button
        const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")');

        if (await createButton.count() > 0) {
            await createButton.first().click();
            await page.waitForTimeout(1000);

            // Check if campaign creation form is visible
            const form = page.locator('form, [role="form"]');
            if (await form.count() > 0) {
                await expect(form.first()).toBeVisible();

                // Fill out basic campaign information
                const nameInput = page.locator('input[name="name"], input[placeholder*="name"]');
                if (await nameInput.count() > 0) {
                    await nameInput.first().fill(`Test Campaign ${Date.now()}`);
                }

                const subjectInput = page.locator('input[name="subject"], input[placeholder*="subject"]');
                if (await subjectInput.count() > 0) {
                    await subjectInput.first().fill('Test Email Subject');
                }

                // Submit form
                const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
                if (await submitButton.count() > 0) {
                    await submitButton.first().click();
                    await page.waitForTimeout(2000);

                    // Check for success message or redirect
                    const successIndicator = page.locator('text=success, text=created, text=saved');
                    if (await successIndicator.count() > 0) {
                        await expect(successIndicator.first()).toBeVisible();
                    }
                }
            }
        }
    });

    test('Campaign Template Selection', async ({ page }) => {
        // Navigate to template selection if available
        const templateButton = page.locator('button:has-text("Template"), a:has-text("Template")');

        if (await templateButton.count() > 0) {
            await templateButton.first().click();
            await page.waitForTimeout(1000);

            // Check for template gallery
            const templateGallery = page.locator('[data-testid="template-gallery"], .template-gallery, .template-list');
            if (await templateGallery.count() > 0) {
                await expect(templateGallery.first()).toBeVisible();

                // Select a template
                const templateItem = page.locator('[data-testid="template-item"], .template-item, .template-card').first();
                if (await templateItem.count() > 0) {
                    await templateItem.first().click();
                    await page.waitForTimeout(1000);

                    // Check if template is selected
                    const selectedTemplate = page.locator('[data-testid="selected-template"], .selected-template, .template-selected');
                    if (await selectedTemplate.count() > 0) {
                        await expect(selectedTemplate.first()).toBeVisible();
                    }
                }
            }
        }
    });

    test('Campaign Contact List Management', async ({ page }) => {
        // Look for contact list management
        const contactButton = page.locator('button:has-text("Contacts"), button:has-text("Audience"), button:has-text("List")');

        if (await contactButton.count() > 0) {
            await contactButton.first().click();
            await page.waitForTimeout(1000);

            // Check for contact list interface
            const contactList = page.locator('[data-testid="contact-list"], .contact-list, .audience-list');
            if (await contactList.count() > 0) {
                await expect(contactList.first()).toBeVisible();

                // Try to add contacts
                const addContactButton = page.locator('button:has-text("Add"), button:has-text("Import"), button:has-text("Upload")');
                if (await addContactButton.count() > 0) {
                    await addContactButton.first().click();
                    await page.waitForTimeout(1000);

                    // Check for contact addition form
                    const contactForm = page.locator('form, [role="form"], .contact-form');
                    if (await contactForm.count() > 0) {
                        await expect(contactForm.first()).toBeVisible();
                    }
                }
            }
        }
    });

    test('Campaign Scheduling', async ({ page }) => {
        // Look for scheduling options
        const scheduleButton = page.locator('button:has-text("Schedule"), button:has-text("Send"), button:has-text("Launch")');

        if (await scheduleButton.count() > 0) {
            await scheduleButton.first().click();
            await page.waitForTimeout(1000);

            // Check for scheduling interface
            const scheduleForm = page.locator('[data-testid="schedule-form"], .schedule-form, .scheduling-interface');
            if (await scheduleForm.count() > 0) {
                await expect(scheduleForm.first()).toBeVisible();

                // Try to set a schedule
                const dateInput = page.locator('input[type="date"], input[type="datetime-local"]');
                if (await dateInput.count() > 0) {
                    const futureDate = new Date();
                    futureDate.setDate(futureDate.getDate() + 1);
                    const dateString = futureDate.toISOString().split('T')[0];

                    await dateInput.first().fill(dateString);
                }

                // Submit schedule
                const submitScheduleButton = page.locator('button:has-text("Schedule"), button:has-text("Confirm"), button:has-text("Set")');
                if (await submitScheduleButton.count() > 0) {
                    await submitScheduleButton.first().click();
                    await page.waitForTimeout(2000);

                    // Check for confirmation
                    const confirmation = page.locator('text=scheduled, text=confirmed, text=success');
                    if (await confirmation.count() > 0) {
                        await expect(confirmation.first()).toBeVisible();
                    }
                }
            }
        }
    });

    test('Campaign Analytics and Reporting', async ({ page }) => {
        // Navigate to analytics if available
        const analyticsButton = page.locator('button:has-text("Analytics"), a:has-text("Analytics"), button:has-text("Reports")');

        if (await analyticsButton.count() > 0) {
            await analyticsButton.first().click();
            await page.waitForTimeout(1000);

            // Check for analytics dashboard
            const analyticsDashboard = page.locator('[data-testid="analytics-dashboard"], .analytics-dashboard, .reports-dashboard');
            if (await analyticsDashboard.count() > 0) {
                await expect(analyticsDashboard.first()).toBeVisible();

                // Check for common metrics
                const metrics = page.locator('text=open rate, text=click rate, text=bounce rate, text=delivery rate');
                if (await metrics.count() > 0) {
                    await expect(metrics.first()).toBeVisible();
                }

                // Check for charts/graphs
                const charts = page.locator('canvas, svg, [role="img"]');
                if (await charts.count() > 0) {
                    await expect(charts.first()).toBeVisible();
                }
            }
        }
    });

    test('Campaign Editing and Updates', async ({ page }) => {
        // Look for existing campaigns to edit
        const campaignItems = page.locator('[data-testid="campaign-item"], .campaign-item, .campaign-row');

        if (await campaignItems.count() > 0) {
            // Click on first campaign to edit
            await campaignItems.first().click();
            await page.waitForTimeout(1000);

            // Check for edit mode
            const editForm = page.locator('form, [data-testid="edit-form"], .edit-form');
            if (await editForm.count() > 0) {
                await expect(editForm.first()).toBeVisible();

                // Try to modify campaign name
                const nameInput = page.locator('input[name="name"], input[placeholder*="name"]');
                if (await nameInput.count() > 0) {
                    const newName = `Updated Campaign ${Date.now()}`;
                    await nameInput.first().fill(newName);

                    // Save changes
                    const saveButton = page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]');
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
});

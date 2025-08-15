import { test, expect } from '@playwright/test'

// Basic smoke tests for core UI primitives

test.describe('UI Kit smoke', () => {
  test('Button renders and clicks', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const btn = document.createElement('button');
      btn.textContent = 'Click me';
      btn.id = 'btn-smoke';
      document.body.appendChild(btn);
      btn.addEventListener('click', () => (btn.dataset.clicked = '1'))
    });
    await page.click('#btn-smoke');
    await expect(page.locator('#btn-smoke')).toHaveAttribute('data-clicked', '1');
  });

  test('Dialog opens/closes', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const div = document.createElement('div');
      div.innerHTML = `
        <dialog id="dlg-smoke">Hello</dialog>
        <button id="open">open</button>
        <button id="close">close</button>
      `;
      document.body.appendChild(div);
      const d = document.getElementById('dlg-smoke') as HTMLDialogElement;
      document.getElementById('open')!.addEventListener('click', () => d.showModal());
      document.getElementById('close')!.addEventListener('click', () => d.close());
    });
    await page.click('#open');
    await expect(page.locator('#dlg-smoke')).toBeVisible();
    await page.click('#close');
    await expect(page.locator('#dlg-smoke')).toBeHidden();
  });
});

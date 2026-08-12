import { test, expect } from '@playwright/test';

test('theme switcher updates data-theme and persists across reload', async ({ page }) => {
  await page.goto('/');

  const summerButton = page.getByRole('button', { name: '🌴 Hè' });
  await summerButton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'summer');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'summer');
  await expect(summerButton).toHaveAttribute('aria-pressed', 'true');
});

test('all three themes are selectable', async ({ page }) => {
  await page.goto('/');
  for (const [label, value] of [
    ['☀️ Sáng', 'light'],
    ['🌙 Tối', 'dark'],
    ['🌴 Hè', 'summer'],
  ] as const) {
    await page.getByRole('button', { name: label }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', value);
  }
});

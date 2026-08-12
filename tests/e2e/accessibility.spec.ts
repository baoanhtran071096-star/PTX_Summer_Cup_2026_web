import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage has no automatically detectable accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

/**
 * M12.5: now that a live local Supabase project exists, extend
 * accessibility coverage to the real data-driven public routes
 * (docs/gates/m12-evidence.md §4, item 7).
 */
for (const route of ['/doi', '/doi/p', '/cau-thu', '/cau-thu/18', '/lich-thi-dau', '/ket-qua', '/bang-xep-hang', '/thong-ke', '/du-doan']) {
  test(`${route} has no automatically detectable accessibility violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

test('theme switcher buttons remain accessible in dark theme', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '🌙 Tối' }).click();
  // Wait out the background-color CSS transition (globals.css) so axe
  // reads the settled color, not a mid-transition blend.
  await page.waitForTimeout(400);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

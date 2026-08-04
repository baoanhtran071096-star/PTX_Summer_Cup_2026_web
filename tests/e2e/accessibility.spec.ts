import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Only the homepage is Supabase-independent (see navigation.spec.ts
 * header) — full-site accessibility coverage over data-driven pages
 * (team/player profiles, match center, standings, predictions, admin)
 * is a tracked follow-up once a live project exists to render real
 * content against (docs/gates/m12-evidence.md).
 */
test('homepage has no automatically detectable accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test('theme switcher buttons remain accessible in dark theme', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '🌙 Tối' }).click();
  // Wait out the background-color CSS transition (globals.css) so axe
  // reads the settled color, not a mid-transition blend.
  await page.waitForTimeout(400);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

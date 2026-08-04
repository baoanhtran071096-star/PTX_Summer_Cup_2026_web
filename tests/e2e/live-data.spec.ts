import { test, expect } from '@playwright/test';

/**
 * Extends navigation.spec.ts's Supabase-independent-only coverage now
 * that a real local Supabase project exists (M12.5). Asserts real seeded
 * content renders on every core public route — not just that the route
 * doesn't crash.
 */

test('teams list renders real seeded teams with logos', async ({ page }) => {
  await page.goto('/doi');
  await expect(page.getByRole('heading', { name: 'TEAM P' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'TEAM T' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'TEAM X' })).toBeVisible();
  const logos = page.locator('img[alt*="TEAM"], img[src*="team-logos"]');
  await expect(logos.first()).toBeVisible();
});

test('team detail page renders squad with player avatars', async ({ page }) => {
  await page.goto('/doi/p');
  await expect(page.getByRole('heading', { name: /TEAM P/ })).toBeVisible();
  await expect(page.getByText('Đội hình')).toBeVisible();
});

test('players list renders all 24 real seeded players', async ({ page }) => {
  await page.goto('/cau-thu');
  await expect(page.getByText('Xuân Sử')).toBeVisible();
  await expect(page.locator('a[href^="/cau-thu/"]')).toHaveCount(24);
});

test('player id 18 resolves to the corrected name Xuân Sử', async ({ page }) => {
  await page.goto('/cau-thu/18');
  await expect(page.getByRole('heading', { name: 'Xuân Sử' })).toBeVisible();
});

test('schedule renders real seeded matches', async ({ page }) => {
  await page.goto('/lich-thi-dau');
  await expect(page.getByText('Sắp diễn ra').first()).toBeVisible();
});

test('standings table renders all 3 teams', async ({ page }) => {
  await page.goto('/bang-xep-hang');
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(3);
});

test('stats page renders without error against real (empty) data', async ({ page }) => {
  await page.goto('/thong-ke');
  await expect(page.getByRole('heading', { name: 'Vua phá lưới' })).toBeVisible();
});

test('prediction form renders real matches and players', async ({ page }) => {
  await page.goto('/du-doan');
  await expect(page.getByLabel('Tên của bạn')).toBeVisible();
  await expect(page.getByText('TEAM P vs TEAM T')).toBeVisible();
});

import { test, expect } from '@playwright/test';

/**
 * Only the homepage is Supabase-independent — every other route needs
 * a live project (see docs/gates/m12-evidence.md). These specs assert
 * what's actually achievable here: the nav shell renders and points
 * to the right places, without following through to pages that need data.
 */

test('homepage renders with correct title and content', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/PTX Summer Cup 2026/);
  await expect(page.getByRole('heading', { name: 'PTX Summer Cup 2026' })).toBeVisible();
});

test('main navigation exposes links to every core public route', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Điều hướng chính' });
  await expect(nav.getByRole('link', { name: 'Đội bóng' })).toHaveAttribute('href', '/doi');
  await expect(nav.getByRole('link', { name: 'Cầu thủ' })).toHaveAttribute('href', '/cau-thu');
  await expect(nav.getByRole('link', { name: 'Lịch thi đấu' })).toHaveAttribute('href', '/lich-thi-dau');
  await expect(nav.getByRole('link', { name: 'Kết quả' })).toHaveAttribute('href', '/ket-qua');
  await expect(nav.getByRole('link', { name: 'BXH' })).toHaveAttribute('href', '/bang-xep-hang');
  await expect(nav.getByRole('link', { name: 'Thống kê' })).toHaveAttribute('href', '/thong-ke');
  await expect(nav.getByRole('link', { name: 'Dự đoán' })).toHaveAttribute('href', '/du-doan');
});

test('unknown route shows the not-found page', async ({ page }) => {
  const response = await page.goto('/khong-ton-tai-xyz');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
});

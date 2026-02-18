import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test('loads the admin dashboard page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('KitchenAsty Admin');
  });

  test('displays sidebar with app name', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('KitchenAsty')).toBeVisible();
    await expect(page.getByText('Admin Panel')).toBeVisible();
  });

  test('displays the Dashboard heading', async ({ page }) => {
    await page.goto('/');
    const heading = page.getByRole('heading', { name: 'Dashboard' });
    await expect(heading).toBeVisible();
  });

  test('displays all four metric cards', async ({ page }) => {
    await page.goto('/');

    // Check within the main content area only
    const main = page.locator('main');
    await expect(main.getByText('Orders Today')).toBeVisible();
    await expect(main.getByText('Revenue Today')).toBeVisible();
    await expect(main.getByText('Pending Reservations')).toBeVisible();
    await expect(main.getByText('Active Menu Items')).toBeVisible();
  });

  test('metric cards show placeholder values', async ({ page }) => {
    await page.goto('/');
    const placeholders = page.getByText('--', { exact: true });
    await expect(placeholders.first()).toBeVisible();
    expect(await placeholders.count()).toBe(4);
  });

  test('sidebar has navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Locations' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Menu' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Reservations' })).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test('navigation, search, and layout work without local resource errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1:4173') && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.locator('.post')).toHaveCount(3);
  await page.getByRole('searchbox', { name: 'Search published posts' }).fill('High-Code');
  const result = page.locator('#search-results a').first();
  await expect(result).toHaveText('High-Code: The Unexpected Path to AI Democratisation');
  await result.click();
  await expect(page).toHaveURL(/\/blog\/high-code\/$/);
  await expect(page.locator('.single-post')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('the archive, legacy redirects, and fixed images are present', async ({ page, request }) => {
  await page.goto('/blog/keybase-keys-for-everyone-part-ii/');
  const images = page.locator('.post-body img');
  await expect(images).toHaveCount(2);
  for (const image of await images.all()) {
    await expect(image).toBeVisible();
    expect(await image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
  }
  await page.goto('/about-me/');
  await expect(page).toHaveURL(/\/about\/$/);
  await page.goto('/blog/three-types-of-ai/');
  await expect(page).toHaveURL(/\/blog\/three-categories-of-ai\/$/);
  for (const route of ['/backup/passwords.gpg', '/backup/decrypt_file.sh', '/blog/test-post/', '/blog/docker-a-very-simple-introduction/', '/blog/tool-using-ape/']) {
    expect((await request.get(route)).status()).toBe(404);
  }
});

test('the site remains readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.post').first()).toContainText('High-Code');
  await page.locator('.post .button').first().click();
  await expect(page.locator('.single-post')).toContainText('Why Simple Text Completion Matters');
  await context.close();
});

import { test, expect } from '@playwright/test';

for (const theme of ['light', 'dark']) {
  test(`Ash 1.2 preserves Copper and distinct controls in ${theme} mode`, async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    if (theme === 'light') await page.getByRole('button', { name: 'Use light colour theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('body')).toHaveCSS('background-color', theme === 'light' ? 'rgb(241, 237, 230)' : 'rgb(23, 22, 21)');
    await expect(page.locator('.writing-section .post-card h3').first()).toHaveCSS('color', theme === 'light' ? 'rgb(40, 37, 34)' : 'rgb(243, 237, 228)');
    await expect(page.locator('.post-card-arrow').first()).toHaveCSS('color', 'rgb(196, 82, 30)');

    // Exercise optional components without changing published article content.
    await page.evaluate(() => {
      const fixture = document.createElement('section');
      fixture.id = 'ash-colour-fixture';
      fixture.innerHTML = `<div style="background: var(--raised)"><a href="#" style="color: var(--accent-text)">Raised accent</a></div>
        <button class="button button--copper">Primary action</button>
        <button class="button button--copper" disabled>Unavailable action</button>
        <aside class="callout callout-information">Information</aside>`;
      document.querySelector('main').prepend(fixture);
    });
    const fixture = page.locator('#ash-colour-fixture');
    await expect(fixture.locator('a')).toHaveCSS('color', 'rgb(196, 82, 30)');
    const button = fixture.getByRole('button', { name: 'Primary action', exact: true });
    await expect(button).toHaveCSS('background-color', 'rgb(196, 82, 30)');
    await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
    await page.keyboard.press('Tab');
    await button.focus();
    await expect(button).toHaveCSS('outline-color', theme === 'light' ? 'rgb(40, 37, 34)' : 'rgb(243, 237, 228)');
    await button.hover();
    await expect(button).toHaveCSS('background-color', 'rgb(172, 69, 24)');
    await page.mouse.down();
    await expect(button).toHaveCSS('background-color', 'rgb(145, 57, 20)');
    await page.mouse.up();
    await page.mouse.move(0, 0);
    await button.evaluate(element => element.setAttribute('aria-pressed', 'true'));
    await expect(button).toHaveCSS('background-color', 'rgb(145, 57, 20)');
    const disabled = fixture.getByRole('button', { name: 'Unavailable action' });
    await expect(disabled).toBeDisabled();
    await expect(disabled).toHaveCSS('opacity', '1');
    await expect(disabled).toHaveCSS('color', theme === 'light' ? 'rgb(105, 99, 92)' : 'rgb(184, 175, 166)');
    await expect(fixture.locator('.callout-information')).toHaveCSS('color', theme === 'light' ? 'rgb(67, 92, 108)' : 'rgb(173, 196, 209)');
  });
}

test('navigation, search, and layout work without local resource errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1:4173') && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('/');
  if (await page.locator('.menu-toggle').isVisible()) await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.locator('.post-card')).toHaveCount(3);
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search the site' }).fill('High-Code');
  const result = page.locator('.search-results a').first();
  await expect(result).toHaveText('High-Code: The Unexpected Path to AI Democratisation');
  await result.click();
  await expect(page).toHaveURL(/\/blog\/high-code\/$/);
  await expect(page.locator('.single-page')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('the archive, legacy redirects, and fixed images are present', async ({ page, request }) => {
  await page.goto('/blog/keybase-keys-for-everyone-part-ii/');
  const images = page.locator('.prose img');
  await expect(images).toHaveCount(2);
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
  }
  await page.goto('/about-me/');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.hero')).toBeVisible();
  await page.goto('/about/');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.hero-lead')).toBeVisible();
  await expect(page.locator('#main-navigation a', { hasText: 'About' })).toHaveCount(0);
  await page.goto('/blog/three-types-of-ai/');
  await expect(page).toHaveURL(/\/blog\/three-categories-of-ai\/$/);
  for (const route of ['/backup/passwords.gpg', '/backup/decrypt_file.sh', '/blog/test-post/', '/blog/docker-a-very-simple-introduction/', '/blog/tool-using-ape/']) {
    expect((await request.get(route)).status()).toBe(404);
  }
});

test('every post leads with its Ash diagram, which a PNG copy stands in for in link previews', async ({ page, request }) => {
  const posts = await (await request.get('/index.json')).json();
  expect(posts.length).toBeGreaterThan(0);
  for (const post of posts) {
    await page.goto(post.url);
    const diagram = page.locator('.article-diagram svg');
    await expect(diagram).toBeVisible();
    await expect(diagram).toHaveAttribute('role', 'img');
    await expect(diagram).toHaveAttribute('aria-label', /^.{40,}$/);
    const preview = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(preview).toMatch(/\/img\/diagrams\/[a-z0-9-]+\.png$/);
    expect((await request.get(new URL(preview).pathname)).status()).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  }
  await page.goto('/blog/the-economics-and-ergonomics-of-ai/');
  await page.getByRole('button', { name: 'Use light colour theme' }).click();
  await expect(page.locator('.article-diagram .dg-label:not(.dg-label-accent)').first()).toHaveCSS('fill', 'rgb(105, 99, 92)');
  await expect(page.locator('.article-diagram .dg-label-accent').first()).toHaveCSS('fill', 'rgb(196, 82, 30)');
});

test('the site remains readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.post-card')).toHaveCount(3);
  await page.locator('.post-card h3 a').filter({ hasText: 'High-Code' }).click();
  await expect(page.locator('.single-page')).toContainText('Why Simple Text Completion Matters');
  await context.close();
});

test('Integrated cadence follows the colour mode and keeps its accessible name', async ({ page }) => {
  await page.goto('/');
  const brand = page.locator('.site-header .image-wordmark');
  await expect(brand).toHaveAccessibleName('Christopher Laing');
  const variant = await page.locator('.brand-small').first().isVisible() ? '.brand-small' : '.brand-full';
  // The homepage header sits on the dark masthead band in both colour modes.
  await expect(brand.locator(`${variant} .brand-dark`)).toBeVisible();
  await page.getByRole('button', { name: 'Use light colour theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(brand.locator(`${variant} .brand-dark`)).toBeVisible();
  await page.goto('/blog/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(brand.locator(`${variant} .brand-light`)).toBeVisible();
  await expect(brand.locator(`${variant} .brand-dark`)).toBeHidden();
  // The writing list continues as the reader scrolls, so it starts with at least one page.
  await expect(page.locator('.post-card').nth(2)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

for (const theme of ['light', 'dark']) {
  test(`the homepage list carries images and a dark closing band in ${theme} mode`, async ({ page }) => {
    await page.goto('/');
    if (theme === 'light') await page.getByRole('button', { name: 'Use light colour theme' }).click();
    // The priorities sentence lives in the closing band, not in the masthead.
    await expect(page.locator('.hero-description')).not.toBeEmpty();
    await expect(page.locator('.hero-description')).not.toContainText('I prioritise');

    // One diagram per card, hidden from assistive technology because the card's title names the post.
    const diagrams = page.locator('.writing-section .post-card-image svg').filter({ visible: true });
    await expect(diagrams).toHaveCount(3);
    for (const diagram of await diagrams.all()) await expect(diagram).toHaveAttribute('aria-hidden', 'true');
    // Diagrams take their colours from the colour mode.
    await expect(page.locator('.writing-section .post-card-image .dg-label:not(.dg-label-accent)').first()).toHaveCSS('fill', theme === 'light' ? 'rgb(105, 99, 92)' : 'rgb(184, 175, 166)');

    // Wide screens keep the excerpt over the faint edge of the image. Narrow screens put the
    // image above the card text.
    const cards = await page.locator('.writing-section .post-card').evaluateAll(elements => elements.map(card => ({
      wide: innerWidth > 900,
      image: card.querySelector('.post-card-image').getBoundingClientRect().toJSON(),
      copy: card.querySelector('.post-card-copy').getBoundingClientRect().toJSON(),
      meta: card.querySelector('.post-card-meta').getBoundingClientRect().toJSON(),
    })));
    for (const card of cards) {
      if (card.wide) expect(card.copy.right - card.image.left).toBeLessThanOrEqual(150);
      else expect(card.image.bottom).toBeLessThanOrEqual(card.meta.top);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

    const band = page.getByRole('region', { name: /^I prioritise work that strengthens the capabilities a nation depends on/ });
    await expect(band).toHaveCSS('background-color', 'rgb(23, 22, 21)');
    await expect(band.locator('h2')).toHaveCSS('color', 'rgb(243, 237, 228)');
    await expect(band.getByRole('link', { name: 'Connect on LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/christopherlaing/');
  });
}

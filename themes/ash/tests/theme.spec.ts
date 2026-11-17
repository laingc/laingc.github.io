import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { evaluateAshAccessibility } from '../scripts/ash-accessibility.mjs';

test('the example loads all local assets beneath a base path', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1:1314') && response.status() >= 400) errors.push(response.url());
  });
  for (const url of ['', 'blog/', 'blog/technical-writing/', 'about/', 'archive/', 'categories/', 'tags/systems/', 'series/working-notes/', 'projects/research/reading-room/', 'search/', 'fr/', 'ar/']) {
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    for (const image of await page.locator('main img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
    }
    const brokenPaths = await page.locator('a[href], script[src], link[rel="stylesheet"]').evaluateAll(elements => elements.map(element => element.getAttribute('href') || element.getAttribute('src')).filter(url => url?.startsWith('/') && !url.startsWith('/demo/')));
    expect(brokenPaths, url).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test('pagination, terms, nested sections, and aliases resolve', async ({ page }) => {
  await page.goto('blog/');
  await expect(page.locator('.post-card')).toHaveCount(4);
  await page.getByRole('link', { name: 'Next →', exact: true }).click();
  await expect(page).toHaveURL(/\/demo\/blog\/page\/2\/$/);
  await expect(page.locator('.post-card')).toHaveCount(3);
  await page.goto('categories/');
  await page.getByRole('link', { name: 'Technology 2' }).click();
  await expect(page.locator('.post-card')).toHaveCount(2);
  await page.goto('projects/research/reading-room/');
  await page.locator('.breadcrumb').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Research');
  await page.goto('blog/old-decisions/');
  await expect(page).toHaveURL(/\/blog\/considered-decisions\/$/);
});

test('theme selection works by keyboard and persists across pages', async ({ page }) => {
  await page.goto('');
  const hero = await page.locator('.hero').boundingBox();
  const button = page.getByRole('button', { name: 'Use dark colour theme' });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.locator('.hero').boundingBox()).toEqual(hero);
  await page.goto('blog/technical-writing/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: 'Use light colour theme' })).toHaveAttribute('aria-pressed', 'true');
});

test('the theme works with blocked storage', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } });
  });
  await page.goto('');
  await page.getByRole('button', { name: 'Use dark colour theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('Integrated cadence keeps its proportions, mode variants, and accessible name', async ({ page, request }) => {
  await page.goto('');
  const headerLogo = page.locator('.site-header .image-wordmark');
  const footerLogo = page.locator('.site-footer .image-wordmark');
  for (const logo of [headerLogo, footerLogo]) {
    await expect(logo).toHaveAccessibleName('Christopher Laing');
    await expect(logo.locator('.brand-full .brand-light')).toBeVisible();
    await expect(logo.locator('.brand-full .brand-dark')).toBeHidden();
    const size = await logo.locator('.brand-full .brand-light').boundingBox();
    expect(size!.width).toBeGreaterThanOrEqual(280);
    expect(size!.width / size!.height).toBeCloseTo(568 / 132, 2);
  }
  await page.getByRole('button', { name: 'Use dark colour theme' }).click();
  await expect(headerLogo.locator('.brand-full .brand-dark')).toBeVisible();
  await expect(headerLogo.locator('.brand-full .brand-light')).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(headerLogo.locator('.brand-full')).toBeHidden();
  await expect(headerLogo.locator('.brand-small .brand-dark')).toBeVisible();
  await expect(footerLogo.locator('.brand-small .brand-dark')).toBeVisible();
  expect(await headerLogo.locator('.brand-small .brand-dark').evaluate(element => getComputedStyle(element).filter)).toBe('none');
  await page.getByRole('button', { name: 'Use light colour theme' }).click();
  await expect(headerLogo.locator('.brand-small .brand-light')).toBeVisible();
  await expect(headerLogo.locator('.brand-small .brand-dark')).toBeHidden();
  for (const icon of await page.locator('link[rel="icon"], link[rel="apple-touch-icon"]').all()) {
    const url = await icon.getAttribute('href');
    expect(url).toMatch(/^\/demo\/brand\//);
    expect((await request.get(url!)).ok()).toBeTruthy();
  }
});

test('mobile navigation and nested menus support keyboard dismissal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('');
  const menu = page.getByRole('button', { name: 'Open navigation' });
  await menu.click();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await page.locator('.nav-group summary').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.nav-group summary')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Writing', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Writing');
});

test('reading, navigation, mathematics, and the search fallback work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:1314/demo/blog/technical-writing/');
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.locator('math')).toHaveCount(2);
  await expect(page.locator('pre').first()).toBeVisible();
  await page.goto('http://127.0.0.1:1314/demo/search/');
  await expect(page.getByText('Search uses JavaScript.')).toBeVisible();
  await expect(page.locator('.search-fallback a').first()).toBeVisible();
  await context.close();
});

test('the skip link moves focus past the masthead', async ({ page }) => {
  await page.goto('');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('local search supports deep links, accents, empty results, and safe query text', async ({ page }) => {
  await page.goto('search/?q=mathematics');
  await expect(page.locator('.search-results')).toContainText('A field guide to technical writing');
  await page.getByRole('searchbox').fill('Maori');
  await expect(page.locator('.search-results')).toContainText('A field guide to technical writing');
  await page.getByRole('searchbox').fill('<img src=x onerror=alert(1)>');
  await expect(page.getByRole('status')).toHaveText('No results. Try a different phrase.');
  await expect(page.locator('.search-results img')).toHaveCount(0);
  await page.getByRole('searchbox').fill('');
  await expect(page.getByRole('status')).toHaveText('Search titles, topics, and article text.');
});

test('search reports a failed index request and retries', async ({ page }) => {
  await page.route('**/search.json', route => route.fulfill({ status: 503, body: '' }));
  await page.goto('search/?q=systems');
  await expect(page.getByRole('status')).toContainText('Search could not load');
  await page.unroute('**/search.json');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.locator('.search-results li').first()).toBeVisible();
});

test('translations use their own search index, labels, and direction', async ({ page }) => {
  await page.goto('fr/search/?q=décision');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR');
  await expect(page.locator('.search-results')).toContainText('Prendre le temps de décider');
  await expect(page.locator('.search-results a').first()).toHaveAttribute('href', /\/demo\/fr\/blog\//);
  await page.goto('ar/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Christopher Laing');
  await page.getByRole('link', { name: 'Français', exact: true }).click();
  await expect(page).toHaveURL(/\/demo\/fr\/$/);
});

test('code copy excludes line numbers and preserves code', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('blog/technical-writing/');
  await page.getByRole('button', { name: 'Copy code', exact: true }).first().click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text.trimEnd()).toBe('def calculate_total(values):\n    """Return the total of a sequence."""\n    return sum(values)\n\nprint(calculate_total([2, 3, 5]))');
});

test('semantic callouts include a translated label and a non-colour cue', async ({ page }) => {
  await page.goto('blog/technical-writing/');
  const callout = page.locator('.callout-information');
  await expect(callout.locator('.callout-status')).toHaveText('ⓘInformation');
  await expect(callout.locator('.callout-icon')).toHaveAttribute('aria-hidden', 'true');
  await expect(callout.locator('.callout-title')).toHaveText('An example, with limits');
});

test('metadata, feeds, local media, and the error page resolve', async ({ page, request }) => {
  await page.goto('blog/minimal-post/');
  await expect(page.locator('.article-meta time')).toHaveText('1 January 2023');
  const schema = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(schema!).datePublished).toBe('2023-01-01T00:15:00+13:00');
  expect(JSON.parse(schema!)['@type']).toBe('BlogPosting');
  for (const path of ['index.xml', 'sitemap.xml', 'robots.txt', 'search.json', 'media/tone.wav', 'media/sample.mp4', 'media/sample.vtt']) expect((await request.get(path)).ok(), path).toBeTruthy();
  await page.goto('missing-page/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
});

for (const width of [320, 360, 390, 768, 1280, 1440]) {
  test(`layouts fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const url of ['', 'blog/technical-writing/', 'blog/', 'search/', 'ar/']) {
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), url).toBeLessThanOrEqual(width);
    }
  });
}

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`accessibility: ${theme} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript(theme => localStorage.setItem('ash-theme', theme), theme);
      for (const url of ['', 'blog/technical-writing/', 'search/?q=systems', 'categories/']) {
        await page.goto(url);
        await page.evaluate(() => document.fonts.ready);
        if (url.startsWith('search')) await expect(page.locator('.search-results li').first()).toBeVisible();
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
        const assessment = await evaluateAshAccessibility(page, result);
        await test.info().attach(`accepted-copper-contrast-exceptions-${url.replaceAll('/', '-') || 'home'}`, { body: JSON.stringify(assessment.exceptions, null, 2), contentType: 'application/json' });
        expect(assessment.violations, url).toEqual([]);
      }
    });
  }
}

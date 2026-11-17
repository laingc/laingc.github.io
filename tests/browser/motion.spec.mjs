import { test, expect } from '@playwright/test';

const label = 'Business, automation, and national security';

// Counts the canvas pixels that the ROC plot has painted.
const paintedPixels = page => page.locator('.fx-roc').evaluate(canvas => {
  const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  let painted = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) painted++;
  return painted;
});

const pulseStyles = page => page.locator('.post-card').evaluateAll(cards => cards.map(card => {
  const style = getComputedStyle(card, '::after');
  return { name: style.animationName, duration: style.animationDuration };
}));

test('the site opens in dark mode before any script runs', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toMatch(/<html[^>]*data-theme="?dark/);
  expect(html).toMatch(/<meta name="?theme-color"? content="?#171615/);
});

for (const mode of ['dark', 'light']) {
  test(`the homepage masthead is a dark band in ${mode} mode`, async ({ page, context }) => {
    await context.addInitScript(value => localStorage.setItem('ash-theme', value), mode);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
    await expect(page.locator('.site-header')).toHaveCSS('background-color', 'rgb(23, 22, 21)');
    await expect(page.locator('.hero')).toHaveCSS('color', 'rgb(243, 237, 228)');
    await expect(page.locator('.hero .hero-description')).toHaveCSS('color', 'rgb(184, 175, 166)');
    // Below the masthead, the page follows the reader's colour mode.
    await expect(page.locator('body')).toHaveCSS('background-color', mode === 'light' ? 'rgb(241, 237, 230)' : 'rgb(23, 22, 21)');
    await expect(page.locator('.writing-section h2')).toHaveCSS('color', mode === 'light' ? 'rgb(40, 37, 34)' : 'rgb(243, 237, 228)');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test('the masthead fits short landscape screens and fills wide screens', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The test sets its own screen sizes.');
  const sizes = [
    { width: 844, height: 390, columns: 2 },
    { width: 1440, height: 900, columns: 2, column: 1240 },
    { width: 1920, height: 1080, columns: 2, column: 1440 },
    { width: 2560, height: 1440, columns: 2, column: 1600 },
  ];
  for (const size of sizes) {
    const context = await browser.newContext({ viewport: { width: size.width, height: size.height } });
    const page = await context.newPage();
    await page.goto('/');
    const hero = page.locator('.hero');
    const columns = await hero.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(columns, `${size.width}px columns`).toBe(size.columns);
    if (size.column) expect(Math.round((await hero.boundingBox()).width), `${size.width}px column`).toBe(size.column);
    // The introduction and its links are on the first screen.
    await expect(page.locator('.hero-actions')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await context.close();
  }
});

test('motion effects resolve to the original content without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');

  // The decoder restores the exact label and removes its temporary spans.
  const eyebrow = page.locator('.hero .accent-label');
  await expect(eyebrow).toHaveText(label);
  await expect(eyebrow.locator('span')).toHaveCount(0);

  // The ROC plot is decorative, covers the masthead exactly, and paints.
  const plot = page.locator('.fx-roc');
  await expect(plot).toHaveAttribute('aria-hidden', 'true');
  await expect(plot).toHaveCSS('pointer-events', 'none');
  await expect(plot).toHaveClass(/is-ready/);
  const hero = await page.locator('.hero').boundingBox();
  const box = await plot.boundingBox();
  expect(Math.abs(box.y - hero.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(box.height - hero.height)).toBeLessThanOrEqual(1);
  await expect.poll(() => paintedPixels(page)).toBeGreaterThan(1000);

  // Content below the fold waits for the reader, then settles fully visible.
  const card = page.locator('.post-card').last();
  if (await card.evaluate(element => element.classList.contains('fx-reveal'))) {
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveClass(/is-visible/);
  }
  await expect(card).toHaveCSS('opacity', '1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // Every article rule pulses, and no two pulses share a pace.
  const pulses = await pulseStyles(page);
  expect(pulses.map(pulse => pulse.name)).toEqual(pulses.map(() => 'fx-pulse'));
  expect(new Set(pulses.map(pulse => pulse.duration)).size).toBe(pulses.length);

  // The colour mode wipe changes the theme and cleans up after itself.
  await page.evaluate(() => scrollTo(0, 0));
  await page.getByRole('button', { name: 'Use light colour theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Use dark colour theme' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('html')).not.toHaveClass(/fx-theme-wipe/);

  for (const route of ['/blog/', '/blog/high-code/', '/categories/']) {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('.fx-roc')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('the writing page shows every article as the reader scrolls', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/blog/');
  const total = await page.locator('#fx-writing').evaluate(template => template.content.querySelectorAll('.post-card').length);
  expect(total).toBeGreaterThan(3);
  await expect(page.locator('.pagination')).toBeHidden();
  await expect(page.locator('.fx-cadence-tick')).toHaveCount(total);

  // Scroll until the list closes, then check that every article is there once.
  await expect.poll(async () => {
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    return page.locator('.fx-writing-end').count();
  }, { timeout: 20000 }).toBe(1);
  const cards = page.locator('.list-content > .post-list > .post-card');
  const hrefs = await cards.locator('h3 a').evaluateAll(links => links.map(link => link.getAttribute('href')));
  expect(hrefs).toHaveLength(total);
  expect(new Set(hrefs).size).toBe(total);
  // The closing note decodes once it is on screen.
  await page.locator('.fx-writing-end').scrollIntoViewIfNeeded();
  await expect(page.locator('.fx-writing-end')).toHaveText(new RegExp(`^${total} articles, \\d{4} to \\d{4}$`));
  await expect(page.locator('.list-content [role="status"]')).toHaveText(`Showing ${total} of ${total} articles.`);

  // The back button returns to the full list.
  const deep = cards.nth(total - 2).locator('h3 a');
  await deep.click();
  await expect(page.locator('.single-page')).toBeVisible();
  await page.goBack();
  await expect(cards).toHaveCount(total);

  // A tick on the cadence strip jumps to its article.
  await page.evaluate(() => scrollTo(0, 0));
  const oldest = await cards.last().locator('h3 a').textContent();
  await page.locator('.fx-cadence-tick').last().click();
  await expect(cards.last()).toBeInViewport();
  await expect(page.locator('.fx-cadence-title')).toHaveText(oldest.trim());
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('the writing page keeps its page links without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/blog/');
  await expect(page.locator('.list-content > .post-list > .post-card')).toHaveCount(3);
  await expect(page.locator('.pagination [rel="next"]')).toBeVisible();
  await page.locator('.pagination [rel="next"]').click();
  await expect(page).toHaveURL(/\/blog\/page\/2\/$/);
  await context.close();
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('nothing is hidden, animated, or decoded, and the plot is still', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.fx-reveal, .fx-rule, .fx-wipe')).toHaveCount(0);
    await expect(page.locator('.hero .accent-label')).toHaveText(label);
    await expect(page.locator('.hero .accent-label span')).toHaveCount(0);
    await expect(page.locator('.hero h1')).toHaveCSS('animation-name', 'none');
    for (const card of await page.locator('.post-card').all()) await expect(card).toHaveCSS('opacity', '1');
    expect((await pulseStyles(page)).map(pulse => pulse.name)).toEqual(['none', 'none', 'none']);
    await expect.poll(() => paintedPixels(page)).toBeGreaterThan(1000);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(100);
    const first = await page.locator('.fx-roc').evaluate(canvas => canvas.toDataURL());
    await page.waitForTimeout(400);
    expect(await page.locator('.fx-roc').evaluate(canvas => canvas.toDataURL())).toBe(first);
    await page.getByRole('button', { name: 'Use light colour theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).not.toHaveClass(/fx-theme-wipe/);
  });
});

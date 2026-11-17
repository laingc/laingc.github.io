import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = process.env.ASH_PREVIEW_URL || 'http://127.0.0.1:1313/';
await mkdir('images', { recursive: true });
await mkdir('.test-output/screenshots', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, reducedMotion: 'reduce' });
  for (const theme of ['light', 'dark']) {
    for (const [name, route] of [['home', ''], ['article', 'blog/technical-writing/'], ['archive', 'blog/'], ['search', 'search/?q=systems'], ['rtl', 'ar/']]) {
      await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
      await page.evaluate(theme => { localStorage.setItem('ash-theme', theme); document.documentElement.dataset.theme = theme; }, theme);
      await page.evaluate(() => document.fonts.ready);
      for (const image of await page.locator('main img').all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(image => image.decode());
      }
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: `.test-output/screenshots/${name}-${theme}.png`, fullPage: true });
      if (name === 'home') await page.screenshot({ path: theme === 'light' ? 'images/screenshot.png' : 'images/screenshot-dark.png' });
    }
  }
  const thumbnail = await browser.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 0.6, reducedMotion: 'reduce' });
  await thumbnail.goto(base, { waitUntil: 'networkidle' });
  await thumbnail.evaluate(() => document.fonts.ready);
  await thumbnail.screenshot({ path: 'images/tn.png' });
  await thumbnail.close();
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      for (const [name, route] of [['home', ''], ['article', 'blog/technical-writing/']]) {
        await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
        await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
        await page.screenshot({ path: `.test-output/screenshots/${name}-${width}-${theme}.png`, fullPage: true });
      }
    }
  }
  console.log('Theme-directory images and responsive screenshots saved.');
} finally {
  await browser.close();
}

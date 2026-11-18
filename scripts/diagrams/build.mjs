// Builds the Ash diagrams: one SVG per post in assets/diagrams/. With `--png`, it also renders
// a 1200 × 630 Dark-mode PNG of each in static/img/diagrams/ for link previews, which cannot
// use SVG. With `--check`, it changes nothing and fails if an SVG differs from its drawing.
//
// Usage: node scripts/diagrams/build.mjs [--png | --check]
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Drawing } from './lib.mjs';
import { diagrams } from './posts.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const svgDirectory = path.join(root, 'assets', 'diagrams');
const pngDirectory = path.join(root, 'static', 'img', 'diagrams');
const mode = process.argv[2];
if (process.argv.length > 3 || (mode && !['--png', '--check'].includes(mode))) {
  console.error('Usage: node scripts/diagrams/build.mjs [--png | --check]');
  process.exit(2);
}

const drawings = Object.entries(diagrams).map(([slug, draw]) => {
  const drawing = new Drawing(`dg-${slug}`);
  draw(drawing);
  return { slug, svg: String(drawing) };
});

if (mode === '--check') {
  const problems = [];
  for (const { slug, svg } of drawings) {
    const current = await readFile(path.join(svgDirectory, `${slug}.svg`), 'utf8').catch(() => null);
    if (current === null) problems.push(`Missing diagram: assets/diagrams/${slug}.svg`);
    else if (current !== svg) problems.push(`Out-of-date diagram: assets/diagrams/${slug}.svg`);
  }
  for (const file of await readdir(svgDirectory).catch(() => [])) {
    if (file.endsWith('.svg') && !Object.hasOwn(diagrams, file.slice(0, -4))) problems.push(`Diagram without a drawing: assets/diagrams/${file}`);
  }
  if (problems.length) {
    console.error(`${problems.join('\n')}\nRun npm run diagrams to rebuild them.`);
    process.exitCode = 1;
  } else {
    console.log(`Checked ${drawings.length} diagrams.`);
  }
} else {
  await mkdir(svgDirectory, { recursive: true });
  for (const { slug, svg } of drawings) await writeFile(path.join(svgDirectory, `${slug}.svg`), svg);
  console.log(`Wrote ${drawings.length} diagrams to assets/diagrams/.`);
  if (mode === '--png') await renderPngs();
}

/** A diagram showing all of its centred frame, the view an article shows (see ash/diagram.html).
    The preview is narrower than most frames, so the frame fits its width rather than losing its sides. */
function centred(svg) {
  const frame = svg.match(/data-frame="([^"]+)"/)?.[1];
  if (!frame) return svg;
  return svg.replace(/viewBox="[^"]*"/, `viewBox="${frame}"`).replace(/preserveAspectRatio="[^"]*"/, 'preserveAspectRatio="xMidYMid meet"');
}

async function renderPngs() {
  const { chromium } = await import('@playwright/test');
  await mkdir(pngDirectory, { recursive: true });
  const stylesheets = ['ash-tokens.css', 'ash.css'].map(file => pathToFileURL(path.join(root, 'themes/ash/assets/css', file)).href);
  const font = pathToFileURL(path.join(root, 'themes/ash/assets/fonts/ibm-plex-mono-latin-400-normal.woff2')).href;
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'ash-diagrams-'));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    for (const { slug, svg } of drawings) {
      const file = path.join(temporary, `${slug}.html`);
      await writeFile(file, `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8">
<style>@font-face { font-family: 'IBM Plex Mono'; src: url('${font}') format('woff2'); }</style>
${stylesheets.map(href => `<link rel="stylesheet" href="${href}">`).join('\n')}
<style>html, body { margin: 0; background: var(--canvas); } .ash-diagram svg { width: 1200px; height: 630px; }</style>
</head><body><div class="ash-diagram">${centred(svg)}</div></body></html>`);      await page.goto(pathToFileURL(file).href);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(pngDirectory, `${slug}.png`) });
    }
  } finally {
    await browser.close();
    await rm(temporary, { recursive: true, force: true });
  }
  console.log(`Rendered ${drawings.length} link-preview images to static/img/diagrams/.`);
}

import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import { filesUnder, loadContent } from './content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'public');
const origin = 'https://chrislaing.net';
const content = await loadContent(root);
const files = await filesUnder(output);
const filenames = new Set(files.map(file => path.relative(output, file).split(path.sep).join('/')));
const errors = [];
const exists = async filename => {
  try { await access(filename); return true; } catch { return false; }
};

function checkTarget(reference, page) {
  if (!reference || /^(#|data:|mailto:|tel:|javascript:)/.test(reference)) return;
  const relativePage = path.relative(output, page).split(path.sep).join('/').replace(/index\.html$/, '');
  const url = new URL(reference, `${origin}/${relativePage}`);
  if (url.origin !== origin) return;
  let filename = decodeURIComponent(url.pathname).replace(/^\//, '');
  if (!filename || filename.endsWith('/')) filename += 'index.html';
  if (!filenames.has(filename) && !filenames.has(`${filename}/index.html`)) {
    errors.push(`${path.relative(root, page)}: missing local target ${reference}`);
  }
}

for (const filename of files) {
  const relative = path.relative(output, filename);
  if (/(^|[/\\])(backup|\.git|node_modules)([/\\]|$)|\.(gpg|key|pem)$|decrypt_file\.sh|\.DS_Store$/.test(relative)) {
    errors.push(`Forbidden publication: ${relative}`);
  }
  if (filename.endsWith('.html')) {
    const { document } = parseHTML(await readFile(filename, 'utf8'));
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical?.getAttribute('href')?.startsWith(`${origin}/`)) errors.push(`${relative}: missing HTTPS canonical URL`);
    for (const element of document.querySelectorAll('[href], [src]')) {
      checkTarget(element.getAttribute('href'), filename);
      checkTarget(element.getAttribute('src'), filename);
    }
    for (const image of document.querySelectorAll('img')) {
      if (!image.hasAttribute('alt')) errors.push(`${relative}: image has no alt attribute`);
    }
  } else if (filename.endsWith('.css')) {
    const css = await readFile(filename, 'utf8');
    for (const match of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) checkTarget(match[1], filename);
  }
}

const index = JSON.parse(await readFile(path.join(output, 'index.json'), 'utf8'));
const publishedPosts = content.filter(page => page.published && page.route.startsWith('/blog/'));
assert.deepEqual(index.map(post => post.url).sort(), publishedPosts.map(post => post.route).sort(), 'Search index must contain exactly the published posts');
assert.equal(await readFile(path.join(output, 'CNAME'), 'utf8'), 'chrislaing.net\n');
const sitemap = await readFile(path.join(output, 'sitemap.xml'), 'utf8');
const rss = await readFile(path.join(output, 'index.xml'), 'utf8');
for (const page of content) {
  const target = path.join(output, page.route.slice(1), 'index.html');
  if (page.published) {
    if (!await exists(target)) errors.push(`Published page missing: ${page.route}`);
    if (!sitemap.includes(`${origin}${page.route}`)) errors.push(`Page missing from sitemap: ${page.route}`);
    for (const image of page.front.images ?? []) {
      if (!image.src || !await exists(path.join(root, 'static', image.src.replace(/^\//, '')))) {
        errors.push(`${path.relative(root, page.filename)}: missing featured image ${image.src}`);
      }
    }
    if (page.route.startsWith('/blog/') && !rss.includes(`${origin}${page.route}`)) errors.push(`Post missing from RSS: ${page.route}`);
  } else {
    if (await exists(target) || sitemap.includes(`${origin}${page.route}`) || rss.includes(`${origin}${page.route}`)) errors.push(`Unpublished content exposed: ${page.route}`);
  }
}
for (const route of ['test-post', 'tool-using-ape', 'delegating-doubt', 'iron-man-suits', 'the-attention-budget']) {
  if (filenames.has(`blog/${route}/index.html`) || index.some(post => post.url === `/blog/${route}/`)) errors.push(`Removed post exposed: ${route}`);
}
for (const route of ['about-me', 'blog/three-types-of-ai']) {
  if (!filenames.has(`${route}/index.html`)) errors.push(`Legacy redirect missing: ${route}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${content.length} source pages, ${publishedPosts.length} published posts, and ${files.length} output files.`);
}

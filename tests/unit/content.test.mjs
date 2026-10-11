import test from 'node:test';
import assert from 'node:assert/strict';
import { parseContent } from '../../scripts/content.mjs';

const sample = (extra = '') => `+++\ntitle = "Example"\ndate = "2024-08-01T15:00:00+12:00"\ndraft = false\n${extra}\n+++\nBody text.`;
test('TOML front matter supports initial whitespace and existing metadata', () => {
  const page = parseContent(`\n${sample('tags = ["AI"]')}`, '/content/blog/example.md');
  assert.equal(page.route, '/blog/example/');
  assert.equal(page.published, true);
  assert.equal(page.body, 'Body text.');
  assert.deepEqual(page.front.tags, ['AI']);
});
test('drafts and future posts are not eligible for production', () => {
  assert.equal(parseContent(sample().replace('draft = false', 'draft = true'), '/content/blog/example.md').published, false);
  assert.equal(parseContent(sample().replace('2024-08-01', '2099-08-01'), '/content/blog/example.md').published, false);
});
test('blog content requires an explicit draft flag', () => {
  assert.throws(() => parseContent(sample().replace('draft = false\n', ''), '/content/blog/example.md'), /draft must be explicitly/);
});
test('timestamps require a timezone', () => {
  assert.throws(() => parseContent(sample().replace('+12:00', ''), '/content/blog/example.md'), /timezone-aware/);
});
test('metadata rejects missing titles and malformed taxonomy arrays', () => {
  assert.throws(() => parseContent(sample().replace('"Example"', '""'), '/content/blog/example.md'), /missing title/);
  assert.throws(() => parseContent(sample('tags = "AI"'), '/content/blog/example.md'), /array of strings/);
});

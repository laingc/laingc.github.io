import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'smol-toml';

export async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => {
    const filename = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink not allowed: ${filename}`);
    return entry.isDirectory() ? filesUnder(filename) : [filename];
  }));
  return files.flat();
}

export function parseContent(text, filename) {
  const match = text.match(/^\s*\+\+\+\r?\n([\s\S]*?)\r?\n\+\+\+(?:\r?\n|$)/);
  if (!match) throw new Error(`${filename}: expected TOML front matter`);
  const front = parse(match[1]);
  if (typeof front.title !== 'string' || !front.title.trim()) throw new Error(`${filename}: missing title`);
  const date = String(front.date ?? '');
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2}))?$/.test(date) || Number.isNaN(Date.parse(date))) {
    throw new Error(`${filename}: expected an ISO date or a timezone-aware timestamp`);
  }
  if (filename.replaceAll('\\', '/').includes('/blog/') && typeof front.draft !== 'boolean') {
    throw new Error(`${filename}: draft must be explicitly true or false`);
  }
  for (const field of ['tags', 'categories', 'aliases']) {
    if (front[field] !== undefined && (!Array.isArray(front[field]) || front[field].some(value => typeof value !== 'string'))) {
      throw new Error(`${filename}: ${field} must be an array of strings`);
    }
  }
  const section = path.basename(path.dirname(filename));
  const stem = path.basename(filename, '.md');
  const route = section === 'blog' ? `/blog/${stem}/` : `/${stem}/`;
  return { filename, front, body: text.slice(match[0].length), route, published: front.draft !== true && Date.parse(date) <= Date.now() };
}

export async function loadContent(root) {
  const files = (await filesUnder(path.join(root, 'content'))).filter(file => file.endsWith('.md'));
  return Promise.all(files.map(async file => parseContent(await readFile(file, 'utf8'), file)));
}

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import { filesUnder } from './content.mjs';

const output = fileURLToPath(new URL('../public/', import.meta.url));
const urls = new Set();
for (const filename of (await filesUnder(output)).filter(file => file.endsWith('.html'))) {
  const { document } = parseHTML(await readFile(filename, 'utf8'));
  for (const link of document.querySelectorAll('a[href]')) {
    const value = link.getAttribute('href');
    if (!/^https?:\/\//.test(value)) continue;
    const url = new URL(value);
    if (url.hostname === 'chrislaing.net') continue;
    url.hash = '';
    urls.add(url.href);
  }
}
let broken = 0;
const queue = [...urls];
async function worker() {
  while (queue.length) {
    const url = queue.shift();
    try {
      let response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
      if ([403, 405].includes(response.status)) {
        response = await fetch(url, { signal: AbortSignal.timeout(15000) });
        await response.body?.cancel();
      }
      if ([404, 410].includes(response.status)) {
        console.error(`Broken link: ${response.status} ${url}`);
        broken++;
      } else if (response.status >= 400) {
        console.warn(`Link requires manual review: ${response.status} ${url}`);
      }
    } catch {
      console.warn(`Link requires manual review: timeout or connection error ${url}`);
    }
  }
}
await Promise.all(Array.from({ length: 5 }, worker));
console.log(`Reviewed ${urls.size} external URLs. Confirmed broken links: ${broken}.`);
process.exitCode = broken ? 1 : 0;

import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, stat, rm } from 'node:fs/promises';
import path from 'node:path';

const destination = path.resolve('.test-output/browser');
await rm(destination, { recursive: true, force: true });
const build = spawnSync(process.env.HUGO_BIN || 'hugo', ['--source', 'exampleSite', '--destination', destination, '--baseURL', 'http://127.0.0.1:1314/demo/', '--minify'], { encoding: 'utf8' });
if (build.status !== 0 || /\b(?:WARN|ERROR)\b/.test(build.stdout + build.stderr)) {
  console.error(build.stdout, build.stderr);
  process.exit(1);
}
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.vtt': 'text/vtt' };
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1:1314');
    if (!url.pathname.startsWith('/demo/')) throw new Error('Outside the configured base URL');
    let filename = path.resolve(destination, decodeURIComponent(url.pathname.slice(6)) || '.');
    if (filename !== destination && !filename.startsWith(destination + path.sep)) throw new Error('Invalid path');
    if ((await stat(filename)).isDirectory()) filename = path.join(filename, 'index.html');
    response.setHeader('Content-Type', types[path.extname(filename)] || 'application/octet-stream');
    response.end(await readFile(filename));
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/html' });
    response.end(await readFile(path.join(destination, '404.html')));
  }
}).listen(1314, '127.0.0.1');

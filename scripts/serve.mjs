import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const types = { '.html': 'text/html', '.json': 'application/json', '.xml': 'application/xml', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.txt': 'text/plain' };
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1:4173');
    const pathname = decodeURIComponent(url.pathname);
    const filename = path.resolve(root, `.${pathname}`, pathname.endsWith('/') ? 'index.html' : '');
    if (!filename.startsWith(root)) { response.writeHead(403).end(); return; }
    const data = await readFile(filename);
    response.writeHead(200, { 'Content-Type': types[path.extname(filename)] ?? 'application/octet-stream' });
    response.end(data);
  } catch {
    response.writeHead(404).end('Page not found');
  }
}).listen(4173, '127.0.0.1', () => console.log('Preview server: http://127.0.0.1:4173'));

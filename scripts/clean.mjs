import { lstat, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const destination = fileURLToPath(new URL('../public', import.meta.url));
try {
  const info = await lstat(destination);
  if (info.isSymbolicLink() || !info.isDirectory()) {
    throw new Error('Refusing to remove public: it is not a regular directory.');
  }
  await rm(destination, { recursive: true });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

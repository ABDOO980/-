// Runs after `vite build`: stamps the service worker with this build's id and the
// list of every file to keep for offline use.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/public');
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const full = path.join(dir, name);
  return statSync(full).isDirectory() ? walk(full) : [full];
});
const files = walk(dist).map((file) => '/' + path.relative(dist, file).split(path.sep).join('/'));
const skip = (file) => file === '/sw.js' || file === '/robots.txt' || file.startsWith('/adhan/') || file.endsWith('.map');
const list = ['/', ...files.filter((file) => !skip(file))];

const hash = createHash('sha1');
for (const file of files.filter((f) => f !== '/sw.js').sort()) hash.update(file).update(readFileSync(path.join(dist, file)));
const build = hash.digest('hex').slice(0, 10);

const swPath = path.join(dist, 'sw.js');
const sw = readFileSync(swPath, 'utf8')
  .replace("'__BUILD__'", JSON.stringify(build))
  .replace("'__PRECACHE__'", JSON.stringify(JSON.stringify(list)));
writeFileSync(swPath, sw);
console.log(`service worker: ${list.length} files kept for offline use (build ${build})`);

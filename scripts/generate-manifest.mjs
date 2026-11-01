import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter((name) => name && name !== 'MANIFEST.json')
  .sort();

const manifest = files.map((name) => {
  const contents = fs.readFileSync(path.join(root, name));
  return {
    path: name,
    sha256: crypto.createHash('sha256').update(contents).digest('hex'),
    bytes: contents.byteLength,
  };
});

fs.writeFileSync(path.join(root, 'MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o644 });
console.log(JSON.stringify({ ok: true, files: manifest.length }));

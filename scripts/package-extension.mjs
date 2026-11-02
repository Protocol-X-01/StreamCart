import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { chdir, cwd } from 'node:process';
import { dirname, join, resolve } from 'node:path';

const root = cwd();
const archive = resolve(process.env.TWITCH_EXTENSION_ARCHIVE ?? 'streamcart-twitch-extension.zip');
const buildDir = resolve(process.env.TWITCH_EXTENSION_BUILD_DIR ?? 'apps/extension/dist');
if (existsSync(archive)) throw new Error(`Refusing to overwrite existing archive: ${archive}`);
mkdirSync(dirname(archive), { recursive: true });

for (const name of ['VITE_API_ORIGIN', 'VITE_CATALOGUE_ORIGIN']) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required before packaging`);
  const url = new URL(value);
  if (url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error(`${name} must be a public HTTPS origin`);
}

execFileSync('npm', ['run', 'build', '-w', '@streamcart/extension', '--', '--outDir', buildDir, '--emptyOutDir'], { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } });

function readTextAssets(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return readTextAssets(path);
    return /\.(?:css|html|js|json)$/.test(entry.name) ? [readFileSync(path, 'utf8')] : [];
  }).join('\n');
}

const builtAssets = readTextAssets(buildDir);
for (const name of ['VITE_API_ORIGIN', 'VITE_CATALOGUE_ORIGIN']) {
  if (!builtAssets.includes(process.env[name])) throw new Error(`${name} was not embedded in the Twitch extension build`);
}
for (const fallback of ['http://localhost:8787', 'http://localhost:5174']) {
  if (builtAssets.includes(fallback)) throw new Error(`Local development fallback ${fallback} remains in the Twitch extension build`);
}

const temporaryArchive = `${archive}.tmp-${process.pid}.zip`;
try {
  chdir(buildDir);
  execFileSync('zip', ['-r', temporaryArchive, '.'], { stdio: 'inherit' });
  chdir(root);
  renameSync(temporaryArchive, archive);
} finally {
  chdir(root);
  rmSync(temporaryArchive, { force: true });
}

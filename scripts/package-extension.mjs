import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { chdir } from 'node:process';

for (const name of ['VITE_API_ORIGIN', 'VITE_CATALOGUE_ORIGIN']) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required before packaging`);
  const url = new URL(value);
  if (url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error(`${name} must be a public HTTPS origin`);
}

rmSync('streamcart-twitch-extension.zip', { force: true });
execFileSync('npm', ['run', 'build', '-w', '@streamcart/extension'], { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } });
chdir('apps/extension/dist');
execFileSync('zip', ['-r', '../../../streamcart-twitch-extension.zip', '.'], { stdio: 'inherit' });

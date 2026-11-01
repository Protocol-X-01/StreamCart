import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const target = process.argv[2] ?? 'preview';
if (!['preview', 'production', 'development'].includes(target)) throw new Error('Target must be preview, production, or development');
const publicOrigin = process.argv[3] ? new URL(process.argv[3]) : undefined;
if (target === 'production' && !publicOrigin) throw new Error('Production requires the stable public origin as the second argument');
if (publicOrigin && (publicOrigin.protocol !== 'https:' || publicOrigin.pathname !== '/' || publicOrigin.search || publicOrigin.hash)) {
  throw new Error('Public origin must be an HTTPS origin without a path, query, or fragment');
}
const source = fs.readFileSync(resolve(import.meta.dirname, '../.env'), 'utf8');
const local = Object.fromEntries(source.split(/\r?\n/).filter((line) => line && !line.startsWith('#') && line.includes('=')).map((line) => {
  const split = line.indexOf('=');
  return [line.slice(0, split), line.slice(split + 1)];
}));
const values = {
  NODE_ENV: 'production', DEMO_MODE: 'false', SAFE_SEARCH: 'true',
  CHANNEL3_API_KEY: local.CHANNEL3_API_KEY, CHANNEL3_COLLECTION_ID: local.CHANNEL3_COLLECTION_ID,
  CHANNEL3_BASE_URL: local.CHANNEL3_BASE_URL, CHANNEL3_COUNTRY: local.CHANNEL3_COUNTRY,
  CHANNEL3_LANGUAGE: local.CHANNEL3_LANGUAGE, CHANNEL3_CURRENCY: local.CHANNEL3_CURRENCY,
  TWITCH_EXTENSION_SECRET: local.TWITCH_EXTENSION_SECRET, TWITCH_WEBHOOK_SECRET: local.TWITCH_WEBHOOK_SECRET,
  PRODUCT_URL_HOSTS: local.PRODUCT_URL_HOSTS, IMAGE_URL_HOSTS: local.IMAGE_URL_HOSTS,
  ...(publicOrigin ? {
    VITE_API_ORIGIN: publicOrigin.origin,
    VITE_CATALOGUE_ORIGIN: `${publicOrigin.origin}/catalogue/`,
    CATALOGUE_ORIGIN: `${publicOrigin.origin}/catalogue/`,
    ALLOWED_ORIGINS: [publicOrigin.origin, `https://${local.TWITCH_EXTENSION_ID}.ext-twitch.tv`].join(','),
  } : {}),
};
const sensitive = new Set(['CHANNEL3_API_KEY', 'TWITCH_EXTENSION_SECRET', 'TWITCH_WEBHOOK_SECRET']);
for (const [name, value] of Object.entries(values)) {
  if (!value) throw new Error(`${name} is missing`);
  const result = spawnSync('vercel', ['env', 'add', name, '--environment', target, '--force', sensitive.has(name) ? '--sensitive' : '--no-sensitive', '--yes'], {
    cwd: resolve(import.meta.dirname, '..'), input: `${value}\n`, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (result.status !== 0) throw new Error(`${name}: ${(result.stderr || result.stdout).trim()}`);
  console.log(`${name}: configured`);
}

import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'dist/vercel');
const deploymentOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
const environment = {
  ...process.env,
  ...(deploymentOrigin && !process.env.VITE_API_ORIGIN ? { VITE_API_ORIGIN: deploymentOrigin } : {}),
  ...(deploymentOrigin && !process.env.VITE_CATALOGUE_ORIGIN ? { VITE_CATALOGUE_ORIGIN: `${deploymentOrigin}/catalogue/` } : {}),
};

const build = spawnSync('npm', ['run', 'build', '--workspaces'], { cwd: root, env: environment, stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(resolve(root, 'apps/extension/dist'), resolve(output, 'extension'), { recursive: true });
cpSync(resolve(root, 'apps/catalogue/dist'), resolve(output, 'catalogue'), { recursive: true });

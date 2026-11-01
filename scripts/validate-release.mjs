import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const strict = process.argv.includes('--strict');
const failures = [];
const pending = [];
const pass = (name) => console.log(`PASS  ${name}`);
const fail = (name) => { failures.push(name); console.log(`FAIL  ${name}`); };
const wait = (name) => { pending.push(name); console.log(`WAIT  ${name}`); };
const run = (command, args) => spawnSync(command, args, { cwd: root, encoding: 'utf8', stdio: 'pipe' });
const auditEnvironment = { ...process.env };
delete auditEnvironment.npm_config_allow_scripts;

const checkEnvironment = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  TMPDIR: process.env.TMPDIR,
  CI: process.env.CI,
  NODE_ENV: 'test',
  DEMO_MODE: 'true',
  DOTENV_CONFIG_PATH: '/dev/null',
  CHANNEL3_API_KEY: '',
  CHANNEL3_COLLECTION_ID: '',
};
const check = spawnSync('npm', ['run', 'check'], { cwd: root, encoding: 'utf8', stdio: 'pipe', env: checkEnvironment });
check.status === 0
  ? pass('workspace build and automated tests')
  : fail(`workspace build and automated tests (${(check.stderr || check.stdout || check.error?.message || 'command failed').trim().split('\n').at(-1)})`);

const audit = spawnSync('npm', ['audit', '--omit=dev', '--audit-level=high'], { cwd: root, encoding: 'utf8', stdio: 'pipe', env: auditEnvironment });
audit.status === 0 ? pass('production dependency audit') : fail(`production dependency audit (${(audit.stderr || audit.stdout || 'command failed').trim().split('\n')[0]})`);

const candidates = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const forbiddenNames = candidates.filter((name) => name === '.env' || name.startsWith('.env.') && name !== '.env.example' || /(^|\/)data\//.test(name) || /\.(zip|pem|key|tar\.gz)$/i.test(name));
forbiddenNames.length === 0 ? pass('release file boundary excludes credentials, data, keys, and packages') : fail(`forbidden release files: ${forbiddenNames.join(', ')}`);

const secretAssignment = /(?:CHANNEL3_API_KEY|TWITCH_CLIENT_SECRET|TWITCH_EXTENSION_SECRET|TWITCH_WEBHOOK_SECRET)[ \t]*=[ \t]*[^\s'"`]+/;
const leaked = candidates.filter((name) => {
  const target = path.join(root, name);
  if (!fs.statSync(target).isFile() || fs.statSync(target).size > 1_000_000) return false;
  return secretAssignment.test(fs.readFileSync(target, 'utf8'));
});
leaked.length === 0 ? pass('no obvious credential assignments in release files') : fail(`possible credentials in: ${leaked.join(', ')}`);

const evidence = fs.readFileSync(path.join(root, 'docs/codex-sessions.md'), 'utf8');
evidence.includes('01a193cc-90fd-7643-9517-dfd3517e1d11') ? pass('Codex session evidence retained') : fail('Codex session evidence retained');

const requiredDocs = ['README.md', 'docs/demo-script.md', 'docs/security.md', 'docs/submission.md', 'docs/twitch-setup.md', 'docs/validation.md'];
requiredDocs.every((name) => fs.existsSync(path.join(root, name))) ? pass('submission and operations documentation') : fail('submission and operations documentation');

const requiredTwitch = ['TWITCH_EXTENSION_SECRET', 'TWITCH_WEBHOOK_SECRET', 'TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET', 'TWITCH_EXTENSION_ID', 'TWITCH_BROADCASTER_ID', 'TWITCH_EVENTSUB_CALLBACK'];
const twitchReady = requiredTwitch.every((name) => process.env[name]?.trim());
(twitchReady ? pass : wait)('Twitch credentials and callback configured');

const publicOrigin = (name) => {
  try { const url = new URL(process.env[name]); return url.protocol === 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname); } catch { return false; }
};
const originsReady = ['VITE_API_ORIGIN', 'VITE_CATALOGUE_ORIGIN'].every(publicOrigin);
(originsReady ? pass : wait)('public HTTPS extension origins configured');

const remote = run('git', ['remote', 'get-url', 'origin']);
(remote.status === 0 && remote.stdout.trim() ? pass : wait)('Git publication remote configured');

if (strict && pending.length) failures.push(...pending.map((name) => `pending: ${name}`));
console.log(JSON.stringify({ ok: failures.length === 0, strict, passed: 6 + Number(Boolean(twitchReady)) + Number(Boolean(originsReady)) + Number(Boolean(remote.status === 0 && remote.stdout.trim())), pending: pending.length, failed: failures.length }));
if (failures.length) process.exitCode = 1;

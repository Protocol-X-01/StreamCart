import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const twitchDir = resolve(root, 'assets/twitch');
const listing = JSON.parse(await readFile(resolve(twitchDir, 'listing.json'), 'utf8'));

const failures = [];
let checks = 0;
const pass = (condition, message) => {
  checks += 1;
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${message}`);
  if (!condition) failures.push(message);
};

const pngInfo = async (name) => {
  const path = resolve(twitchDir, name);
  const bytes = await readFile(path);
  const metadata = await stat(path);
  const signature = bytes.subarray(0, 8).toString('hex');
  pass(signature === '89504e470d0a1a0a', `${name} is a PNG`);
  if (signature !== '89504e470d0a1a0a' || bytes.length < 33) return null;
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const colorType = bytes[25];
  const hasTransparency = colorType === 4 || colorType === 6 || bytes.includes(Buffer.from('tRNS'));
  return { width, height, hasTransparency, size: metadata.size };
};

const assets = [
  ['logo-100x100.png', 100, 100, false, 10_000_000],
  ['taskbar-24x24.png', 24, 24, true, 10_000_000],
  ['discovery-300x200.png', 300, 200, false, 10_000_000],
  ['screenshot-1024x768.png', 1024, 768, false, 10_000_000]
];

for (const [name, width, height, transparencyAllowed, sizeLimit] of assets) {
  const info = await pngInfo(name);
  if (!info) continue;
  pass(info.width === width && info.height === height, `${name} is exactly ${width}x${height}`);
  pass(info.size < sizeLimit, `${name} is under 10 MB`);
  if (!transparencyAllowed) pass(!info.hasTransparency, `${name} is opaque`);
}

pass(typeof listing.name === 'string' && listing.name.trim().length > 0, 'listing name is present');
pass(listing.summary.length <= 140, `summary is at most 140 characters (${listing.summary.length})`);
pass(listing.viewerSummary.length <= 140, `viewer summary is at most 140 characters (${listing.viewerSummary.length})`);
pass(listing.description.length <= 1024, `description is at most 1024 characters (${listing.description.length})`);
pass(listing.generalCategory === 'Viewer Engagement', 'general category is Viewer Engagement');
pass(/!gear <topic>/.test(listing.description), 'description explains the broadcaster chat command');
pass(/does not build viewer profiles/i.test(listing.description), 'description states the privacy boundary');

console.log(JSON.stringify({ ok: failures.length === 0, checks, failures: failures.length }));
if (failures.length) process.exitCode = 1;

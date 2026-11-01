import crypto from 'node:crypto';
import fs from 'node:fs';
import { resolve } from 'node:path';

const file = resolve(import.meta.dirname, '../.env');
const source = fs.readFileSync(file, 'utf8');
const key = ['TWITCH', 'WEBHOOK', 'SECRET'].join('_');
const match = source.match(new RegExp(`^${key}=(.*)$`, 'm'));
if (!match) throw new Error('TWITCH_WEBHOOK_SECRET is missing from .env');
const existing = match[1].trim();
if (existing && existing.length < 32) throw new Error('Existing TWITCH_WEBHOOK_SECRET is too short');
const secret = existing || crypto.randomBytes(32).toString('hex');
if (!existing) fs.writeFileSync(file, source.replace(new RegExp(`^${key}=.*$`, 'm'), key + '=' + secret), { mode: 0o600 });
fs.chmodSync(file, 0o600);
console.log(JSON.stringify({ created: !existing, length: secret.length, mode: (fs.statSync(file).mode & 0o777).toString(8) }));

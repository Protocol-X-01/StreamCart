import 'dotenv/config';
import { z } from 'zod';

const list = (fallback: string) => z.string().default(fallback).transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean));
const optionalString = (minimum = 1) => z.preprocess((value) => typeof value === 'string' && value.trim() === '' ? undefined : value, z.string().min(minimum).optional());
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(8787),
  DEMO_MODE: z.string().default('false').transform((value) => value.toLowerCase() === 'true'),
  SAFE_SEARCH: z.string().default('true').transform((value) => value.toLowerCase() !== 'false'),
  DATA_FILE: z.string().default('./data/streamcart.json'),
  CHANNEL3_API_KEY: optionalString(),
  CHANNEL3_COLLECTION_ID: optionalString(),
  CHANNEL3_BASE_URL: z.string().url().default('https://api.trychannel3.com'),
  CHANNEL3_COUNTRY: z.string().default('US'),
  CHANNEL3_LANGUAGE: z.string().default('en'),
  CHANNEL3_CURRENCY: z.string().default('USD'),
  TWITCH_EXTENSION_SECRET: optionalString(16),
  TWITCH_WEBHOOK_SECRET: z.preprocess((value) => typeof value === 'string' && value.trim() === '' ? undefined : value, z.string().min(10).max(100).optional()),
  CATALOGUE_ORIGIN: z.string().url().default('http://localhost:5174'),
  ALLOWED_ORIGINS: list('http://localhost:5173,http://localhost:5174'),
  PRODUCT_URL_HOSTS: list('example.com'),
  IMAGE_URL_HOSTS: list('images.unsplash.com'),
});

const parsed = schema.parse(process.env);
const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
export const config = { ...parsed, ALLOWED_ORIGINS: [...new Set([...parsed.ALLOWED_ORIGINS, ...(vercelOrigin ? [vercelOrigin] : [])])] };
if (config.NODE_ENV === 'production') {
  const missing = [
    config.DEMO_MODE ? 'DEMO_MODE=false' : '',
    !config.CHANNEL3_API_KEY ? 'CHANNEL3_API_KEY' : '',
    !config.TWITCH_EXTENSION_SECRET ? 'TWITCH_EXTENSION_SECRET' : '',
    !config.TWITCH_WEBHOOK_SECRET ? 'TWITCH_WEBHOOK_SECRET' : '',
    config.ALLOWED_ORIGINS.length === 0 ? 'ALLOWED_ORIGINS' : '',
    config.PRODUCT_URL_HOSTS.length === 0 ? 'PRODUCT_URL_HOSTS' : '',
    config.IMAGE_URL_HOSTS.length === 0 ? 'IMAGE_URL_HOSTS' : '',
  ].filter(Boolean);
  if (missing.length) throw new Error(`Unsafe production configuration: ${missing.join(', ')}`);
}

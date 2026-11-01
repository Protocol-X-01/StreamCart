import type { ProductMetrics } from './store.js';
import type { Discovery, Product } from './types.js';

const publishCount = (value: number) => value < 5 ? 0 : Math.floor(value / 5) * 5;
export function rank(products: Product[], query: string, approvedIds: string[], metrics: Record<string, ProductMetrics> = {}): Discovery[] {
  const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
  return products.map((product): Discovery => {
    const searchable = [product.title, product.description, ...product.tags].join(' ').toLowerCase();
    const relevance = terms.filter((term) => searchable.includes(term)).length / Math.max(1, terms.length);
    const approved = approvedIds.includes(product.id);
    const exact = metrics[product.id] ?? { view: 0, save: 0 };
    const intentBoost = Math.min(1, (exact.view + exact.save * 3) / 25);
    const aggregateIntent = { view: publishCount(exact.view), save: publishCount(exact.save) };
    const score = .38 * relevance + .3 * (approved ? 1 : 0) + .14 * (product.available ? 1 : 0) + .13 * product.quality + .05 * intentBoost;
    return { ...product, provenance: approved ? 'creator_approved' : 'ai_discovered', score, reason: approved ? 'Creator approved' : terms.length ? `Related to “${query}”` : 'From the curated collection', aggregateIntent };
  }).sort((left, right) => right.score - left.score);
}

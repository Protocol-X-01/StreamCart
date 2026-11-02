import test from 'node:test';
import assert from 'node:assert/strict';
import { rank } from '../src/discovery.js';
import { formatSaveCount } from '../../catalogue/src/save-label.js';

const product = {
  id: 'product', title: 'Microphone', description: '', imageUrl: 'https://example.com/image',
  productUrl: 'https://example.com/product', price: 100, currency: 'USD', available: true,
  tags: ['microphone'], quality: 1,
};

test('catalogue labels match the public privacy buckets', () => {
  for (const [count, expected] of [[0, 'Save count hidden for privacy'], [1, 'Save count hidden for privacy'], [4, 'Save count hidden for privacy'], [5, '5+ save actions'], [9, '5+ save actions'], [10, '10+ save actions'], [14, '10+ save actions']] as const) {
    const [item] = rank([product], 'microphone', [], { product: { view: 0, save: count } });
    assert.equal(formatSaveCount(item.aggregateIntent.save), expected);
  }
});

test('catalogue hides missing and invalid counts and rounds unexpected values down', () => {
  for (const value of [undefined, null, -1, 1, 4, NaN, Infinity, '5']) {
    assert.equal(formatSaveCount(value), 'Save count hidden for privacy');
  }
  assert.equal(formatSaveCount(9), '5+ save actions');
});

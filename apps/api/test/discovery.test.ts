import test from'node:test';import assert from'node:assert/strict';import{rank}from'../src/discovery.js';test('approved provenance and cohort-safe aggregate intent',()=>{const p={id:'x',title:'Keyboard',description:'',imageUrl:'https://example.com/x',productUrl:'https://example.com/x',price:1,currency:'USD',available:true,tags:['keyboard'],quality:1};const hidden=rank([p],'keyboard',['x'],{x:{view:2,save:3}})[0];assert.equal(hidden.provenance,'creator_approved');assert.deepEqual(hidden.aggregateIntent,{view:0,save:0});const visible=rank([p],'keyboard',['x'],{x:{view:7,save:11}})[0];assert.deepEqual(visible.aggregateIntent,{view:5,save:10})});
test('ranking uses only published intent buckets', () => {
  const a = { id: 'a', title: 'Keyboard', description: '', imageUrl: 'https://example.com/x', productUrl: 'https://example.com/x', price: 1, currency: 'USD', available: true, tags: ['keyboard'], quality: 1 };
  const b = { ...a, id: 'b' };
  const products = [a, b];
  const baseline = rank(products, 'keyboard', []);
  for (let view = 0; view < 5; view += 1) {
    for (let save = 0; save < 5; save += 1) {
      const ranked = rank(products, 'keyboard', [], { b: { view, save } });
      assert.deepEqual(ranked.map((item) => item.id), baseline.map((item) => item.id));
      assert.deepEqual(ranked.find((item) => item.id === 'b')?.aggregateIntent, { view: 0, save: 0 });
      assert.ok(ranked.every((item) => !('score' in item)));
    }
  }
  for (const [threshold, sameBucket, expectedAggregate] of [
    [rank(products, 'keyboard', [], { b: { view: 5, save: 0 } }), rank(products, 'keyboard', [], { b: { view: 9, save: 0 } }), { view: 5, save: 0 }],
    [rank(products, 'keyboard', [], { b: { view: 0, save: 5 } }), rank(products, 'keyboard', [], { b: { view: 0, save: 9 } }), { view: 0, save: 5 }],
  ]) {
    assert.deepEqual(threshold.map((item) => item.id), ['b', 'a']);
    assert.deepEqual(sameBucket.map((item) => item.id), threshold.map((item) => item.id));
    assert.deepEqual(threshold[0].aggregateIntent, expectedAggregate);
  }
});

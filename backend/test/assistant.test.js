import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAssistantResponse, parseBudget, rankProducts } from '../src/services/assistant.js';

const products = [
  { id: 1, name: 'Keyboard', category: 'Accessories', description: 'Mechanical keyboard', price: 1800, stock: 2 },
  { id: 2, name: 'Mouse', category: 'Accessories', description: 'Wireless mouse', price: 600, stock: 3 }
];

test('parseBudget extracts a peso budget', () => assert.equal(parseBudget('below ₱2,000'), 2000));
test('rankProducts respects the budget', () => assert.deepEqual(rankProducts(products, 'mouse below 700').map((p) => p.id), [2]));
test('assistant response contains traceable sources', () => assert.equal(buildAssistantResponse(products, 'keyboard').sources[0].id, 1));
test('out-of-stock products are not recommended', () => {
  const testProducts = [
    {
      id: 101,
      name: 'Gaming Keyboard',
      category: 'Accessories',
      description: 'RGB gaming keyboard',
      price: 1500,
      stock: 0,
      active: true
    },
    {
      id: 102,
      name: 'Mechanical Keyboard',
      category: 'Accessories',
      description: 'Mechanical keyboard',
      price: 1800,
      stock: 5,
      active: true
    }
  ];

  const question = 'Which keyboard is below ₱2,000?';
  const ranked = rankProducts(testProducts, question);

  assert.deepEqual(
    ranked.map((product) => product.id),
    [102]
  );

  const response = buildAssistantResponse(testProducts, question);

  assert.deepEqual(
    response.recommendedProducts.map((product) => product.id),
    [102]
  );

  assert.deepEqual(
    response.sources.map((source) => source.id),
    [102]
  );
});
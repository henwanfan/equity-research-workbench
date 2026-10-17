import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RequestBudget, ProviderError } from '../server/massive.ts';

test('refresh budget rejects an entire pair immediately without consuming its remaining slot', () => {
  const budget = new RequestBudget();
  budget.reserve(2, 1000);
  budget.reserve(2, 1000);
  assert.throws(
    () => budget.reserve(2, 1000),
    (error: unknown) =>
      error instanceof ProviderError && error.status === 429 && /60 seconds/.test(error.message),
  );
  assert.doesNotThrow(() => budget.reserve(1, 1000));
  assert.throws(() => budget.reserve(1, 60_999), /1 seconds/);
  assert.doesNotThrow(() => budget.reserve(2, 61_000));
});

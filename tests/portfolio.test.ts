import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePortfolio,
  serializePortfolio,
  togglePortfolioTicker,
} from '../src/domain/portfolio.ts';

test('portfolio round-trips ordered tickers with a versioned storage format', () => {
  const tickers = ['BRK.B', 'AAPL', 'NVDA'];
  assert.deepEqual(parsePortfolio(serializePortfolio(tickers)), tickers);
  assert.deepEqual(parsePortfolio(null), []);
  assert.deepEqual(parsePortfolio('{"version":1,"tickers":["AAPL","AAPL","MSFT"]}'), [
    'AAPL',
    'MSFT',
  ]);
});

test('corrupt, incompatible and invalid storage never becomes portfolio state', () => {
  for (const raw of [
    'invalid',
    'null',
    '[]',
    '{"version":2,"tickers":[]}',
    '{"version":1,"tickers":"AAPL"}',
    '{"version":1,"tickers":[null]}',
    '{"version":1,"tickers":["../file"]}',
  ])
    assert.throws(() => parsePortfolio(raw));
});

test('adding and removing preserve other companies and never introduce duplicates', () => {
  let tickers = togglePortfolioTicker([], 'AAPL');
  tickers = togglePortfolioTicker(tickers, 'MSFT');
  assert.deepEqual(tickers, ['MSFT', 'AAPL']);
  tickers = togglePortfolioTicker(tickers, 'AAPL');
  assert.deepEqual(tickers, ['MSFT']);
  tickers = togglePortfolioTicker(tickers, 'AAPL');
  assert.deepEqual(tickers, ['AAPL', 'MSFT']);
  assert.deepEqual(togglePortfolioTicker(tickers, 'INVALID/TICKER'), tickers);
});

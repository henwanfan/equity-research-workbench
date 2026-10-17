import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { handleApiRequest } from '../server/api.ts';

const server = createServer((req, res) => void handleApiRequest(req, res, ''));
let origin = '';

before(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

test('saved catalogue works without a key and does not return full company histories', async () => {
  const response = await fetch(`${origin}/api/equities`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(data.equities.length >= 1000);
  assert.ok(data.equities.some((company: { ticker: string }) => company.ticker === 'AAPL'));
  assert.equal('bars' in data.equities[0], false);
});

test('saved company response includes provenance and ordered prices', async () => {
  const response = await fetch(`${origin}/api/equities/AAPL`);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.source, 'snapshot');
  assert.equal(data.company.ticker, 'AAPL');
  assert.ok(data.company.bars.length > 2);
  assert.ok(data.company.bars[0].date < data.company.bars.at(-1).date);
});

test('refresh without credentials returns a useful error without discarding saved data', async () => {
  const response = await fetch(`${origin}/api/equities/AAPL?refresh=true`);
  assert.equal(response.status, 503);
  const data = await response.json();
  assert.match(data.error, /server environment/);
  const saved = await fetch(`${origin}/api/equities/AAPL`);
  assert.equal(saved.status, 200);
});

test('unknown companies and unsupported HTTP methods are rejected', async () => {
  assert.equal((await fetch(`${origin}/api/equities/UNKNOWN`)).status, 404);
  assert.equal((await fetch(`${origin}/api/equities`, { method: 'POST' })).status, 405);
  assert.equal((await fetch(`${origin}/api/equities?refresh=true`)).status, 503);
});

test('unseeded companies retain real prices offline without inventing full history', async () => {
  const response = await fetch(`${origin}/api/equities/TSLA`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.company.ticker, 'TSLA');
  assert.equal(data.historyLoaded, false);
  assert.ok(data.company.bars.length >= 1 && data.company.bars.length <= 2);
  assert.ok(data.company.bars.at(-1).close > 0);
});

test('logos without a researched provider source cannot proxy arbitrary URLs', async () => {
  const response = await fetch(`${origin}/api/company-logos/UNKNOWN`);
  assert.equal(response.status, 404);
});

test('a configured key never makes initial company selection wait for the provider', async () => {
  const keyedServer = createServer((req, res) => void handleApiRequest(req, res, 'test-key'));
  await new Promise<void>((resolve) => keyedServer.listen(0, '127.0.0.1', resolve));
  const keyedOrigin = `http://127.0.0.1:${(keyedServer.address() as AddressInfo).port}`;
  const originalFetch = globalThis.fetch;
  let upstreamCalls = 0;
  globalThis.fetch = ((input, init) => {
    if (String(input).startsWith('https://api.massive.com')) {
      upstreamCalls++;
      throw new Error('Initial selection must not contact upstream');
    }
    return originalFetch(input, init);
  }) as typeof fetch;
  try {
    const response = await fetch(`${keyedOrigin}/api/equities/TSLA`);
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.company.ticker, 'TSLA');
    assert.equal(data.canRefresh, true);
    assert.equal(data.historyLoaded, false);
    assert.ok(data.company.bars.at(-1).close > 0);
    assert.equal(upstreamCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    keyedServer.closeAllConnections();
    await new Promise<void>((resolve) => keyedServer.close(() => resolve()));
  }
});

test('refreshes share work, manual refresh bypasses cache, and quota errors retain cached data', async () => {
  const keyedServer = createServer((req, res) => void handleApiRequest(req, res, 'test-key'));
  await new Promise<void>((resolve) => keyedServer.listen(0, '127.0.0.1', resolve));
  const keyedOrigin = `http://127.0.0.1:${(keyedServer.address() as AddressInfo).port}`;
  const originalFetch = globalThis.fetch;
  let upstreamCalls = 0;
  let release: () => void = () => {};
  const pairStarted = new Promise<void>((resolve) => {
    release = resolve;
  });
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    if (!url.startsWith('https://api.massive.com')) return originalFetch(input, init);
    upstreamCalls++;
    if (upstreamCalls === 2) release();
    await pairStarted;
    return Response.json({
      results: url.includes('/reference/')
        ? { name: 'Tesla', market_cap: 123 }
        : [
            { t: Date.parse('2026-10-15T04:00:00Z'), o: 100, h: 105, l: 95, c: 100, v: 300 },
            { t: Date.parse('2026-10-16T04:00:00Z'), o: 100, h: 120, l: 90, c: 110, v: 500 },
          ],
    });
  }) as typeof fetch;
  try {
    const before = await (await fetch(`${keyedOrigin}/api/equities`)).json();
    const untouched = before.equities.find((item: { ticker: string }) => item.ticker === 'AAPL');
    const first = await fetch(`${keyedOrigin}/api/equities/TSLA?refresh=true`, {
      signal: AbortSignal.timeout(2000),
    });
    assert.equal(first.status, 200);
    assert.equal(upstreamCalls, 2);
    assert.equal((await first.json()).company.marketCap, 123);
    const refreshedCatalogue = await (await fetch(`${keyedOrigin}/api/equities`)).json();
    const refreshedSummary = refreshedCatalogue.equities.find(
      (item: { ticker: string }) => item.ticker === 'TSLA',
    );
    assert.equal(refreshedSummary.close, 110);
    assert.equal(refreshedSummary.changePercent, 10);
    assert.equal(refreshedSummary.volume, 500);
    assert.equal(refreshedSummary.date, '2026-10-16');
    assert.deepEqual(
      refreshedCatalogue.equities.find((item: { ticker: string }) => item.ticker === 'AAPL'),
      untouched,
    );
    assert.equal(upstreamCalls, 2, 'reading refreshed catalogue must not request upstream data');
    await fetch(`${keyedOrigin}/api/equities/TSLA?refresh=true`);
    assert.equal(upstreamCalls, 2);
    await fetch(`${keyedOrigin}/api/equities/TSLA?refresh=true&force=true`);
    assert.equal(upstreamCalls, 4);
    const limited = await fetch(`${keyedOrigin}/api/equities/TSLA?refresh=true&force=true`);
    assert.equal(limited.status, 429);
    assert.match((await limited.json()).error, /Try again in/);
    const saved = await (await fetch(`${keyedOrigin}/api/equities/TSLA`)).json();
    assert.equal(saved.source, 'api');
    assert.equal(saved.company.bars.at(-1).close, 110);
    const retainedCatalogue = await (await fetch(`${keyedOrigin}/api/equities`)).json();
    assert.deepEqual(
      retainedCatalogue.equities.find((item: { ticker: string }) => item.ticker === 'TSLA'),
      refreshedSummary,
    );
  } finally {
    globalThis.fetch = originalFetch;
    keyedServer.closeAllConnections();
    await new Promise<void>((resolve) => keyedServer.close(() => resolve()));
  }
});

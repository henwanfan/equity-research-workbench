import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { handleApiRequest } from '../server/api.ts';

test('bulk API updates catalogue and company prices, retains missing tickers, and reuses prices on reload', async () => {
  const server = createServer((req, res) => void handleApiRequest(req, res, 'test-key'));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    if (!url.startsWith('https://api.massive.com')) return originalFetch(input, init);
    calls++;
    assert.ok(url.includes('/aggs/grouped/'), 'must not fetch individual companies');
    const date = url.split('?')[0]!.split('/').at(-1)!;
    const day = new Date(`${date}T12:00:00Z`).getUTCDay();
    const close = 100 + day;
    return Response.json({
      adjusted: true,
      results: [
        {
          T: 'AAPL',
          t: Date.parse(`${date}T12:00:00Z`),
          o: close,
          h: close + 1,
          l: close - 1,
          c: close,
          v: 500,
        },
      ],
    });
  }) as typeof fetch;
  try {
    const before = await (await fetch(`${origin}/api/equities`)).json();
    const untouched = before.equities.find((item: { ticker: string }) => item.ticker === 'MSFT');
    const response = await fetch(`${origin}/api/equities?refresh=true`);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(calls, 2);
    assert.equal(result.updated, 1);
    assert.equal(result.catalogue.closingPricesRefreshedAt, result.catalogue.capturedAt);
    const summary = result.catalogue.equities.find(
      (item: { ticker: string }) => item.ticker === 'AAPL',
    );
    assert.equal(summary.date, result.catalogue.date);
    assert.equal(summary.volume, 500);
    assert.deepEqual(
      result.catalogue.equities.find((item: { ticker: string }) => item.ticker === 'MSFT'),
      untouched,
    );
    const reloaded = await (await fetch(`${origin}/api/equities`)).json();
    assert.deepEqual(
      reloaded.equities.find((item: { ticker: string }) => item.ticker === 'AAPL'),
      summary,
    );
    assert.equal(reloaded.closingPricesRefreshedAt, result.catalogue.closingPricesRefreshedAt);
    const detail = await (await fetch(`${origin}/api/equities/AAPL`)).json();
    assert.equal(detail.company.bars.at(-1).close, summary.close);
    assert.equal(calls, 2);
    await fetch(`${origin}/api/equities?refresh=true`);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

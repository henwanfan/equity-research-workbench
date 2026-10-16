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

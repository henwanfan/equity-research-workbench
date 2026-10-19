import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MarketPriceService, candidateSessions, parseGroupedDay } from '../server/market-prices.ts';
import { mergeClosingPrices } from '../src/domain/equity.ts';
import type { EquityResponse } from '../src/domain/equity.ts';

const row = (date: string, close = 110, ticker = 'AAPL') => ({
  T: ticker,
  t: Date.parse(`${date}T04:00:00Z`),
  o: close,
  h: close + 5,
  l: close - 5,
  c: close,
  v: 100,
});
const dateFrom = (path: string) => path.split('?')[0]!.split('/').at(-1)!;

test('entry refresh requests today only after the shared daily cutoff', async () => {
  let clock = new Date('2026-10-20T00:14:59Z');
  const requested: string[] = [];
  const service = new MarketPriceService(
    async (paths) => {
      requested.push(...paths.map(dateFrom));
      return paths.map((path) => ({ results: [row(dateFrom(path))] }));
    },
    () => clock,
  );
  assert.equal(await service.ensureFresh('test', '2026-10-16'), null);
  assert.deepEqual(requested, []);
  clock = new Date('2026-10-20T00:15:00Z');
  const result = await service.ensureFresh('test', '2026-10-16');
  assert.deepEqual(requested, ['2026-10-19', '2026-10-16']);
  assert.equal(result?.date, '2026-10-19');
});

test('bulk close refresh uses two requests, shares pending work, and reuses success for a minute', async () => {
  let count = 0;
  const service = new MarketPriceService(
    async (paths) => {
      count += paths.length;
      return paths.map((path) => ({
        results: [row(dateFrom(path), dateFrom(path) === '2026-10-16' ? 110 : 100)],
      }));
    },
    () => new Date('2026-10-17T12:00:00Z'),
  );
  const [first, second] = await Promise.all([service.refresh('test'), service.refresh('test')]);
  assert.equal(first, second);
  assert.equal(count, 2);
  assert.deepEqual(
    first.prices.AAPL?.map((bar) => bar.date),
    ['2026-10-15', '2026-10-16'],
  );
  assert.equal(first.date, '2026-10-16');
  await service.refresh('test');
  assert.equal(count, 2);
});

test('bulk refresh skips weekends and bounds holiday fallback to one extra pair', async () => {
  assert.deepEqual(candidateSessions('2026-10-18'), [
    '2026-10-16',
    '2026-10-15',
    '2026-10-14',
    '2026-10-13',
  ]);
  let count = 0;
  const service = new MarketPriceService(
    async (paths) => {
      count += paths.length;
      return paths.map((path) => ({
        results: dateFrom(path) === '2026-10-16' ? [] : [row(dateFrom(path))],
      }));
    },
    () => new Date('2026-10-17T12:00:00Z'),
  );
  const result = await service.refresh('test');
  assert.equal(count, 4);
  assert.equal(result.date, '2026-10-15');
  assert.deepEqual(
    result.prices.AAPL?.map((bar) => bar.date),
    ['2026-10-14', '2026-10-15'],
  );
  let emptyCalls = 0;
  const empty = new MarketPriceService(async (paths) => {
    emptyCalls += paths.length;
    return paths.map(() => ({ results: [] }));
  });
  await assert.rejects(empty.refresh('test'), /Two completed/);
  assert.equal(emptyCalls, 4);
  assert.equal(empty.read(), null);
});

test('malformed, wrong-date and unadjusted bulk data cannot overwrite a successful refresh', async () => {
  assert.throws(
    () => parseGroupedDay({ adjusted: false, results: [] }, '2026-10-16'),
    /Unadjusted/,
  );
  assert.throws(() => parseGroupedDay({ results: [row('2026-10-15')] }, '2026-10-16'), /session/);
  assert.throws(
    () => parseGroupedDay({ results: [row('2026-10-16', -10)] }, '2026-10-16'),
    /session/,
  );
  let clock = new Date('2026-10-17T12:00:00Z');
  let fail = false;
  const service = new MarketPriceService(
    async (paths) => {
      if (fail) throw new Error('Provider unavailable');
      return paths.map((path) => ({ results: [row(dateFrom(path))] }));
    },
    () => clock,
  );
  const saved = await service.refresh('test');
  clock = new Date('2026-10-17T12:01:01Z');
  fail = true;
  await assert.rejects(service.refresh('test'), /Provider unavailable/);
  assert.equal(service.read(), saved);
  await assert.rejects(service.refresh(''), /server environment/);
});

test('bulk bars preserve profiles and newer quotes, and flag missing history instead of inventing it', () => {
  const prices = [
    ...parseGroupedDay({ results: [row('2026-10-15', 100)] }, '2026-10-15').values(),
    ...parseGroupedDay({ results: [row('2026-10-16', 110)] }, '2026-10-16').values(),
  ];
  const response: EquityResponse = {
    company: {
      ticker: 'AAPL',
      name: 'Apple',
      sector: 'Technology',
      exchange: 'XNAS',
      description: 'Existing overview',
      marketCap: 123,
      employees: 100,
      website: null,
      industry: null,
      currency: 'USD',
      bars: [prices[0]!],
    },
    source: 'snapshot',
    capturedAt: '2026-10-15T12:00:00Z',
    historyLoaded: true,
  };
  const merged = mergeClosingPrices(response, prices, '2026-10-17T12:00:00Z');
  assert.equal(merged.company.description, 'Existing overview');
  assert.equal(merged.company.bars.at(-1)?.close, 110);
  assert.equal(merged.historyNeedsRefresh, false);
  const newer = { ...merged, capturedAt: '2026-10-17T13:00:00Z' };
  assert.equal(mergeClosingPrices(newer, prices, '2026-10-17T12:00:00Z'), newer);
  const stale = {
    ...response,
    company: { ...response.company, bars: [{ ...prices[0]!, date: '2026-10-01' }] },
  };
  assert.equal(mergeClosingPrices(stale, prices, '2026-10-17T12:00:00Z').historyNeedsRefresh, true);
});

test('entry checks update old snapshots once, share work, and skip current sessions across visits', async () => {
  let clock = new Date('2026-10-17T12:00:00Z');
  let calls = 0;
  const service = new MarketPriceService(
    async (paths) => {
      calls += paths.length;
      return paths.map((path) => ({ results: [row(dateFrom(path))] }));
    },
    () => clock,
  );
  const [first, second] = await Promise.all([
    service.ensureFresh('test', '2026-10-15'),
    service.ensureFresh('test', '2026-10-15'),
  ]);
  assert.equal(first, second);
  assert.equal(first?.date, '2026-10-16');
  assert.equal(calls, 2);
  clock = new Date('2026-10-18T14:00:00Z');
  await service.ensureFresh('test', '2026-10-15');
  assert.equal(calls, 2, 'weekend visits must not spend more upstream requests');
  const alreadyCurrent = new MarketPriceService(
    async () => {
      throw new Error('Must not fetch');
    },
    () => clock,
  );
  assert.equal(await alreadyCurrent.ensureFresh('test', '2026-10-16'), null);
});

test('failed automatic checks retain data and are throttled across visitors, with manual retry independent', async () => {
  let clock = new Date('2026-10-17T12:00:00Z');
  let calls = 0;
  const service = new MarketPriceService(
    async () => {
      calls++;
      throw new Error('Provider unavailable');
    },
    () => clock,
  );
  await assert.rejects(service.ensureFresh('test', '2026-10-15'), /Provider unavailable/);
  await assert.rejects(service.ensureFresh('test', '2026-10-15'), /Provider unavailable/);
  assert.equal(calls, 1);
  await assert.rejects(service.refresh('test'), /Provider unavailable/);
  assert.equal(calls, 2);
  clock = new Date('2026-10-17T12:05:01Z');
  await assert.rejects(service.ensureFresh('test', '2026-10-15'), /Provider unavailable/);
  assert.equal(calls, 3);
});

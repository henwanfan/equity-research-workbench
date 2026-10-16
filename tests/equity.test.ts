import { test } from 'node:test';
import assert from 'node:assert/strict';
import { barsForRange, calculateResearchMetrics, summarize } from '../src/domain/equity.ts';
import type { Company, DailyBar } from '../src/domain/equity.ts';
import { historyEndDate, parseBars, parseCompany } from '../server/massive.ts';

const bar = (date: string, close: number): DailyBar => ({
  date,
  close,
  open: close,
  high: close,
  low: close,
  volume: 100,
});
const company: Company = {
  ticker: 'TEST',
  name: 'Test Company',
  sector: 'Technology',
  currency: 'USD',
  exchange: null,
  description: null,
  marketCap: null,
  employees: null,
  website: null,
  industry: null,
  bars: [],
};

test('history excludes the current New York session even across UTC midnight', () => {
  assert.equal(historyEndDate(new Date('2026-10-17T01:00:00Z')), '2026-10-15');
  assert.equal(historyEndDate(new Date('2026-10-17T14:00:00Z')), '2026-10-16');
});

test('daily change compares consecutive trading closes, including weekends', () => {
  const result = summarize({
    ...company,
    bars: [bar('2026-10-09', 100), { ...bar('2026-10-12', 110), open: 108 }],
  });
  assert.equal(result.changePercent, 10);
  assert.equal(result.date, '2026-10-12');
});

test('a missing prior session or zero prior close does not manufacture a return', () => {
  assert.equal(summarize(company).close, null);
  assert.equal(summarize({ ...company, bars: [bar('2026-10-12', 110)] }).changePercent, null);
  assert.equal(
    summarize({ ...company, bars: [bar('2026-10-09', 0), bar('2026-10-12', 110)] }).changePercent,
    null,
  );
});

test('chart range is relative to available data rather than the computer date', () => {
  const bars = [bar('2026-08-01', 100), bar('2026-09-15', 110), bar('2026-10-15', 120)];
  assert.deepEqual(
    barsForRange(bars, 30).map((item) => item.date),
    ['2026-09-15', '2026-10-15'],
  );
  assert.deepEqual(barsForRange([], 30), []);
});

test('provider bars are validated, ordered, and dated in New York time', () => {
  const valid = { t: Date.parse('2026-10-15T04:00:00Z'), o: 100, h: 115, l: 99, c: 110, v: 500 };
  const earlier = { ...valid, t: Date.parse('2026-10-14T04:00:00Z') };
  const parsed = parseBars([valid, { ...valid, c: null }, earlier, null]);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0]?.date, '2026-10-14');
  assert.equal(parsed[1]?.close, 110);
  assert.deepEqual(parseBars(undefined), []);
});

test('missing company metrics remain unavailable instead of becoming zero', () => {
  const result = parseCompany({ name: 'Updated Company', market_cap: 'not a number' }, [], company);
  assert.equal(result.marketCap, null);
  assert.equal(result.employees, null);
  assert.equal(result.name, 'Updated Company');
  assert.equal(result.ticker, 'TEST');
});

test('range and volume context use available history and handle no activity', () => {
  const bars = [
    bar('2026-10-14', 100),
    { ...bar('2026-10-15', 110), high: 115, low: 98, volume: 300 },
  ];
  const result = calculateResearchMetrics(bars);
  assert.equal(result.periodHigh, 115);
  assert.equal(result.periodLow, 98);
  assert.equal(result.averageVolume, 200);
  assert.equal(result.volumeMultiple, 1.5);
  assert.equal(result.volumeSessions, 2);
  assert.equal(calculateResearchMetrics([]).periodHigh, null);
  assert.equal(calculateResearchMetrics([{ ...bars[0]!, volume: 0 }]).volumeMultiple, null);
});

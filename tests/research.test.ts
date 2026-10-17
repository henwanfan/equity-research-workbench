import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { handleApiRequest } from '../server/api.ts';
import { parseNews, parseFilings } from '../server/research.ts';

const article = (id: string, ticker = 'AAPL', published = '2026-10-15T12:00:00Z') => ({
  id,
  title: `Company update ${id}`,
  article_url: `https://example.com/${id}`,
  publisher: { name: 'Example publisher' },
  published_utc: published,
  tickers: [ticker],
});
const filing = (form: string, date = '2026-10-15', ticker = 'AAPL') => ({
  accession_number: `${form}-${date}`,
  ticker,
  form_type: form,
  filing_date: date,
  filing_url: `https://www.sec.gov/Archives/edgar/data/123/${form}.txt`,
});

test('news keeps matching, dated, safely linked articles, deduplicated and newest first', () => {
  const rows = [
    article('old'),
    article('new', 'AAPL', '2026-10-16T12:00:00Z'),
    article('new'),
    article('other', 'MSFT'),
    { ...article('unsafe'), article_url: 'javascript:alert(1)' },
    { ...article('undated'), published_utc: 'invalid' },
  ];
  assert.deepEqual(
    parseNews(rows, 'AAPL').map((x) => x.id),
    ['new', 'old'],
  );
  assert.equal(parseNews([], 'AAPL').length, 0);
  assert.throws(() => parseNews([article('other', 'MSFT')], 'AAPL'), /another company/);
  assert.throws(() => parseNews(undefined, 'AAPL'), /unreadable/);
});

test('headlines naming the company take priority over incidental ticker mentions', () => {
  const incidental = {
    ...article('incidental', 'AMZN', '2026-10-16T12:00:00Z'),
    title: 'A bank reports earnings',
  };
  const direct = {
    ...article('direct', 'AMZN', '2026-10-15T12:00:00Z'),
    title: 'Amazon expands its cloud business',
  };
  assert.deepEqual(
    parseNews([incidental, direct], 'AMZN', 'Amazon.Com Inc').map((x) => x.id),
    ['direct', 'incidental'],
  );
});

test('filings show the latest report of each supported kind and only link to SEC originals', () => {
  const rows = [
    filing('10-K', '2025-10-31'),
    filing('10-Q', '2026-07-31'),
    filing('8-K', '2026-09-01'),
    filing('8-K', '2026-10-01'),
    filing('4'),
    filing('10-K', '2026-10-01', 'MSFT'),
    { ...filing('10-Q', '2026-10-10'), filing_url: 'https://sec.gov.example.com/Archives/fake' },
  ];
  assert.deepEqual(
    parseFilings(rows, 'AAPL').map((x) => [x.form, x.filedAt]),
    [
      ['8-K', '2026-10-01'],
      ['10-Q', '2026-07-31'],
      ['10-K', '2025-10-31'],
    ],
  );
  assert.throws(
    () => parseFilings([filing('10-K', '2026-10-01', 'MSFT')], 'AAPL'),
    /another company/,
  );
});

let apiKey = '';
const server = createServer((req, res) => void handleApiRequest(req, res, apiKey));
let origin = '';
before(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test('saved research works offline, with separate provenance for news and filings', async () => {
  for (const kind of ['news', 'filings']) {
    const response = await fetch(`${origin}/api/equities/AAPL/${kind}`);
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.ticker, 'AAPL');
    assert.equal(data.source, 'snapshot');
    assert.equal(data.canRefresh, false);
    assert.ok(data.items.length >= 3 && data.items.length <= 50);
    assert.ok(Date.parse(data.capturedAt));
  }
});

test('unloaded research differs from a successful empty response; reads never use the provider', async () => {
  const originalFetch = globalThis.fetch;
  apiKey = 'test-key';
  globalThis.fetch = ((input, init) => {
    if (String(input).startsWith('https://api.massive.com'))
      throw new Error('Must not fetch upstream');
    return originalFetch(input, init);
  }) as typeof fetch;
  try {
    const data = await (await fetch(`${origin}/api/equities/AMD/news`)).json();
    assert.equal(data.items, null);
    assert.equal(data.source, null);
    assert.equal(data.canRefresh, true);
  } finally {
    globalThis.fetch = originalFetch;
    apiKey = '';
  }
});

test('offline refresh and unknown ticker errors leave saved research intact', async () => {
  assert.equal((await fetch(`${origin}/api/equities/AAPL/news?refresh=true`)).status, 503);
  assert.equal((await fetch(`${origin}/api/equities/UNKNOWN/news`)).status, 404);
  const data = await (await fetch(`${origin}/api/equities/AAPL/news`)).json();
  assert.ok(data.items.length >= 3 && data.items.length <= 50);
});

test('live refresh validates content, retains previous results on failure, and caches an empty result', async () => {
  const originalFetch = globalThis.fetch;
  apiKey = 'test-key';
  let limited = false;
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    if (!url.startsWith('https://api.massive.com')) return originalFetch(input, init);
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer test-key');
    if (limited) return Response.json({ error: 'limited' }, { status: 429 });
    return Response.json({ results: url.includes('ticker=AMD') ? [] : [article('verified')] });
  }) as typeof fetch;
  try {
    const refreshed = await (await fetch(`${origin}/api/equities/AAPL/news?refresh=true`)).json();
    assert.equal(refreshed.source, 'api');
    assert.equal(refreshed.items[0].id, 'verified');
    limited = true;
    assert.equal((await fetch(`${origin}/api/equities/AAPL/news?refresh=true`)).status, 429);
    const retained = await (await fetch(`${origin}/api/equities/AAPL/news`)).json();
    assert.equal(retained.items[0].id, 'verified');
    limited = false;
    const empty = await (await fetch(`${origin}/api/equities/AMD/news?refresh=true`)).json();
    assert.deepEqual(empty.items, []);
    const cached = await (await fetch(`${origin}/api/equities/AMD/news`)).json();
    assert.deepEqual(cached.items, []);
    assert.equal(cached.source, 'api');
  } finally {
    globalThis.fetch = originalFetch;
    apiKey = '';
  }
});

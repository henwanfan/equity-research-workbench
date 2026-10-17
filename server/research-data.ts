import { readFileSync } from 'node:fs';
import type { ResearchKind, ResearchResponse, ResearchItems } from '../src/domain/research.ts';
import { massiveRequests, ProviderError } from './massive.ts';
import { parseNews, parseFilings } from './research.ts';

type StoredResearch = { [K in ResearchKind]: { items: ResearchItems[K]; capturedAt: string } };
const snapshot = JSON.parse(
  readFileSync(new URL('../data/research-snapshot.json', import.meta.url), 'utf8'),
) as { companies: Record<string, StoredResearch> };
const cache = new Map<string, ResearchResponse<ResearchKind>>();
const pending = new Map<string, Promise<ResearchResponse<ResearchKind>>>();

export async function getCompanyResearch(
  ticker: string,
  kind: ResearchKind,
  refresh: boolean,
  apiKey: string,
  companyName = ticker,
): Promise<ResearchResponse<ResearchKind>> {
  const key = `${ticker}:${kind}`;
  const cached = cache.get(key);
  const saved = snapshot.companies[ticker]?.[kind];
  if (!refresh)
    return {
      ticker,
      items: cached?.items ?? saved?.items ?? null,
      capturedAt: cached?.capturedAt ?? saved?.capturedAt ?? null,
      source: cached ? 'api' : saved ? 'snapshot' : null,
      canRefresh: Boolean(apiKey),
    };
  if (!apiKey)
    throw new ProviderError('Live research is unavailable. Saved research remains available.', 503);
  const existing = pending.get(key);
  if (existing) return existing;
  if (pending.size >= 2)
    throw new ProviderError(
      'Two research requests are already loading. Please try again when they finish.',
      429,
    );
  const request = (async () => {
    const path =
      kind === 'news'
        ? `/v2/reference/news?ticker=${encodeURIComponent(ticker)}&order=desc&sort=published_utc&limit=50`
        : `/stocks/filings/vX/index?ticker=${encodeURIComponent(ticker)}&sort=filing_date.desc&limit=250`;
    const [payload] = await massiveRequests([path], apiKey);
    const rows = payload!.results ?? (payload!.count === 0 ? [] : undefined);
    const response: ResearchResponse<ResearchKind> = {
      ticker,
      items: kind === 'news' ? parseNews(rows, ticker, companyName) : parseFilings(rows, ticker),
      source: 'api',
      capturedAt: new Date().toISOString(),
      canRefresh: true,
    };
    cache.set(key, response);
    return response;
  })();
  pending.set(key, request);
  try {
    return await request;
  } finally {
    pending.delete(key);
  }
}

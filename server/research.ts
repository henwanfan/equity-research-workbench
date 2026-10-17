import type { CompanyFiling, NewsArticle } from '../src/domain/research.ts';
import { ProviderError } from './massive.ts';

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as RecordValue) : null;
const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);
const validDate = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value) &&
  Number.isFinite(Date.parse(value));

function safeLink(value: unknown, secOnly = false): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (
      secOnly &&
      (!['www.sec.gov', 'sec.gov'].includes(url.hostname) || !url.pathname.startsWith('/Archives/'))
    )
      return null;
    if ([...url.searchParams.keys()].some((key) => /api.?key|token|authorization/i.test(key)))
      return null;
    return url.href;
  } catch {
    return null;
  }
}

function results(value: unknown): RecordValue[] {
  if (!Array.isArray(value))
    throw new ProviderError('Massive returned unreadable research data. Please try again.', 502);
  return value.flatMap((item) => (record(item) ? [record(item)!] : []));
}

const headlineAliases: Record<string, string> = {
  AAPL: 'Apple',
  MSFT: 'Microsoft',
  NVDA: 'Nvidia',
  AMZN: 'Amazon',
  GOOGL: 'Alphabet',
  META: 'Meta',
  JPM: 'JPMorgan',
  XOM: 'Exxon',
};
const normalizeHeadline = (value: string) =>
  ` ${value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `;
function namesCompany(title: string, ticker: string, companyName: string) {
  const name =
    headlineAliases[ticker] ??
    companyName
      .replace(
        /\b(?:incorporated|inc|corporation|corp|plc|limited|ltd|holdings|common|class)\b.*$/i,
        '',
      )
      .trim();
  const headline = normalizeHeadline(title);
  return (
    headline.includes(normalizeHeadline(ticker)) ||
    (name.length > 2 && headline.includes(normalizeHeadline(name)))
  );
}

export function parseNews(value: unknown, ticker: string, companyName = ticker): NewsArticle[] {
  const rows = results(value);
  const matching = rows.filter((row) => Array.isArray(row.tickers) && row.tickers.includes(ticker));
  if (rows.length && !matching.length)
    throw new ProviderError(
      'Massive returned articles for another company. Please try again.',
      502,
    );
  const seen = new Set<string>();
  return matching
    .flatMap((row): NewsArticle[] => {
      const id = text(row.id);
      const title = text(row.title);
      const url = safeLink(row.article_url);
      const publisher = text(record(row.publisher)?.name);
      if (!id || !title || !url || !publisher || !validDate(row.published_utc) || seen.has(id))
        return [];
      seen.add(id);
      return [
        {
          id,
          title,
          url,
          publisher,
          publishedAt: row.published_utc,
          description: text(row.description),
        },
      ];
    })
    .sort(
      (a, b) =>
        Number(namesCompany(b.title, ticker, companyName)) -
          Number(namesCompany(a.title, ticker, companyName)) ||
        Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
    )
    .slice(0, 50);
}

export function parseFilings(value: unknown, ticker: string): CompanyFiling[] {
  const rows = results(value);
  const matching = rows.filter((row) => row.ticker === ticker);
  if (rows.length && !matching.length)
    throw new ProviderError('Massive returned filings for another company. Please try again.', 502);
  const seen = new Set<string>();
  return matching
    .flatMap((row): CompanyFiling[] => {
      const id = text(row.accession_number);
      const url = safeLink(row.filing_url, true);
      const form = row.form_type;
      if (
        !id ||
        !url ||
        !validDate(row.filing_date) ||
        !['10-K', '10-Q', '8-K'].includes(String(form))
      )
        return [];
      return [
        { id, url, filedAt: row.filing_date.slice(0, 10), form: form as CompanyFiling['form'] },
      ];
    })
    .sort((a, b) => b.filedAt.localeCompare(a.filedAt))
    .filter((filing) => {
      if (seen.has(filing.form)) return false;
      seen.add(filing.form);
      return true;
    });
}

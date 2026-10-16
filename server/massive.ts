import type { Company, DailyBar } from '../src/domain/equity.ts';

type JsonObject = Record<string, unknown>;

export function historyEndDate(now = new Date()): string {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const previous = new Date(`${today}T12:00:00Z`);
  previous.setUTCDate(previous.getUTCDate() - 1);
  return previous.toISOString().slice(0, 10);
}
const nullableNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;
const nullableString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value : null;

export function parseBars(value: unknown): DailyBar[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((raw: JsonObject) => {
      if (!raw || typeof raw !== 'object') return [];
      const t = nullableNumber(raw.t);
      const open = nullableNumber(raw.o);
      const high = nullableNumber(raw.h);
      const low = nullableNumber(raw.l);
      const close = nullableNumber(raw.c);
      const volume = nullableNumber(raw.v);
      if (
        t === null ||
        open === null ||
        high === null ||
        low === null ||
        close === null ||
        volume === null ||
        !Number.isFinite(new Date(t).getTime())
      )
        return [];
      const date = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(t));
      return [{ date, open, high, low, close, volume }];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function parseCompany(details: JsonObject, history: unknown, seed: Company): Company {
  return {
    ticker: seed.ticker,
    name: nullableString(details.name) ?? seed.name,
    sector: seed.sector,
    exchange: nullableString(details.primary_exchange),
    description: nullableString(details.description),
    marketCap: nullableNumber(details.market_cap),
    employees: nullableNumber(details.total_employees),
    website: nullableString(details.homepage_url),
    industry: nullableString(details.sic_description),
    currency: nullableString(details.currency_name)?.toUpperCase() ?? 'USD',
    bars: parseBars(history),
  };
}

export class ProviderError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let nextRequestAt = 0;

export async function massiveResponse(path: string, apiKey: string): Promise<Response> {
  // Space upstream requests to stay within the documented five-per-minute tier.
  const startAt = Math.max(Date.now(), nextRequestAt);
  nextRequestAt = startAt + 13_000;
  const delay = startAt - Date.now();
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
  let response: Response;
  try {
    response = await fetch(`https://api.massive.com${path}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new ProviderError(
      'Massive could not be reached. Your saved data is still available.',
      502,
    );
  }
  if (!response.ok) {
    if (response.status === 429)
      throw new ProviderError(
        'Massive’s request limit was reached. Wait a minute before refreshing.',
        429,
      );
    if (response.status === 401 || response.status === 403)
      throw new ProviderError(
        'The API key cannot access this data. Check the server configuration.',
        502,
      );
    throw new ProviderError('Massive could not return this company. Try again later.', 502);
  }
  return response;
}

export async function massiveRequest(path: string, apiKey: string): Promise<JsonObject> {
  const response = await massiveResponse(path, apiKey);
  try {
    return (await response.json()) as JsonObject;
  } catch {
    throw new ProviderError(
      'Massive returned an unreadable response. Your saved data is still available.',
      502,
    );
  }
}

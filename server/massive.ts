import type { Company, DailyBar } from '../src/domain/equity.ts';
import { completedDailyDate } from '../src/domain/marketFreshness.ts';

type JsonObject = Record<string, unknown>;

export function historyEndDate(now = new Date()): string {
  return completedDailyDate(now);
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
  retryAfterSeconds?: number;
  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message);
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds ?? (status === 429 ? 5 : undefined);
  }
}

// Reserve an entire company refresh before starting either request. Never queue user actions.
export class RequestBudget {
  private starts: number[] = [];
  reserve(count: number, now = Date.now()) {
    this.starts = this.starts.filter((time) => now - time < 60_000);
    if (this.starts.length + count > 5) {
      const seconds = Math.max(
        1,
        Math.ceil((60_000 - (now - this.starts[this.starts.length + count - 6]!)) / 1000),
      );
      throw new ProviderError(
        `Request limit reached. Try again in ${seconds} seconds. Saved prices remain available.`,
        429,
        seconds,
      );
    }
    this.starts.push(...Array<number>(count).fill(now));
  }
}
const budget = new RequestBudget();

export function providerRetrySeconds(value: string | null, now = Date.now()) {
  if (!value) return 60;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return seconds >= 0 ? Math.max(1, Math.ceil(seconds)) : 60;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(1, Math.ceil((date - now) / 1000)) : 60;
}

async function fetchResponse(path: string, apiKey: string): Promise<Response> {
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
        'Massive’s request limit was reached. Existing data remains available.',
        429,
        providerRetrySeconds(response.headers.get('Retry-After')),
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

export async function massiveResponse(path: string, apiKey: string): Promise<Response> {
  budget.reserve(1);
  return fetchResponse(path, apiKey);
}

async function readJson(response: Response): Promise<JsonObject> {
  try {
    return (await response.json()) as JsonObject;
  } catch {
    throw new ProviderError(
      'Massive returned an unreadable response. Your saved data is still available.',
      502,
    );
  }
}

export async function massiveRequests(paths: string[], apiKey: string): Promise<JsonObject[]> {
  budget.reserve(paths.length);
  return Promise.all(paths.map(async (path) => readJson(await fetchResponse(path, apiKey))));
}

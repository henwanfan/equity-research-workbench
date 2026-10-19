import type { DailyBar } from '../src/domain/equity.ts';
import { historyEndDate, ProviderError } from './massive.ts';

type RequestBatch = (paths: string[], apiKey: string) => Promise<Record<string, unknown>[]>;
export interface MarketPrices {
  prices: Record<string, DailyBar[]>;
  date: string;
  capturedAt: string;
}
const sessionDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function candidateSessions(end: string): string[] {
  const day = new Date(`${end}T12:00:00Z`);
  const dates: string[] = [];
  while (dates.length < 4) {
    if (day.getUTCDay() !== 0 && day.getUTCDay() !== 6) dates.push(day.toISOString().slice(0, 10));
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return dates;
}

export function parseGroupedDay(
  payload: Record<string, unknown>,
  expectedDate: string,
): Map<string, DailyBar> {
  if (payload.adjusted === false)
    throw new ProviderError(
      'Unadjusted prices were returned. Existing prices have been kept.',
      502,
    );
  if (payload.results == null && payload.resultsCount === 0) return new Map();
  if (!Array.isArray(payload.results))
    throw new ProviderError(
      'Market prices could not be read. Existing prices have been kept.',
      502,
    );
  const parsed = new Map<string, DailyBar>();
  for (const raw of payload.results) {
    if (!raw || typeof raw !== 'object') continue;
    const { T, t, o, h, l, c, v } = raw;
    if (
      typeof T !== 'string' ||
      !/^[A-Z][A-Z0-9.]{0,9}$/.test(T) ||
      ![t, o, h, l, c, v].every((value) => typeof value === 'number' && Number.isFinite(value)) ||
      !Number.isFinite(new Date(t).getTime()) ||
      c <= 0 ||
      o <= 0 ||
      l <= 0 ||
      v < 0 ||
      h < l ||
      h < c ||
      l > c ||
      sessionDate.format(new Date(t)) !== expectedDate
    )
      continue;
    parsed.set(T, { date: expectedDate, open: o, high: h, low: l, close: c, volume: v });
  }
  if (payload.results.length && !parsed.size)
    throw new ProviderError(
      'Market prices did not match the requested session. Existing prices have been kept.',
      502,
    );
  return parsed;
}

export class MarketPriceService {
  private current: MarketPrices | null = null;
  private pending: Promise<MarketPrices> | null = null;
  private lastSuccess = 0;
  private lastAutomaticAttempt = 0;
  private automaticError: unknown = null;
  private request: RequestBatch;
  private now: () => Date;
  constructor(request: RequestBatch, now: () => Date = () => new Date()) {
    this.request = request;
    this.now = now;
  }
  read() {
    return this.current;
  }
  async ensureFresh(apiKey: string, savedDate: string): Promise<MarketPrices | null> {
    const now = this.now();
    const latestCandidate = candidateSessions(historyEndDate(now))[0]!;
    if ((this.current?.date ?? savedDate) >= latestCandidate) return this.current;
    if (this.pending) return this.pending;
    // Share failed/holiday checks across visitors instead of spending the quota per page load.
    const cooldown =
      this.automaticError instanceof ProviderError && this.automaticError.status === 429
        ? (this.automaticError.retryAfterSeconds ?? 60) * 1000
        : 5 * 60_000;
    const remaining = cooldown - (now.getTime() - this.lastAutomaticAttempt);
    if (this.lastAutomaticAttempt && remaining > 0) {
      if (this.automaticError instanceof ProviderError) {
        throw new ProviderError(
          this.automaticError.message,
          this.automaticError.status,
          Math.ceil(remaining / 1000),
        );
      }
      if (this.automaticError) throw this.automaticError;
      return this.current;
    }
    this.lastAutomaticAttempt = now.getTime();
    try {
      const result = await this.refresh(apiKey);
      this.automaticError = null;
      return result;
    } catch (error) {
      this.automaticError = error;
      throw error;
    }
  }
  refresh(apiKey: string): Promise<MarketPrices> {
    if (!apiKey)
      return Promise.reject(
        new ProviderError(
          'Add MASSIVE_API_KEY to the server environment to refresh closing prices.',
          503,
        ),
      );
    if (this.pending) return this.pending;
    const now = this.now();
    const end = historyEndDate(now);
    if (this.current && now.getTime() - this.lastSuccess < 60_000 && this.current.date <= end)
      return Promise.resolve(this.current);
    this.pending = this.load(apiKey, end).finally(() => {
      this.pending = null;
    });
    return this.pending;
  }
  private async load(apiKey: string, end: string): Promise<MarketPrices> {
    const dates = candidateSessions(end);
    const sessions: { date: string; bars: Map<string, DailyBar> }[] = [];
    // Two bulk calls normally; at most one additional pair for market holidays.
    for (let index = 0; index < 4 && sessions.length < 2; index += 2) {
      const pair = dates.slice(index, index + 2);
      const payloads = await this.request(
        pair.map(
          (date) =>
            `/v2/aggs/grouped/locale/us/market/stocks/${date}?adjusted=true&include_otc=false`,
        ),
        apiKey,
      );
      for (let offset = 0; offset < pair.length; offset++) {
        const bars = parseGroupedDay(payloads[offset]!, pair[offset]!);
        if (bars.size) sessions.push({ date: pair[offset]!, bars });
      }
    }
    if (sessions.length < 2)
      throw new ProviderError(
        'Two completed market sessions were not available. Existing prices have been kept.',
        502,
      );
    const [latest, previous] = sessions;
    const prices: Record<string, DailyBar[]> = {};
    for (const [ticker, bar] of latest!.bars) {
      const prior = previous!.bars.get(ticker);
      // A daily percentage is only valid when both market sessions are available.
      if (prior) prices[ticker] = [prior, bar];
    }
    if (!Object.keys(prices).length)
      throw new ProviderError(
        'No comparable closing prices were returned. Existing prices have been kept.',
        502,
      );
    const capturedAt = this.now().toISOString();
    const result = { prices, date: latest!.date, capturedAt };
    this.current = result;
    this.lastSuccess = Date.parse(capturedAt);
    return result;
  }
}

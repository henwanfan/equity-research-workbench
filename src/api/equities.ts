import type { ResearchKind, ResearchResponse } from '../domain/research';
import type { CatalogueResponse, EquityResponse, MarketRefreshResponse } from '../domain/equity';

export class ApiError extends Error {
  readonly status: number;
  readonly retryAt: number | null;
  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message);
    this.status = status;
    this.retryAt =
      retryAfterSeconds && Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? Date.now() + retryAfterSeconds * 1000
        : status === 429
          ? Date.now() + 60_000
          : null;
  }
}

async function request<T>(path: string, signal?: AbortSignal, timeoutMs = 15_000): Promise<T> {
  const timeout = AbortSignal.timeout(timeoutMs);
  let response: Response;
  try {
    response = await fetch(path, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  } catch (error) {
    if (timeout.aborted)
      throw new Error('The request timed out. Saved prices remain available. Please try again.');
    throw error;
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      retryAfterSeconds?: number;
    };
    throw new ApiError(
      body.error ?? 'The research data could not be loaded. Please try again.',
      response.status,
      Number(response.headers.get('Retry-After')) || body.retryAfterSeconds,
    );
  }
  return response.json() as Promise<T>;
}

export const getCatalogue = (signal?: AbortSignal) =>
  request<CatalogueResponse>('/api/equities', signal);
export const getEquity = (ticker: string, signal?: AbortSignal) =>
  request<EquityResponse>(`/api/equities/${encodeURIComponent(ticker)}`, signal);
export const refreshEquity = (ticker: string) =>
  request<EquityResponse>(`/api/equities/${encodeURIComponent(ticker)}?refresh=true&force=true`);
export const loadCompanyHistory = (ticker: string, signal?: AbortSignal) =>
  request<EquityResponse>(`/api/equities/${encodeURIComponent(ticker)}?refresh=true`, signal);

export const getResearch = <K extends ResearchKind>(
  ticker: string,
  kind: K,
  refresh = false,
  signal?: AbortSignal,
) =>
  request<ResearchResponse<K>>(
    `/api/equities/${encodeURIComponent(ticker)}/${kind}${refresh ? '?refresh=true' : ''}`,
    signal,
  );

export const refreshClosingPrices = () =>
  request<MarketRefreshResponse>('/api/equities?refresh=true', undefined, 30_000);

export const checkClosingPrices = (signal?: AbortSignal) =>
  request<MarketRefreshResponse>('/api/equities?refresh=auto', signal, 30_000);

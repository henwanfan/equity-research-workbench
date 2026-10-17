import type { ResearchKind, ResearchResponse } from '../domain/research';
import type { CatalogueResponse, EquityResponse } from '../domain/equity';

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(15_000);
  let response: Response;
  try {
    response = await fetch(path, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  } catch (error) {
    if (timeout.aborted)
      throw new Error('The request timed out. Saved prices remain available. Please try again.');
    throw error;
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? 'The research data could not be loaded. Please try again.');
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

import type { CatalogueResponse, EquityResponse } from '../domain/equity';

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal });
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
  request<EquityResponse>(`/api/equities/${encodeURIComponent(ticker)}?refresh=true`);

import { expectedClosingDate } from '../domain/marketFreshness';
import { useRetryCountdown } from './useCompanyHistory';
import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { checkClosingPrices, getCatalogue } from '../api/equities';
import {
  mergeClosingPrices,
  type EquityResponse,
  type MarketRefreshResponse,
} from '../domain/equity';

export function synchronizeMarketPrices(client: QueryClient, result: MarketRefreshResponse) {
  client.setQueryData(['equities'], result.catalogue);
  client.setQueriesData<EquityResponse>(
    {
      predicate: (query) =>
        query.queryKey[0] === 'equity' || query.queryKey[0] === 'equity-history',
    },
    (current) => {
      if (!current) return current;
      const prices = result.prices[current.company.ticker];
      return prices ? mergeClosingPrices(current, prices, result.catalogue.capturedAt) : current;
    },
  );
  void client.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === 'equity-history' &&
      Boolean((query.state.data as EquityResponse | undefined)?.historyNeedsRefresh),
    refetchType: 'none',
  });
}

interface MarketDataState {
  isChecking: boolean;
  error: string | null;
  referenceDate: string;
  retrySeconds: number;
  retry: () => void;
}
const MarketDataContext = createContext<MarketDataState | null>(null);
export function MarketDataProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const catalogue = useQuery({
    queryKey: ['equities'],
    queryFn: ({ signal }) => getCatalogue(signal),
  });
  const check = useQuery({
    queryKey: ['closing-prices-entry'],
    queryFn: async ({ signal }) => {
      const result = await checkClosingPrices(signal);
      synchronizeMarketPrices(client, result);
      return result;
    },
    enabled: Boolean(catalogue.data?.canRefresh),
    retry: false,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  const retrySeconds = useRetryCountdown(check.error);
  return (
    <MarketDataContext.Provider
      value={{
        isChecking: check.isFetching || catalogue.isPending,
        error: check.isError ? check.error.message : null,
        referenceDate: check.data?.catalogue.date ?? expectedClosingDate(),
        retrySeconds,
        retry: () => {
          void check.refetch();
        },
      }}
    >
      {children}
    </MarketDataContext.Provider>
  );
}
export function useMarketData() {
  const value = useContext(MarketDataContext);
  if (!value) throw new Error('MarketDataProvider is missing');
  return value;
}
export function MarketUpdateStatus() {
  const market = useMarketData();
  if (!market.isChecking && !market.error) return null;
  return (
    <div className="market-update-status" role="status">
      <span>
        {market.isChecking
          ? 'Checking latest closing prices…'
          : 'Couldn’t update closing prices. Showing available data.'}
      </span>
      {!market.isChecking && (
        <button className="text-button" onClick={market.retry} disabled={market.retrySeconds > 0}>
          {market.retrySeconds > 0 ? `Try again in ${market.retrySeconds}s` : 'Try again'}
        </button>
      )}
    </div>
  );
}

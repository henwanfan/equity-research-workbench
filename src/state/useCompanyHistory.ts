import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, loadCompanyHistory } from '../api/equities';
import { historyRetryDelay, shouldRetryHistory } from '../api/historyRetry';

export function useRetryCountdown(error: Error | null) {
  const retryAt = error instanceof ApiError ? error.retryAt : null;
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    if (!retryAt || retryAt <= Date.now()) return;
    const timer = window.setInterval(() => {
      const next = Date.now();
      setNow(next);
      if (next >= retryAt) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);
  return retryAt ? Math.max(0, Math.ceil((retryAt - Math.max(now, Date.now())) / 1000)) : 0;
}

export function useCompanyHistory(ticker: string, enabled: boolean) {
  const query = useQuery({
    queryKey: ['equity-history', ticker],
    queryFn: ({ signal }) => loadCompanyHistory(ticker, signal),
    enabled,
    retry: shouldRetryHistory,
    retryDelay: historyRetryDelay,
    staleTime: 60 * 60 * 1000,
  });
  const retrySeconds = useRetryCountdown(query.failureReason);
  const isWaiting =
    query.isFetching &&
    query.failureReason instanceof ApiError &&
    query.failureReason.status === 429;
  return { ...query, isWaiting, retrySeconds };
}

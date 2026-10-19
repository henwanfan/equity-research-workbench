import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { ApiError } from '../src/api/equities.ts';
import { shouldRetryHistory, historyRetryDelay } from '../src/api/historyRetry.ts';
import { expectedClosingDate } from '../src/domain/marketFreshness.ts';

test('history retries only rate limits once, respecting the server deadline', () => {
  const now = Date.now;
  Date.now = () => 1000;
  try {
    const limit = new ApiError('Wait', 429, 25);
    assert.equal(shouldRetryHistory(0, limit), true);
    assert.equal(shouldRetryHistory(1, limit), false);
    assert.equal(shouldRetryHistory(0, new ApiError('Unavailable', 502)), false);
    assert.equal(shouldRetryHistory(0, new Error('Network failure')), false);
    assert.equal(historyRetryDelay(0, limit), 25_250);
    assert.equal(historyRetryDelay(0, new ApiError('Wait', 429)), 60_250);
  } finally {
    Date.now = now;
  }
});

test('leaving a company cancels its pending retry instead of spending capacity later', async () => {
  const client = new QueryClient();
  let requests = 0;
  let failed: () => void = () => {};
  const failure = new Promise<void>((resolve) => {
    failed = resolve;
  });
  const observer = new QueryObserver(client, {
    queryKey: ['equity-history', 'TEST'],
    queryFn: async ({ signal }) => {
      void signal.aborted;
      requests++;
      throw new ApiError('Wait', 429, 1);
    },
    retry: shouldRetryHistory,
    retryDelay: () => 30,
    gcTime: 0,
  });
  const unsubscribe = observer.subscribe((result) => {
    if (result.failureCount) failed();
  });
  await failure;
  unsubscribe();
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(requests, 1);
  client.clear();
});

test('closing-date reference uses New York dates and skips weekends', () => {
  assert.equal(expectedClosingDate(new Date('2026-10-17T12:00:00Z')), '2026-10-16');
  assert.equal(expectedClosingDate(new Date('2026-10-19T12:00:00Z')), '2026-10-16');
  assert.equal(expectedClosingDate(new Date('2026-10-20T00:14:59Z')), '2026-10-16');
  assert.equal(expectedClosingDate(new Date('2026-10-20T00:15:00Z')), '2026-10-19');
  assert.equal(expectedClosingDate(new Date('2026-10-20T02:00:00Z')), '2026-10-19');
  assert.equal(expectedClosingDate(new Date('2026-10-18T02:00:00Z')), '2026-10-16');
});

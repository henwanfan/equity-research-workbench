import { ApiError } from './equities.ts';

export function shouldRetryHistory(failureCount: number, error: Error) {
  return failureCount < 1 && error instanceof ApiError && error.status === 429;
}
export function historyRetryDelay(_attempt: number, error: Error) {
  return error instanceof ApiError && error.retryAt !== null
    ? Math.max(1000, error.retryAt - Date.now() + 250)
    : 60_000;
}

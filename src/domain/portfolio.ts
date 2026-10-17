export const PORTFOLIO_STORAGE_KEY = 'equity-research:portfolio:v1';
const tickerPattern = /^[A-Z][A-Z0-9.]{0,9}$/;

export function parsePortfolio(raw: string | null): string[] {
  if (raw === null) return [];
  const data: unknown = JSON.parse(raw);
  if (
    !data ||
    typeof data !== 'object' ||
    !('version' in data) ||
    data.version !== 1 ||
    !('tickers' in data) ||
    !Array.isArray(data.tickers)
  )
    throw new Error('Invalid portfolio format');
  if (
    !data.tickers.every(
      (ticker): ticker is string => typeof ticker === 'string' && tickerPattern.test(ticker),
    )
  )
    throw new Error('Invalid portfolio ticker');
  return [...new Set(data.tickers)];
}

export function serializePortfolio(tickers: string[]): string {
  return JSON.stringify({ version: 1, tickers });
}

export function togglePortfolioTicker(tickers: string[], ticker: string): string[] {
  if (!tickerPattern.test(ticker)) return tickers;
  return tickers.includes(ticker)
    ? tickers.filter((saved) => saved !== ticker)
    : [ticker, ...tickers];
}

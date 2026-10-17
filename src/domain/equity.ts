export interface DailyBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Company {
  ticker: string;
  name: string;
  sector: string;
  exchange: string | null;
  description: string | null;
  marketCap: number | null;
  employees: number | null;
  website: string | null;
  industry: string | null;
  currency: string;
  bars: DailyBar[];
  logoUrl?: string | null;
}

export interface EquityResponse {
  company: Company;
  source: 'snapshot' | 'api';
  capturedAt: string;
  historyLoaded: boolean;
  canRefresh?: boolean;
}

export interface EquitySummary {
  ticker: string;
  name: string;
  sector: string;
  close: number | null;
  changePercent: number | null;
  date: string | null;
  exchange: string | null;
  volume: number | null;
}

export interface CatalogueResponse {
  equities: EquitySummary[];
  capturedAt: string;
  date: string;
}

export function summarize(company: Company): EquitySummary {
  const latest = company.bars.at(-1);
  const previous = company.bars.at(-2);
  return {
    ticker: company.ticker,
    name: company.name,
    sector: company.sector,
    exchange: company.exchange,
    volume: latest?.volume ?? null,
    close: latest?.close ?? null,
    changePercent:
      latest && previous && previous.close > 0
        ? ((latest.close - previous.close) / previous.close) * 100
        : null,
    date: latest?.date ?? null,
  };
}

export function barsForRange(bars: DailyBar[], days: number): DailyBar[] {
  const latest = bars.at(-1);
  if (!latest) return [];
  const cutoff = new Date(`${latest.date}T12:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const firstDate = cutoff.toISOString().slice(0, 10);
  return bars.filter((bar) => bar.date >= firstDate);
}

export function calculateResearchMetrics(bars: DailyBar[], days = 90) {
  const period = barsForRange(bars, days);
  const recent = bars.slice(-20);
  const averageVolume = recent.length
    ? recent.reduce((sum, bar) => sum + bar.volume, 0) / recent.length
    : null;
  const latest = bars.at(-1);
  return {
    periodHigh: period.length ? Math.max(...period.map((bar) => bar.high)) : null,
    periodLow: period.length ? Math.min(...period.map((bar) => bar.low)) : null,
    averageVolume,
    volumeMultiple:
      latest && averageVolume && averageVolume > 0 ? latest.volume / averageVolume : null,
    volumeSessions: recent.length,
  };
}

export const chartRanges = { '1W': 7, '1M': 30, '3M': 90, '1Y': 365 } as const;
export type ChartRange = keyof typeof chartRanges;

export function periodChangePercent(bars: DailyBar[]): number | null {
  const first = bars[0];
  const last = bars.at(-1);
  return first && last && first.close > 0 ? (last.close / first.close - 1) * 100 : null;
}

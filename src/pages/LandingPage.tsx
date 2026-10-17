import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, RotateCcw, Bookmark, BookmarkCheck } from 'lucide-react';
import { getEquity } from '../api/equities';
import {
  barsForRange,
  summarize,
  calculateResearchMetrics,
  chartRanges,
  periodChangePercent,
} from '../domain/equity';
import type { ChartRange } from '../domain/equity';
import { usePortfolio } from '../state/PortfolioProvider';
import { MetricLabel } from '../components/MetricLabel';
import { compact, dateLabel, money, percent } from '../lib/format';
import { CompanyMark } from '../components/CompanyMark';
import { DataSource } from '../components/DataSource';
import { PriceChart } from '../components/PriceChart';

const previewCompanies = [
  { ticker: 'AAPL', label: 'Apple' },
  { ticker: 'MSFT', label: 'Microsoft' },
  { ticker: 'NVDA', label: 'NVIDIA' },
];

export function LandingPage({ researchUrl }: { researchUrl: string }) {
  const [ticker, setTicker] = useState('AAPL');
  const [range, setRange] = useState<ChartRange>('3M');
  const portfolio = usePortfolio();
  const isSaved = portfolio.tickers.includes(ticker);
  const equity = useQuery({
    queryKey: ['equity', ticker],
    queryFn: ({ signal }) => getEquity(ticker, signal),
  });
  const company = equity.data?.company;
  const quote = company ? summarize(company) : null;
  const bars = useMemo(
    () => barsForRange(company?.bars ?? [], chartRanges[range]),
    [company?.bars, range],
  );
  const periodChange =
    equity.data?.historyLoaded && !equity.data.historyNeedsRefresh
      ? periodChangePercent(bars)
      : null;
  const metrics = calculateResearchMetrics(company?.bars ?? [], chartRanges[range]);
  const researchLink = `/research?ticker=${ticker}&range=${range}`;
  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-inner">
          <div className="landing-intro">
            <h1 id="landing-title">
              Go beyond
              <br />
              the <span>ticker.</span>
            </h1>
            <p>
              Get to know the business behind the price. Explore US companies and put their market
              moves in perspective.
            </p>
            <Link className="landing-cta" to={researchUrl}>
              Open the workbench <ArrowRight size={18} />
            </Link>
          </div>
          <section className="landing-preview" aria-label="Explore company research">
            <div className="preview-companies" role="group" aria-label="Preview a company">
              {previewCompanies.map((item) => (
                <button
                  key={item.ticker}
                  type="button"
                  aria-pressed={ticker === item.ticker}
                  onClick={() => setTicker(item.ticker)}
                >
                  <CompanyMark ticker={item.ticker} />
                  {item.label}
                </button>
              ))}
            </div>
            <div className="preview-body" aria-busy={equity.isPending}>
              {equity.isPending ? (
                <div className="preview-status" role="status">
                  <div className="skeleton" />
                  <div className="skeleton skeleton-chart" />
                  <span>Loading {ticker} research…</span>
                </div>
              ) : equity.isError || !company || !quote ? (
                <div className="preview-status" role="alert">
                  <h2>The preview couldn’t load.</h2>
                  <p>You can retry or open the workbench.</p>
                  <button className="secondary-button" onClick={() => void equity.refetch()}>
                    <RotateCcw size={14} />
                    Try again
                  </button>
                </div>
              ) : (
                <div className="preview-evidence" key={ticker}>
                  <div className="preview-identity">
                    <CompanyMark ticker={ticker} logoUrl={company.logoUrl} large />
                    <div>
                      <h2>{company.name}</h2>
                      <span>
                        {ticker}
                        {company.sector ? ` · ${company.sector}` : ''}
                      </span>
                    </div>
                    <button
                      className="secondary-button preview-save"
                      aria-pressed={isSaved}
                      aria-label={`${isSaved ? 'Remove' : 'Add'} ${ticker} ${isSaved ? 'from' : 'to'} portfolio`}
                      title={isSaved ? 'Remove from portfolio' : 'Add to portfolio'}
                      onClick={() => portfolio.toggle(ticker)}
                    >
                      {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    </button>
                  </div>
                  {portfolio.persistenceError && (
                    <p className="portfolio-warning" role="alert">
                      {portfolio.persistenceError}
                    </p>
                  )}
                  <div className="preview-price-row">
                    <div className="preview-quote">
                      <strong>{money(quote.close, company.currency)}</strong>
                      <span
                        className={
                          periodChange == null ? '' : periodChange < 0 ? 'negative' : 'positive'
                        }
                      >
                        {percent(periodChange)}
                        <small>{range} change</small>
                      </span>
                    </div>
                    <div className="preview-ranges" role="group" aria-label="Preview chart period">
                      {(Object.keys(chartRanges) as ChartRange[]).map((value) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={range === value}
                          onClick={() => setRange(value)}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                  <PriceChart
                    bars={equity.data.historyNeedsRefresh ? [] : bars}
                    currency={company.currency}
                    emptyMessage="Closing prices are updated. Open the workbench to refresh missing price history."
                  />
                  <dl className="preview-facts">
                    <div>
                      <dt>
                        <MetricLabel
                          label="Market cap"
                          explanation="Market value of the company’s outstanding equity. This compares company size, not whether a stock is cheap."
                        />
                      </dt>
                      <dd>{compact(company.marketCap, company.currency)}</dd>
                    </div>
                    <div>
                      <dt>
                        <MetricLabel
                          label="Session volume"
                          explanation="Shares traded in the latest available session, compared with the average of the latest 20 trading sessions."
                        />
                      </dt>
                      <dd>
                        {compact(quote.volume)}
                        {!equity.data.historyNeedsRefresh &&
                          metrics.volumeMultiple !== null &&
                          metrics.volumeSessions >= 20 && (
                            <small>
                              {metrics.volumeMultiple.toFixed(2)}× {metrics.volumeSessions}D avg.
                            </small>
                          )}
                      </dd>
                    </div>
                    <div>
                      <dt>
                        <MetricLabel
                          label={`${range} high`}
                          explanation="Highest traded price in the selected window, including intraday highs. The chart plots closing prices."
                        />
                      </dt>
                      <dd>
                        {money(
                          equity.data.historyLoaded && !equity.data.historyNeedsRefresh
                            ? metrics.periodHigh
                            : null,
                          company.currency,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>
                        <MetricLabel
                          label={`${range} low`}
                          explanation="Lowest traded price in the selected window, including intraday lows. The chart plots closing prices."
                        />
                      </dt>
                      <dd>
                        {money(
                          equity.data.historyLoaded && !equity.data.historyNeedsRefresh
                            ? metrics.periodLow
                            : null,
                          company.currency,
                        )}
                      </dd>
                    </div>
                  </dl>
                  <div className="preview-provenance">
                    <span>
                      {quote.date
                        ? `${equity.data.source === 'snapshot' ? 'Saved close' : 'Close'} · ${dateLabel(quote.date)}`
                        : 'Closing date unavailable'}
                    </span>
                    <DataSource
                      source={equity.data.source}
                      capturedAt={equity.data.capturedAt}
                      priceDate={quote.date ?? undefined}
                    />
                  </div>
                </div>
              )}
            </div>
            <Link className="preview-open" to={researchLink}>
              Research {ticker}
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </section>
    </main>
  );
}

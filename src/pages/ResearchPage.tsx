import { ResearchPortfolio } from '../components/ResearchPortfolio';
import { usePortfolio } from '../state/PortfolioProvider';
import { CompanyResearch } from '../components/CompanyResearch';
import { Fragment, useRef, useState, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowUpDown,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ExternalLink,
  Info,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { getCatalogue, getEquity, refreshEquity, loadCompanyHistory } from '../api/equities';
import {
  barsForRange,
  calculateResearchMetrics,
  chartRanges,
  periodChangePercent,
} from '../domain/equity';
import type { ChartRange } from '../domain/equity';
import type { EquityResponse } from '../domain/equity';
import { compact, dateLabel, money, percent } from '../lib/format';
import { PriceChart } from '../components/PriceChart';
import { SelectControl } from '../components/SelectControl';
import { EquitySearch } from '../components/EquitySearch';
import { MetricLabel } from '../components/MetricLabel';
import { CompanyMark } from '../components/CompanyMark';
import { DataSource } from '../components/DataSource';

const wideWorkspaceQuery = '(min-width: 1280px)';
function subscribeWorkspaceWidth(onChange: () => void) {
  const media = window.matchMedia(wideWorkspaceQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const getWideWorkspace = () => window.matchMedia(wideWorkspaceQuery).matches;

const featuredTickers = [
  'AAPL',
  'MSFT',
  'NVDA',
  'AMZN',
  'GOOGL',
  'META',
  'JPM',
  'XOM',
  'TSLA',
  'BRK.B',
  'AVGO',
  'LLY',
  'V',
  'MA',
  'WMT',
  'COST',
  'JNJ',
  'UNH',
  'PG',
  'HD',
  'ORCL',
  'CRM',
  'ADBE',
  'AMD',
  'INTC',
  'KO',
  'PEP',
  'ABBV',
  'BAC',
  'DIS',
];
const featuredRanks = new Map(featuredTickers.map((ticker, index) => [ticker, index]));

function safeWebsite(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function DetailSkeleton({ ticker }: { ticker: string }) {
  return (
    <div className="detail-skeleton" role="status" aria-label="Loading company details">
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton skeleton-chart" />
      <span>Loading {ticker} company details and price history…</span>
    </div>
  );
}

export function ResearchPage() {
  const [params, setParams] = useSearchParams();
  const portfolio = usePortfolio();
  const isWideWorkspace = useSyncExternalStore(subscribeWorkspaceWidth, getWideWorkspace);
  const ticker = params.get('ticker') ?? 'AAPL';
  const search = params.get('q') ?? '';
  const exchange = params.get('exchange') ?? 'All exchanges';
  const sort = ['name', 'change', 'volume'].includes(params.get('sort') ?? '')
    ? params.get('sort')!
    : 'featured';
  const requestedRange = params.get('range') ?? '';
  const range: ChartRange = Object.hasOwn(chartRanges, requestedRange)
    ? (requestedRange as ChartRange)
    : '3M';
  const page = Math.max(1, Math.min(500, Number.parseInt(params.get('page') ?? '1') || 1));
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const client = useQueryClient();
  const update = (changes: Record<string, string>, replace = false) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (!value || value === 'All exchanges') next.delete(key);
      else next.set(key, value);
    }
    if ('q' in changes || 'exchange' in changes || 'sort' in changes) next.delete('page');
    setParams(next, { replace });
  };
  const catalogue = useQuery({
    queryKey: ['equities'],
    queryFn: ({ signal }) => getCatalogue(signal),
  });
  const equity = useQuery({
    queryKey: ['equity', ticker],
    queryFn: ({ signal }) => getEquity(ticker, signal),
  });
  const enrichment = useQuery({
    queryKey: ['equity-history', ticker],
    queryFn: ({ signal }) => loadCompanyHistory(ticker, signal),
    enabled: Boolean(equity.data?.canRefresh && !equity.data.historyLoaded),
    retry: false,
    staleTime: 60 * 60 * 1000,
  });
  const refresh = useMutation({
    mutationFn: refreshEquity,
    onSuccess: (data, requestedTicker) => client.setQueryData(['equity', requestedTicker], data),
  });
  const all = catalogue.data?.equities ?? [];
  const exchangeName = (value: string) =>
    ({ XNAS: 'NASDAQ', XNYS: 'NYSE', XASE: 'NYSE American', BATS: 'Cboe' })[value] ?? value;
  const exchanges = [
    ...new Set(
      all.map((company) => company.exchange).filter((value): value is string => Boolean(value)),
    ),
  ].sort();
  const filtered = all
    .filter(
      (company) =>
        `${company.ticker} ${company.name}`.toLowerCase().includes(search.trim().toLowerCase()) &&
        (exchange === 'All exchanges' || exchange === company.exchange),
    )
    .sort((a, b) => {
      const order =
        sort === 'featured'
          ? (featuredRanks.get(a.ticker) ?? featuredTickers.length) -
              (featuredRanks.get(b.ticker) ?? featuredTickers.length) ||
            (b.volume ?? -1) - (a.volume ?? -1)
          : sort === 'volume'
            ? (b.volume ?? -1) - (a.volume ?? -1)
            : sort === 'change'
              ? (b.changePercent ?? -Infinity) - (a.changePercent ?? -Infinity)
              : a.name.localeCompare(b.name);
      return order || a.ticker.localeCompare(b.ticker);
    });
  const visible = filtered.slice(0, page * 25);
  const data = equity.data?.historyLoaded ? equity.data : (enrichment.data ?? equity.data);
  const company = data?.company;
  const latest = company?.bars.at(-1);
  const rangeDays = chartRanges[range];
  const bars = company ? barsForRange(company.bars, rangeDays) : [];
  const periodChange = data?.historyLoaded ? periodChangePercent(bars) : null;
  const website = safeWebsite(company?.website ?? null);
  const refreshing = (refresh.isPending && refresh.variables === ticker) || enrichment.isFetching;
  const refreshError =
    refresh.isError && refresh.variables === ticker
      ? refresh.error.message
      : !data?.historyLoaded && enrichment.isError
        ? enrichment.error.message
        : null;
  const isPositive = (periodChange ?? 0) >= 0;
  const metrics = calculateResearchMetrics(company?.bars ?? [], rangeDays);

  const portfolioPanel = (
    <ResearchPortfolio
      equities={all}
      selectedTicker={ticker}
      date={catalogue.data?.date}
      loading={catalogue.isPending}
      error={catalogue.isError}
      onSelect={(savedTicker) => update({ ticker: savedTicker })}
    />
  );

  return (
    <main className="research-page">
      <div className="page-heading">
        <div>
          <h1>Research workbench</h1>
          <p>Search companies and review their price history and business.</p>
        </div>
      </div>
      <div className="workspace">
        {!isWideWorkspace && portfolioPanel}
        <div className="discovery-column">
          <section className="discovery" aria-labelledby="discovery-heading">
            <div className="section-heading">
              <h2 id="discovery-heading">Discover equities</h2>
              <span className="count">
                {filtered.length === all.length ? all.length : `${filtered.length}/${all.length}`}
              </span>
            </div>
            <EquitySearch value={search} onChange={(value) => update({ q: value }, true)} />
            <div className="filter-controls">
              <SelectControl
                label="Filter by exchange"
                value={exchange}
                icon={SlidersHorizontal}
                onValueChange={(value) => update({ exchange: value })}
                options={[
                  { value: 'All exchanges', label: 'All exchanges' },
                  ...exchanges.map((value) => ({ value, label: exchangeName(value) })),
                ]}
              />
              <SelectControl
                label="Sort equities"
                value={sort}
                icon={ArrowUpDown}
                onValueChange={(value) => update({ sort: value })}
                options={[
                  { value: 'featured', label: 'Featured' },
                  { value: 'name', label: 'Name A–Z' },
                  { value: 'volume', label: 'Most active' },
                  { value: 'change', label: 'Daily change' },
                ]}
              />
            </div>
            <div className="list-caption">
              <span>Company</span>
              <span>Close / daily change</span>
            </div>
            {catalogue.isPending ? (
              <div className="list-loading" role="status">
                Loading equities…
              </div>
            ) : catalogue.isError ? (
              <div className="empty-state">
                <h3>Companies couldn’t load</h3>
                <p>{catalogue.error.message}</p>
                <button className="secondary-button" onClick={() => void catalogue.refetch()}>
                  Try again
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <Search size={24} />
                <h3>No matching companies</h3>
                <p>Try a ticker or company name in this {all.length}-company collection.</p>
                <button
                  className="secondary-button"
                  onClick={() => update({ q: '', exchange: '' })}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="equity-list" ref={listRef}>
                {visible.map((item, index) => (
                  <Fragment key={item.ticker}>
                    {sort === 'featured' &&
                      (index === 0 ||
                        (featuredRanks.has(visible[index - 1]!.ticker) &&
                          !featuredRanks.has(item.ticker))) && (
                        <h3 className="discovery-group-label">
                          {featuredRanks.has(item.ticker)
                            ? 'Featured companies'
                            : 'More companies · most active'}
                        </h3>
                      )}
                    <button
                      className={`equity-row ${ticker === item.ticker ? 'selected' : ''}`}
                      key={item.ticker}
                      aria-pressed={ticker === item.ticker}
                      onClick={() => {
                        setExpanded(false);
                        update({ ticker: item.ticker });
                      }}
                    >
                      <CompanyMark
                        ticker={item.ticker}
                        logoUrl={
                          client.getQueryData<EquityResponse>(['equity', item.ticker])?.company
                            .logoUrl
                        }
                      />
                      <span className="equity-identity">
                        <strong>{item.ticker}</strong>
                        <span>{item.name}</span>
                      </span>
                      <span className="equity-values">
                        <strong>{money(item.close)}</strong>
                        <span
                          className={
                            item.changePercent == null
                              ? ''
                              : item.changePercent >= 0
                                ? 'positive'
                                : 'negative'
                          }
                        >
                          {percent(item.changePercent)}
                        </span>
                      </span>
                    </button>
                  </Fragment>
                ))}
              </div>
            )}
            {(visible.length < filtered.length || visible.length > 25) && (
              <div className="company-list-pagination">
                {visible.length < filtered.length && (
                  <button
                    className="text-button"
                    onClick={() => update({ page: String(page + 1) }, true)}
                  >
                    Show more companies
                  </button>
                )}
                {visible.length > 25 && (
                  <button
                    className="text-button"
                    aria-label="Show fewer companies"
                    onClick={() => {
                      update({ page: '' }, true);
                      listRef.current?.scrollTo({ top: 0 });
                    }}
                  >
                    Show fewer
                  </button>
                )}
                <span>
                  {visible.length.toLocaleString()} of {filtered.length.toLocaleString()}
                </span>
              </div>
            )}
          </section>
        </div>
        <section
          className="company-panel"
          aria-label="Selected company"
          aria-busy={equity.isPending}
        >
          {equity.isPending ? (
            <DetailSkeleton ticker={ticker} />
          ) : equity.isError ? (
            <div className="empty-state detail-error">
              <Info size={28} />
              <h2>Company unavailable</h2>
              <p>{equity.error.message}</p>
              <button className="secondary-button" onClick={() => void equity.refetch()}>
                Try again
              </button>
              <button className="text-button" onClick={() => update({ ticker: 'AAPL' })}>
                View Apple instead
              </button>
            </div>
          ) : company && data ? (
            <>
              <div className="company-main" key={company.ticker}>
                <div className="company-heading">
                  <CompanyMark ticker={company.ticker} logoUrl={company.logoUrl} large />
                  <div>
                    <div className="company-title">
                      <h2>{company.name}</h2>
                      <span className="ticker-tag">{company.ticker}</span>
                    </div>
                    <p>
                      {company.exchange === 'XNAS'
                        ? 'NASDAQ'
                        : company.exchange === 'XNYS'
                          ? 'NYSE'
                          : (company.exchange ?? 'Exchange unavailable')}
                      {company.sector !== 'Unclassified' && (
                        <>
                          <span>·</span>
                          {company.sector}
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    className="secondary-button portfolio-toggle"
                    title={
                      portfolio.tickers.includes(company.ticker)
                        ? `Remove ${company.ticker} from portfolio`
                        : `Add ${company.ticker} to portfolio`
                    }
                    aria-pressed={portfolio.tickers.includes(company.ticker)}
                    onClick={() => portfolio.toggle(company.ticker)}
                  >
                    {portfolio.tickers.includes(company.ticker) ? (
                      <BookmarkCheck size={15} aria-hidden="true" />
                    ) : (
                      <Bookmark size={15} aria-hidden="true" />
                    )}
                    {portfolio.tickers.includes(company.ticker)
                      ? 'In portfolio'
                      : 'Add to portfolio'}
                  </button>
                </div>
                <div className="price-heading">
                  <div>
                    <div className="price-line">
                      <strong>{money(latest?.close, company.currency)}</strong>
                      {periodChange !== null && (
                        <span className={`change-pill ${isPositive ? 'positive' : 'negative'}`}>
                          {isPositive ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}
                          {percent(periodChange)}
                          <small>{range}</small>
                        </span>
                      )}
                    </div>
                    <div className="price-meta">
                      <p>
                        {latest
                          ? `${data.source === 'snapshot' ? 'Saved close' : 'Close'} · ${dateLabel(latest.date)}`
                          : 'No daily prices available'}
                      </p>
                      <DataSource
                        source={data.source}
                        capturedAt={data.capturedAt}
                        priceDate={latest?.date}
                      />
                    </div>
                  </div>
                  <button
                    className="secondary-button refresh-button"
                    disabled={refresh.isPending || enrichment.isFetching}
                    onClick={() => refresh.mutate(ticker)}
                  >
                    <RefreshCw size={14} className={refreshing ? 'rotating' : ''} />
                    {refreshing ? 'Refreshing…' : 'Refresh data'}
                  </button>
                </div>
                {refreshing && (
                  <div className="inline-notice" role="status">
                    Retrieving the latest completed-session data. Your current view stays available.
                  </div>
                )}
                {refreshError && (
                  <div className="inline-notice error-notice" role="alert">
                    {refreshError} The displayed data has been kept.
                  </div>
                )}
                <div className="chart-section">
                  <div className="chart-heading">
                    <div>
                      <h3>Price history</h3>
                      <span
                        className={
                          periodChange === null ? '' : periodChange >= 0 ? 'positive' : 'negative'
                        }
                      >
                        {percent(periodChange)}
                        <small> over displayed period</small>
                      </span>
                    </div>
                    <div className="range-control" aria-label="Chart date range">
                      {(Object.keys(chartRanges) as ChartRange[]).map((value) => (
                        <button
                          key={value}
                          aria-pressed={range === value}
                          className={range === value ? 'active' : ''}
                          onClick={() => update({ range: value })}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                  <PriceChart
                    bars={data.historyLoaded ? bars : []}
                    currency={company.currency}
                    emptyMessage={
                      enrichment.isFetching
                        ? 'Loading price history… Saved closing prices remain available above.'
                        : 'Full history isn’t included in this saved catalogue. Refresh data to load the company’s price history.'
                    }
                  />
                </div>
                <dl className="metrics">
                  <div>
                    <dt>
                      <MetricLabel
                        label="Market cap"
                        explanation="The market value of the company’s outstanding equity. It helps compare company size; it does not tell you whether a stock is cheap. Profile data may update on a different schedule from prices."
                      />
                    </dt>
                    <dd>{compact(company.marketCap, company.currency)}</dd>
                  </div>
                  <div>
                    <dt>
                      <MetricLabel
                        label="Session volume"
                        explanation="Shares traded during the latest available session. Compare with the recent average to understand trading activity; volume alone does not explain why a price moved."
                      />
                    </dt>
                    <dd>
                      {compact(latest?.volume)}
                      {metrics.volumeMultiple !== null && metrics.volumeSessions >= 20 && (
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
                        explanation={`Highest traded price in the displayed ${rangeDays}-calendar-day window. This includes intraday highs, while the chart plots closing prices. It is not a forecast.`}
                      />
                    </dt>
                    <dd>
                      {money(data.historyLoaded ? metrics.periodHigh : null, company.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <MetricLabel
                        label={`${range} low`}
                        explanation={`Lowest traded price in the displayed ${rangeDays}-calendar-day window. This includes intraday lows, while the chart plots closing prices.`}
                      />
                    </dt>
                    <dd>
                      {money(data.historyLoaded ? metrics.periodLow : null, company.currency)}
                    </dd>
                  </div>
                </dl>

                <section className="about-company">
                  <div className="section-heading">
                    <h3>About {company.ticker}</h3>
                    {website && (
                      <a href={website} target="_blank" rel="noreferrer">
                        Company website <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <p className={expanded ? '' : 'description-clamped'}>
                    {company.description ??
                      (enrichment.isFetching
                        ? 'Loading company overview…'
                        : 'No saved company overview. Refresh data to retrieve it from Massive.')}
                  </p>
                  {company.description && company.description.length > 250 && (
                    <button
                      className="text-button"
                      onClick={() => setExpanded(!expanded)}
                      aria-expanded={expanded}
                    >
                      {expanded ? 'Show less' : 'Read company overview'}
                      <ChevronDown size={13} className={expanded ? 'flipped' : ''} />
                    </button>
                  )}
                </section>
                <section
                  className="company-overview-facts"
                  aria-label="Company facts"
                  key={`${company.ticker}-context`}
                >
                  <dl className="context-facts">
                    {company.sector !== 'Unclassified' && (
                      <div>
                        <dt>Sector</dt>
                        <dd>{company.sector}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Industry</dt>
                      <dd className="industry">
                        {company.industry?.toLowerCase() ?? 'Unavailable'}
                      </dd>
                    </div>
                    <div>
                      <dt>Employees</dt>
                      <dd>
                        {company.employees == null
                          ? 'Unavailable'
                          : new Intl.NumberFormat('en-US').format(company.employees)}
                      </dd>
                    </div>
                    <div>
                      <dt>Primary exchange</dt>
                      <dd>{company.exchange ?? 'Unavailable'}</dd>
                    </div>
                    <div>
                      <dt>Currency</dt>
                      <dd>{company.currency.toUpperCase()}</dd>
                    </div>
                  </dl>
                </section>
                <CompanyResearch ticker={company.ticker} key={`${company.ticker}-research`} />
              </div>
            </>
          ) : null}
        </section>
        {isWideWorkspace && portfolioPanel}
      </div>
    </main>
  );
}

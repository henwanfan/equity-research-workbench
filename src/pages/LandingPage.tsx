import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { getEquity } from '../api/equities';
import { barsForRange, summarize } from '../domain/equity';
import { compact, dateLabel, money, percent } from '../lib/format';
import { CompanyMark } from '../components/CompanyMark';
import { DataSource } from '../components/DataSource';
import { PriceChart } from '../components/PriceChart';

const previewCompanies = [
  { ticker: 'AAPL', label: 'Apple' },
  { ticker: 'MSFT', label: 'Microsoft' },
  { ticker: 'NVDA', label: 'NVIDIA' },
];
const ranges = { '1M': 30, '3M': 90, '1Y': 365 };
type Range = keyof typeof ranges;

export function LandingPage({ researchUrl }: { researchUrl: string }) {
  const [ticker, setTicker] = useState('AAPL');
  const [range, setRange] = useState<Range>('3M');
  const equity = useQuery({
    queryKey: ['equity', ticker],
    queryFn: ({ signal }) => getEquity(ticker, signal),
  });
  const company = equity.data?.company;
  const quote = company ? summarize(company) : null;
  const bars = useMemo(
    () => barsForRange(company?.bars ?? [], ranges[range]),
    [company?.bars, range],
  );
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
                    <CompanyMark ticker={ticker} large />
                    <div>
                      <h2>{company.name}</h2>
                      <span>
                        {ticker}
                        {company.sector ? ` · ${company.sector}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="preview-price-row">
                    <div className="preview-quote">
                      <strong>{money(quote.close, company.currency)}</strong>
                      <span
                        className={
                          quote.changePercent != null && quote.changePercent < 0
                            ? 'negative'
                            : 'positive'
                        }
                      >
                        {percent(quote.changePercent)}
                        <small>last session</small>
                      </span>
                    </div>
                    <div className="preview-ranges" role="group" aria-label="Preview chart period">
                      {(Object.keys(ranges) as Range[]).map((value) => (
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
                  <PriceChart bars={bars} currency={company.currency} />
                  <dl className="preview-facts">
                    <div>
                      <dt>Market cap</dt>
                      <dd>{compact(company.marketCap, company.currency)}</dd>
                    </div>
                    <div>
                      <dt>Session volume</dt>
                      <dd>{compact(quote.volume)}</dd>
                    </div>
                  </dl>
                  <div className="preview-provenance">
                    <span>
                      {quote.date ? `Close · ${dateLabel(quote.date)}` : 'Closing date unavailable'}
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

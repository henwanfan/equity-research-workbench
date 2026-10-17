import { useRef } from 'react';
import { Bookmark, X } from 'lucide-react';
import { usePortfolio } from '../state/PortfolioProvider';
import type { EquitySummary } from '../domain/equity';
import { CompanyMark } from './CompanyMark';
import { dateLabel, money, percent } from '../lib/format';

export function ResearchPortfolio({
  equities,
  selectedTicker,
  date,
  loading,
  error,
  onSelect,
}: {
  equities: EquitySummary[];
  selectedTicker: string;
  date?: string;
  loading: boolean;
  error: boolean;
  onSelect: (ticker: string) => void;
}) {
  const { tickers, remove, persistenceError } = usePortfolio();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const byTicker = new Map(equities.map((equity) => [equity.ticker, equity]));
  const saved = tickers.map((ticker) => ({ ticker, equity: byTicker.get(ticker) }));
  const up = saved.filter(
    ({ equity }) => equity?.changePercent != null && equity.changePercent > 0,
  ).length;
  const down = saved.filter(
    ({ equity }) => equity?.changePercent != null && equity.changePercent < 0,
  ).length;
  return (
    <section className="research-portfolio" aria-labelledby="portfolio-heading">
      <div className="section-heading">
        <h2 id="portfolio-heading" ref={headingRef} tabIndex={-1}>
          Research portfolio
        </h2>
        <span className="count">{tickers.length}</span>
      </div>
      {persistenceError && (
        <p className="portfolio-warning" role="alert">
          {persistenceError}
        </p>
      )}
      {tickers.length === 0 ? (
        <div className="portfolio-empty">
          <Bookmark size={22} aria-hidden="true" />
          <p>Keep companies you want to research.</p>
          <span>Choose a company, then add it to your portfolio.</span>
        </div>
      ) : (
        <>
          <div className="portfolio-session">
            <span>Close / daily change</span>
            {!loading && !error && (
              <span>
                {up} up · {down} down
              </span>
            )}
          </div>
          {loading && (
            <p className="portfolio-loading" role="status">
              Loading saved-company prices…
            </p>
          )}
          {error && (
            <p className="portfolio-warning">
              Prices are unavailable. Your saved companies are still here.
            </p>
          )}
          <ul className="portfolio-list">
            {saved.map(({ ticker, equity }) => (
              <li key={ticker} className={ticker === selectedTicker ? 'portfolio-selected' : ''}>
                <button
                  className="portfolio-company"
                  onClick={() => onSelect(ticker)}
                  aria-pressed={ticker === selectedTicker}
                  aria-label={`Research ${equity?.name ?? ticker}`}
                >
                  <CompanyMark ticker={ticker} />
                  <span className="portfolio-identity">
                    <strong>{ticker}</strong>
                    <span>
                      {equity?.name ?? (loading ? 'Loading company…' : 'Not in current catalogue')}
                    </span>
                  </span>
                  <span className="portfolio-price">
                    <strong>{money(equity?.close)}</strong>
                    <span
                      className={
                        equity?.changePercent == null
                          ? ''
                          : equity.changePercent >= 0
                            ? 'positive'
                            : 'negative'
                      }
                    >
                      {percent(equity?.changePercent ?? null)}
                    </span>
                  </span>
                </button>
                <button
                  className="portfolio-remove"
                  onClick={(event) => {
                    const row = event.currentTarget.closest('li');
                    const next =
                      row?.nextElementSibling?.querySelector<HTMLButtonElement>(
                        '.portfolio-company',
                      ) ??
                      row?.previousElementSibling?.querySelector<HTMLButtonElement>(
                        '.portfolio-company',
                      );
                    remove(ticker);
                    if (event.detail === 0) (next ?? headingRef.current)?.focus();
                  }}
                  aria-label={`Remove ${ticker} from portfolio`}
                  title={`Remove ${ticker}`}
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          {date && <p className="portfolio-date">Closes · {dateLabel(date)}</p>}
        </>
      )}
    </section>
  );
}

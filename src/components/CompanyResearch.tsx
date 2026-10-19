import { useRetryCountdown } from '../state/useCompanyHistory';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, RefreshCw, FileText, Newspaper } from 'lucide-react';
import { getResearch } from '../api/equities';
import { filingLabels } from '../domain/research';
import type { ResearchKind, CompanyFiling, NewsArticle } from '../domain/research';
import { SelectControl } from './SelectControl';
import { dateLabel, dateTimeLabel } from '../lib/format';

function NewsList({ items }: { items: NewsArticle[] }) {
  return (
    <ul className="research-list news-list">
      {items.map((article) => (
        <li key={article.id}>
          <div className="research-item-meta">
            <span>{article.publisher}</span>
            <time
              dateTime={article.publishedAt}
              title={new Date(article.publishedAt).toUTCString()}
            >
              {dateTimeLabel(article.publishedAt)}
            </time>
          </div>
          <a href={article.url} target="_blank" rel="noreferrer">
            {article.title}
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          {article.description && <p className="article-description">{article.description}</p>}
        </li>
      ))}
    </ul>
  );
}

function FilingList({ items }: { items: CompanyFiling[] }) {
  return (
    <ul className="research-list filings-list">
      {items.map((filing) => (
        <li key={filing.id}>
          <a href={filing.url} target="_blank" rel="noreferrer">
            <span className="filing-form">{filing.form}</span>
            <span>
              <strong>{filingLabels[filing.form]}</strong>
              <small>
                Filed <time dateTime={filing.filedAt}>{dateLabel(filing.filedAt)}</time> · SEC EDGAR
              </small>
            </span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function CompanyResearch({ ticker }: { ticker: string }) {
  const [kind, setKind] = useState<ResearchKind>('news');
  const [publisher, setPublisher] = useState('All publishers');
  const [visibleCount, setVisibleCount] = useState(3);
  const client = useQueryClient();
  const research = useQuery({
    queryKey: ['research', ticker, kind],
    queryFn: ({ signal }) => getResearch(ticker, kind, false, signal),
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
  const refresh = useMutation({
    mutationFn: (requestedKind: ResearchKind) => getResearch(ticker, requestedKind, true),
    onSuccess: (data, requestedKind) =>
      client.setQueryData(['research', ticker, requestedKind], data),
  });
  const retrySeconds = useRetryCountdown(refresh.error);
  const data = research.data;
  const items = data?.items;
  const allNews = kind === 'news' ? ((items ?? []) as NewsArticle[]) : [];
  const publishers = [...new Set(allNews.map((article) => article.publisher))].sort();
  const selectedPublisher = publishers.includes(publisher) ? publisher : 'All publishers';
  const matchingNews = allNews.filter(
    (article) => selectedPublisher === 'All publishers' || article.publisher === selectedPublisher,
  );
  const visibleNews = matchingNews.slice(0, visibleCount);
  const isRefreshing = refresh.isPending && refresh.variables === kind;
  const error =
    refresh.isError && refresh.variables === kind
      ? refresh.error.message
      : research.isError
        ? research.error.message
        : null;
  const load = () => refresh.mutate(kind);
  return (
    <section className="company-research" aria-labelledby={`research-${ticker}`}>
      <div className="research-heading">
        <h3 id={`research-${ticker}`}>Research</h3>
        <div className="research-views" role="group" aria-label="Research content">
          <button aria-pressed={kind === 'news'} onClick={() => setKind('news')}>
            <Newspaper size={14} aria-hidden="true" />
            News
          </button>
          <button aria-pressed={kind === 'filings'} onClick={() => setKind('filings')}>
            <FileText size={14} aria-hidden="true" />
            SEC filings
          </button>
        </div>
      </div>
      {kind === 'news' && publishers.length > 0 && (
        <div className="research-news-controls">
          <SelectControl
            label="Filter news by publisher"
            value={selectedPublisher}
            onValueChange={(value) => {
              setPublisher(value);
              setVisibleCount(3);
            }}
            icon={Newspaper}
            options={['All publishers', ...publishers].map((value) => ({ value, label: value }))}
          />
          <span>
            {visibleNews.length} of {matchingNews.length} articles
          </span>
        </div>
      )}
      <div className="research-body" aria-busy={research.isPending || isRefreshing}>
        {research.isPending && (
          <p className="research-status" role="status">
            Loading {kind === 'news' ? 'news' : 'filings'}…
          </p>
        )}
        {error && (
          <div className="research-error" role="alert">
            <p>{error}</p>
            <button
              className="text-button"
              disabled={refresh.isPending || retrySeconds > 0}
              onClick={() => (research.isError ? void research.refetch() : load())}
            >
              {retrySeconds > 0 ? `Try again in ${retrySeconds}s` : 'Try again'}
            </button>
          </div>
        )}
        {items &&
          items.length > 0 &&
          (kind === 'news' ? (
            <NewsList items={visibleNews} />
          ) : (
            <FilingList items={items as CompanyFiling[]} />
          ))}
        {kind === 'news' && matchingNews.length > 3 && (
          <div className="research-pagination">
            {visibleCount < matchingNews.length && (
              <button className="text-button" onClick={() => setVisibleCount((count) => count + 3)}>
                Show more articles
              </button>
            )}
            {visibleCount > 3 && (
              <button className="text-button" onClick={() => setVisibleCount(3)}>
                Show fewer
              </button>
            )}
          </div>
        )}
        {!research.isPending && !error && items?.length === 0 && (
          <p className="research-status">
            {kind === 'news'
              ? `No matching articles were returned for ${ticker}.`
              : 'No annual, quarterly, or material event reports were found in the latest 250 filings.'}
          </p>
        )}
        {!research.isPending && !error && items == null && (
          <div className="research-empty">
            <p>
              {data?.canRefresh
                ? kind === 'news'
                  ? `Find recent articles mentioning ${ticker}.`
                  : `Find ${ticker}’s latest annual, quarterly, and material event reports.`
                : `Research isn’t available for ${ticker} in this offline demo.`}
            </p>
            {data?.canRefresh && (
              <button
                className="secondary-button"
                onClick={load}
                disabled={refresh.isPending || retrySeconds > 0}
              >
                {retrySeconds > 0
                  ? `Try again in ${retrySeconds}s`
                  : isRefreshing
                    ? 'Loading…'
                    : `Load ${kind === 'news' ? 'news' : 'filings'}`}
              </button>
            )}
          </div>
        )}
        {isRefreshing && (
          <p className="research-status" role="status">
            {items
              ? 'Updating research. Existing results remain available.'
              : 'Retrieving research from Massive…'}
          </p>
        )}
      </div>
      {items && (
        <div className="research-footer">
          <p>
            {data.source === 'snapshot' ? 'Saved' : 'Retrieved'}{' '}
            {data.capturedAt ? dateTimeLabel(data.capturedAt) : ''} · via Massive
          </p>
          <button
            className="text-button"
            onClick={load}
            disabled={refresh.isPending || retrySeconds > 0 || !data.canRefresh}
          >
            <RefreshCw size={12} className={isRefreshing ? 'rotating' : ''} aria-hidden="true" />
            {retrySeconds > 0
              ? `Try again in ${retrySeconds}s`
              : isRefreshing
                ? 'Updating…'
                : `Refresh ${kind === 'news' ? 'news' : 'filings'}`}
          </button>
        </div>
      )}
    </section>
  );
}

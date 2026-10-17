export type ResearchKind = 'news' | 'filings';

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt: string;
  description: string | null;
}

export interface CompanyFiling {
  id: string;
  form: '10-K' | '10-Q' | '8-K';
  filedAt: string;
  url: string;
}

export interface ResearchItems {
  news: NewsArticle[];
  filings: CompanyFiling[];
}

export interface ResearchResponse<K extends ResearchKind> {
  ticker: string;
  items: ResearchItems[K] | null;
  source: 'snapshot' | 'api' | null;
  capturedAt: string | null;
  canRefresh: boolean;
}

export const filingLabels = {
  '10-K': 'Annual report',
  '10-Q': 'Quarterly report',
  '8-K': 'Material event report',
} as const;

import { MarketPriceService } from './market-prices.ts';
import { getCompanyResearch } from './research-data.ts';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import type { Company, EquityResponse } from '../src/domain/equity.ts';
import { summarize, mergeClosingPrices } from '../src/domain/equity.ts';
import {
  historyEndDate,
  massiveRequests,
  massiveResponse,
  parseCompany,
  ProviderError,
} from './massive.ts';

const snapshot = JSON.parse(
  readFileSync(new URL('../data/market-snapshot.json', import.meta.url), 'utf8'),
) as { capturedAt: string; companies: Company[] };
const cataloguePath = new URL('../data/equity-catalogue.json', import.meta.url);
const catalogue = existsSync(cataloguePath)
  ? (JSON.parse(readFileSync(cataloguePath, 'utf8')) as {
      capturedAt: string;
      date: string;
      companies: Pick<Company, 'ticker' | 'name' | 'exchange' | 'currency' | 'sector' | 'bars'>[];
    })
  : {
      capturedAt: snapshot.capturedAt,
      date: snapshot.companies[0]?.bars.at(-1)?.date ?? '',
      companies: snapshot.companies,
    };
const savedCompanies = new Map(snapshot.companies.map((company) => [company.ticker, company]));
const companies = new Map<string, Company>(
  catalogue.companies.map((company) => [
    company.ticker,
    {
      description: null,
      marketCap: null,
      employees: null,
      website: null,
      industry: null,
      ...company,
    },
  ]),
);
for (const [ticker, company] of savedCompanies) companies.set(ticker, company);
const liveCache = new Map<string, { response: EquityResponse; expiresAt: number }>();
const pending = new Map<string, Promise<EquityResponse>>();
const logoSources = new Map<string, string>();
const logoCache = new Map<string, { bytes: Buffer; contentType: string }>();

const marketPrices = new MarketPriceService(massiveRequests);
function withMarketPrices(response: EquityResponse): EquityResponse {
  const market = marketPrices.read();
  const prices = market?.prices[response.company.ticker];
  return market && prices ? mergeClosingPrices(response, prices, market.capturedAt) : response;
}
function catalogueResponse(apiKey: string) {
  const market = marketPrices.read();
  return {
    equities: catalogue.companies.map(({ ticker }) => {
      const cached = liveCache.get(ticker);
      return summarize(
        withMarketPrices(
          cached && cached.expiresAt > Date.now()
            ? cached.response
            : {
                company: companies.get(ticker)!,
                capturedAt: catalogue.capturedAt,
                source: 'snapshot',
                historyLoaded: savedCompanies.has(ticker),
              },
        ).company,
      );
    }),
    capturedAt: market?.capturedAt ?? catalogue.capturedAt,
    date: market?.date ?? catalogue.date,
    canRefresh: Boolean(apiKey),
    closingPricesRefreshedAt: market?.capturedAt,
  };
}

async function refreshCompany(
  seed: Company,
  apiKey: string,
  force = false,
): Promise<EquityResponse> {
  const cached = liveCache.get(seed.ticker);
  if (!force && cached && cached.expiresAt > Date.now()) return cached.response;
  const existing = pending.get(seed.ticker);
  if (existing) return existing;
  if (pending.size >= 2)
    throw new ProviderError(
      'Two companies are already refreshing. Try again after they finish.',
      429,
    );

  const request = (async () => {
    // Never present an unfinished current-session bar as a closing price.
    const to = historyEndDate();
    const fromDate = new Date(`${to}T12:00:00Z`);
    fromDate.setUTCDate(fromDate.getUTCDate() - 380);
    const from = fromDate.toISOString().slice(0, 10);
    const [details, bars] = await massiveRequests(
      [
        `/v3/reference/tickers/${seed.ticker}`,
        `/v2/aggs/ticker/${seed.ticker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=400`,
      ],
      apiKey,
    );
    if (
      !details!.results ||
      typeof details!.results !== 'object' ||
      Array.isArray(details!.results)
    )
      throw new ProviderError(
        'Company details are unavailable. Your saved data is still available.',
        502,
      );
    const company = parseCompany(details!.results as Record<string, unknown>, bars!.results, seed);
    if (!company.bars.length)
      throw new ProviderError('Price history is unavailable. Saved prices remain available.', 502);
    const response: EquityResponse = {
      company,
      capturedAt: new Date().toISOString(),
      source: 'api',
      historyLoaded: true,
    };
    const branding = (details!.results as { branding?: { icon_url?: unknown } }).branding;
    if (
      typeof branding?.icon_url === 'string' &&
      branding.icon_url.startsWith('https://api.massive.com/v1/reference/company-branding/')
    ) {
      const source = new URL(branding.icon_url);
      logoSources.set(seed.ticker, source.pathname);
      response.company.logoUrl = `/api/company-logos/${seed.ticker}`;
    }
    liveCache.set(seed.ticker, { response, expiresAt: Date.now() + 60 * 60 * 1000 });
    return response;
  })();
  pending.set(seed.ticker, request);
  try {
    return await request;
  } finally {
    pending.delete(seed.ticker);
  }
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  apiKey: string,
): Promise<void> {
  const send = (status: number, body: unknown) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(body));
  };
  if (req.method !== 'GET') {
    send(405, { error: 'Only GET requests are supported.' });
    return;
  }
  const url = new URL(req.url ?? '/', 'http://localhost');
  const logoMatch = url.pathname.match(/^\/api\/company-logos\/([A-Z][A-Z0-9.]{0,9})$/);
  if (logoMatch) {
    const ticker = logoMatch[1]!;
    const path = logoSources.get(ticker);
    if (!path || !apiKey) {
      send(404, { error: 'Company logo unavailable.' });
      return;
    }
    try {
      let logo = logoCache.get(ticker);
      if (!logo) {
        const response = await massiveResponse(path, apiKey);
        const contentType = response.headers.get('content-type')?.split(';')[0] ?? '';
        if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(contentType))
          throw new Error('Unsupported image');
        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length > 2_000_000) throw new Error('Image too large');
        logo = { bytes, contentType };
        logoCache.set(ticker, logo);
      }
      res.writeHead(200, {
        'Content-Type': logo.contentType,
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(logo.bytes);
    } catch {
      send(502, { error: 'Company logo unavailable.' });
    }
    return;
  }
  if (url.pathname === '/api/equities') {
    try {
      if (url.searchParams.get('refresh') === 'true') {
        const market = await marketPrices.refresh(apiKey);
        const prices = Object.fromEntries(
          Object.entries(market.prices).filter(([ticker]) => companies.has(ticker)),
        );
        send(200, {
          catalogue: catalogueResponse(apiKey),
          prices,
          updated: Object.keys(prices).length,
        });
      } else send(200, catalogueResponse(apiKey));
    } catch (error) {
      send(error instanceof ProviderError ? error.status : 500, {
        error:
          error instanceof ProviderError
            ? error.message
            : 'Closing prices could not be refreshed. Existing prices have been kept.',
      });
    }
    return;
  }
  const researchMatch = url.pathname.match(
    /^\/api\/equities\/([A-Z][A-Z0-9.]{0,9})\/(news|filings)$/,
  );
  if (researchMatch) {
    const ticker = researchMatch[1]!;
    if (!companies.has(ticker)) {
      send(404, { error: 'This company is not in the research collection.' });
      return;
    }
    try {
      send(
        200,
        await getCompanyResearch(
          ticker,
          researchMatch[2] as 'news' | 'filings',
          url.searchParams.get('refresh') === 'true',
          apiKey,
          companies.get(ticker)!.name,
        ),
      );
    } catch (error) {
      send(error instanceof ProviderError ? error.status : 500, {
        error:
          error instanceof ProviderError
            ? error.message
            : 'Research could not be loaded. Please try again.',
      });
    }
    return;
  }
  const match = url.pathname.match(/^\/api\/equities\/([A-Z][A-Z0-9.]{0,9})$/);
  const company = match ? companies.get(match[1]!) : undefined;
  if (!company) {
    send(404, { error: 'This company is not in the research collection.' });
    return;
  }
  try {
    if (url.searchParams.get('refresh') === 'true') {
      if (!apiKey)
        throw new ProviderError(
          'Add MASSIVE_API_KEY to the server environment to refresh. Saved data is available without a key.',
          503,
        );
      send(
        200,
        withMarketPrices(
          await refreshCompany(company, apiKey, url.searchParams.get('force') === 'true'),
        ),
      );
    } else {
      const cached = liveCache.get(company.ticker);
      const response: EquityResponse =
        cached && cached.expiresAt > Date.now()
          ? cached.response
          : {
              company,
              capturedAt: savedCompanies.has(company.ticker)
                ? snapshot.capturedAt
                : catalogue.capturedAt,
              source: 'snapshot',
              historyLoaded: savedCompanies.has(company.ticker),
            };
      send(200, { ...withMarketPrices(response), canRefresh: Boolean(apiKey) });
    }
  } catch (error) {
    send(error instanceof ProviderError ? error.status : 500, {
      error:
        error instanceof ProviderError
          ? error.message
          : 'The company could not be loaded. Please try again.',
    });
  }
}

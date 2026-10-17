# Equity Research Workbench

A React and TypeScript workspace for exploring companies and organizing equity research.

## Current milestone

Company discovery and inspection are implemented: 5,186 US common stocks, company/ticker search, exchange filtering, featured/name/activity/change sorting, company information, a daily closing-price chart, and explicit refresh from Massive. Custom Radix dropdowns support keyboard navigation; `/` focuses search. Company changes use a short transition that respects reduced-motion preferences. Charts support pointer and keyboard inspection with dated price/period-change tooltips and a starting-price reference. The light landing page introduces the product in a single-screen desktop hero with a large interactive Apple/Microsoft/NVIDIA research preview. Narrow layouts can scroll to preserve usable controls. A Research section adds independently loaded company news and SEC filings. The persistent research portfolio supports add/remove, company navigation, reload persistence, and cross-tab updates. The core two-page workflow is implemented; final submission preparation remains.

## Run locally

Use Node.js 24 LTS (`nvm use` if you use nvm).

```sh
npm ci
npm run dev
```

Open the printed URL and choose **Open the workbench**, or go directly to `/research`. The saved dataset works without credentials.

To enable upstream refresh, copy `.env.example` to `.env.local`, replace the placeholder with your Massive key, and restart the development server. The key is read on the server only. Never put it in a `VITE_*` variable or commit it.

```sh
npm test
npm run build
npm run preview
npm run format:check
```

`build` runs strict TypeScript checking before creating the production client. `preview` serves that build together with the local API middleware. A plain static host cannot serve the `/api` endpoints; a production deployment needs a server adapter. The current milestone is intended for local review.

## Product and design decisions

- The portfolio is interpreted as a research collection, not a brokerage account. Holdings, transactions, and investment returns are outside the intended scope.
- Discovery, price evidence, and business context sit beside one another. The supplied screener references informed compact rows and tabular prices; the research-terminal reference informed company information hierarchy.
- One UI typeface (locally bundled Manrope), a blue selection color, fine dividers, selected-row tint and accessible pressed state, and semantic red/green changes keep the working surface restrained. Percentages include signs so color is not the only signal.
- Company details use the full content width. The business overview and compact facts sit above Research; small screens stack discovery above details and reflow facts into two columns.

## State and architecture

- **Server data:** TanStack Query caches the catalogue and company results for five minutes. Queries are keyed by ticker and receive an abort signal; changing companies cannot put the previous response under the new heading. Focus changes do not trigger upstream refreshes.
- **Discovery order:** Featured defaults to a curated set of 30 recognizable companies, followed by the rest ranked by saved session share volume. Section headings make that boundary explicit; this is an editorial starting point, not an investment recommendation or market-cap ranking. Most active, Name A–Z, and Daily change offer explicit alternative orders, with ticker tie-breaking.
- **Navigation state:** `q`, `exchange`, `sort`, `ticker`, `range`, and list `page` live in URL query parameters. Typing replaces the current entry; selecting companies and filters creates navigation entries. The overview-to-workbench links remember the last research URL while the app is open.
- **Motion:** the preview has a short entrance and company-change transition that respect reduced-motion preferences. Price interpolation animation is disabled to keep the data stable during inspection.
- **Portfolio state:** an app-level React context sits above both routes. Only an ordered, versioned ticker list is stored in localStorage (`equity-research:portfolio:v1`); prices, full company objects, and query results are not persisted there. New saves appear first; duplicates are removed on read. Stored format/tickers are validated before use. Corrupt or inaccessible storage produces a visible warning, and interactions remain usable in memory. Storage events synchronize open tabs; simultaneous edits use the browser's last-write behavior rather than a merge service. Saved state is local to the current browser/origin, with no login or cloud sync.
- **Portfolio context:** on screens at least 1,280px wide, the collection has a compact right column beside company research, keeping discovery independent of saved-list length. Below that width, a collapsed portfolio section above the workspace preserves room for the chart; users can expand it to inspect or remove saved companies. Rows show dated catalogue closes/daily changes and open the saved company while retaining search/filter/range state. A separate remove button and the selected-company bookmark toggle both update the same state. The rise/fall counts compare saved companies' individual daily moves; they are not a portfolio return. There are no quantities, weights, invented account balances, or profit/loss. Unavailable quotes do not erase saved tickers. Keyboard removal moves focus to another saved entry or the portfolio heading.
- **Transient state:** expanded descriptions and news expansion stay inside the research view.
- **Provider boundary:** `server/massive.ts` validates and normalizes provider fields; components use readable company/bar types from `src/domain/equity.ts`. The server sends normalized data and never forwards credentials.
- **Scope:** discovery covers the 5,186-stock saved catalogue. Search, exchange filtering, and sorting run locally without upstream requests. Eight companies have saved full profiles/history; others load through the server on demand. Broad sectors for the eight saved companies are curated, not inferred from Massive's SIC industry descriptions.
- All 30 featured companies have locally served logos: eight from Massive company branding and 22 from Financial Modeling Prep’s company-logo endpoint. Only imagery comes from FMP; all market data comes from Massive. `public/company-logos/sources.json` records provider URLs without credentials. Newly researched companies can retrieve a provider logo through a server-side image proxy; the API key never reaches the image URL. Failed or unavailable images fall back to a ticker initial. Logos identify companies and do not imply affiliation.
- **Landing preview:** both routes use the same API functions, query keys, cached company responses, domain calculations, and interactive `PriceChart` component. Company choices and chart periods open the selected ticker/range directly in research. Both routes share the 1W/1M/3M/1Y periods and period-change calculation. The preview also shows period high/low, session-volume context, metric explanations, and a bookmark backed by the same persistent portfolio. Shared styling and navigation keep the entry connected to the workbench. Routes load separately, and Vite shares the chart code between them.

## Company research

The Research section has News and SEC filings views. Each uses its own ticker-keyed TanStack Query entry and server resource; reading saved research never contacts Massive. Other companies have an explicit Load action. Refresh updates only the selected resource. Existing results remain visible while loading or after a failed refresh. Successful results are cached in server memory until refreshed or restarted, with client freshness of one hour. This avoids fetching several extra endpoints on each company selection under the shared five-request budget.

`data/research-snapshot.json` contains normalized real responses captured on October 17, 2026 UTC (October 16 Pacific time) for AAPL, MSFT, and NVDA. It includes up to 50 recent articles per company, with three displayed initially, Show more revealing additional loaded articles, and a local publisher filter, plus the latest available 10-K, 10-Q, and 8-K in each company's most recent 250 filing records. Other company research can be loaded with the configured server key. An unloaded resource is distinct from a successful empty result; missing results are never invented.

The publisher filter uses actual returned publishers and makes no additional API requests. Available publishers are not presented as an independent consensus. News publication and retrieval timestamps include the New York time zone. Headlines naming the selected company or ticker are prioritized among the latest 50 fetched articles, with newest-first order within each group. News articles are associated with the selected ticker by the provider and may discuss several companies or express publisher opinions. The interface shows publisher, publication date, provider description, and an original article link. It does not claim that an article caused a price movement or supply an investment recommendation. Article dates can be later than the saved closing-price date; both are displayed separately.

Filings link directly to SEC EDGAR originals, with form labels and filing dates. 10-K is an annual report, 10-Q a quarterly report, and 8-K a material event report. We deliberately exclude routine ownership filings and amendments in this compact view. A missing report means it wasn't found in the fetched records, not that the company has never filed one. Massive's filings endpoint is an early-access beta: access and behavior can change. During verification, multi-value filters were ignored, so the app requests one ticker, checks returned ticker identity, filters form types locally, and selects the latest report per supported type.

All research passes through the existing server-only credential boundary, timeout, and request budget. News URLs require HTTPS; filing URLs must point to SEC archive documents. Invalid records and duplicate articles are removed. Unsupported payloads and wrong-company responses produce errors without overwriting cached results. Original source links open in a separate tab.

## Data provenance and freshness

`data/market-snapshot.json` contains real normalized Massive responses captured on October 16, 2026. It contains eight company profiles plus 262 daily bars per company, requested for October 1, 2025 through October 15, 2026. `data/equity-catalogue.json` joins the active US common-stock ticker reference pages with grouped daily market summaries for October 14 and 15, 2026. The active reference list contained 5,322 records; 5,186 had a matching latest daily bar and supported ticker format. It is saved data, not generated market values. The retrieval timestamps are recorded in the files. The selected price shows its date and saved/live origin; a compact Data popover holds provider and retrieval details. This replaces repetitive banners and footer labels.

Upstream endpoints:

- `GET /v3/reference/tickers?market=stocks&locale=us&type=CS&active=true` — paginated company catalogue.
- `GET /v2/aggs/grouped/locale/us/market/stocks/{date}` — closing price/volume for the universe in one call.
- `GET /v2/reference/news?ticker={ticker}` — ticker-associated news and publisher metadata.
- `GET /stocks/filings/vX/index?ticker={ticker}` — recent SEC filing records (beta).
- `GET /v3/reference/tickers/{ticker}` — company profile and optional metrics.
- `GET /v2/aggs/ticker/{ticker}/range/1/day/{from}/{to}` — split-adjusted daily bars.

Reference pages are fetched in batches of up to 1,000. Grouped bars avoid one price request per company. Snapshots are saved deliberately for deterministic review; they are not advertised as a continuously updated market feed.

**Refresh data** requests company details and roughly 380 calendar days of bars through the prior New York calendar day. Excluding the current date avoids presenting an unfinished session as a closing price. Weekends/holidays may mean the latest available session is earlier. The API response's dates determine chart and metric labels.

Company selection returns saved prices immediately. For companies without saved full history, a separate background request loads the profile and chart. A rolling five-request-per-minute budget reserves both upstream calls atomically and runs profile/history requests concurrently. Exhausted quota returns a retry message immediately instead of queuing. Provider requests time out after 12 seconds; the client has a 15-second request bound. Concurrent refreshes for the same company share work; successful background loads are cached in memory for one hour. Explicit Refresh data bypasses the freshness cache. At most two distinct companies may be pending. Failures are not automatically retried, and the UI retains the displayed data with an actionable error. This limiter covers one server process; other users or applications sharing the key can still consume its quota.

The discovery list always shows the saved snapshot. A refreshed detail pane can therefore have a different date or price, with its own provenance label. Server cache is cleared on restart. There is no persistent API cache in this milestone.

Discovery-row daily change compares the last two available closes, not open versus close. The percentage beside the selected company’s main price follows the chart window and carries a 1W/1M/3M/1Y label. It compares the first and last displayed closes. Show fewer companies resets the visible catalogue to 25 rows while preserving the selected company and filters. Metric explanations clarify market cap (company size), session volume relative to the available last 20 trading sessions (activity), and high/low over the selected chart window (recent range). None is presented as a valuation or buy signal. Chart return compares the first and last displayed closes and excludes dividends. The `1W`/`1M`/`3M`/`1Y` controls use 7/30/90/365 calendar-day windows relative to the latest available bar. Missing numbers remain unavailable and display as an em dash. Company-profile metrics and price bars can have different provider update schedules.

## Validation

Research checks cover provenance, offline reading, explicit loading, ticker isolation, safe source URLs, latest-form selection, empty results, and retention after refresh failures. Automated checks also verify atomic quota reservation and immediate saved-data responses with a configured API key. Checks cover consecutive trading-session calculations, absent/zero prior prices, chart range boundaries, New York dates, provider normalization, missing company metrics, and the local API's saved-data, credential-error, unknown-company, and method handling.

Portfolio checks cover versioned serialization, corrupted/incompatible storage, duplicate handling, and add/remove ordering. Browser verification covers add/remove through the heading and saved list, navigation, reload persistence, cross-tab updates, and narrow layouts. Browser checks also cover keyboard company/period selection on the landing, its matching quote/chart/source details, and direct navigation into the selected research view, name search, no matches and reset, exchange filtering, sorting, company selection, chart ranges, navigation away and back, reload persistence, and a real server-side refresh. Desktop, narrow app-panel, and mobile layouts are inspected before commit approval.

## Remaining work and limitations

- Research notes are optional future work; persistent portfolio membership is implemented.
- Prepare a deployment adapter or a short recording.
- Complete a final keyboard/accessibility pass and integration checks across the finished workflow.
- Record actual time spent, final cuts, and priorities for another four hours before submission.
- The catalogue is a dated active-common-stock universe, not a Fortune 500 or S&P 500 membership list. It excludes ETFs, OTC listings, unsupported ticker formats, and companies without a matching daily bar. Company details and imagery still depend on API entitlements and request limits.
- The catalogue is about 1.6 MB of uncompressed server-side JSON. Larger production datasets would move to server-side search/pagination with transport compression.
- Intraday `1D` charts are intentionally excluded. This milestone uses completed daily bars, not a live trading feed.

## Research references

The choice to show company context alongside price activity follows [FINRA’s stock due-diligence guide](https://syndication.finra.org/content/stock-investing-and-due-diligence). The distinction between market value and valuation is informed by [FINRA’s explanation of investment value](https://syndication.finra.org/content/defining-value-investment). The [SEC’s 10-K guide](https://www.investor.gov/introduction-investing/getting-started/researching-investments/how-read-10-k) informed the distinction between price context and business risks/audited financial statements. Earnings ratios and financial statements are not implemented or fabricated.

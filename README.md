# Equity Research Workbench

A React and TypeScript workspace for exploring companies and organizing equity research.

## Current milestone

Company discovery and inspection are implemented: 5,186 US common stocks, company/ticker search, exchange filtering, featured/name/activity/change sorting, company information, a daily closing-price chart, and explicit refresh from Massive. Custom Radix dropdowns support keyboard navigation; `/` focuses search. Company changes use a short transition that respects reduced-motion preferences. The finished marketing page, saved portfolio, and research notes are the next milestones. This is not the final submission.

## Run locally

Use Node.js 24 LTS (`nvm use` if you use nvm).

```sh
npm ci
npm run dev
```

Open the printed URL and choose **Open research workbench**, or go directly to `/research`. The saved dataset works without credentials.

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
- One UI typeface (locally bundled Manrope), a blue selection color, fine dividers, selected-row tint/checkmarks, and semantic red/green changes keep the working surface restrained. Percentages include signs so color is not the only signal.
- On small screens, discovery sits above details and company context moves below them.

## State and architecture

- **Server data:** TanStack Query caches the catalogue and company results for five minutes. Queries are keyed by ticker and receive an abort signal; changing companies cannot put the previous response under the new heading. Focus changes do not trigger upstream refreshes.
- **Navigation state:** `q`, `exchange`, `sort`, `ticker`, `range`, and list `page` live in URL query parameters. Typing replaces the current entry; selecting companies and filters creates navigation entries. The overview-to-workbench links remember the last research URL while the app is open.
- **Transient state:** expanded descriptions stay inside the research view. The portfolio state will be added in its own milestone.
- **Provider boundary:** `server/massive.ts` validates and normalizes provider fields; components use readable company/bar types from `src/domain/equity.ts`. The server sends normalized data and never forwards credentials.
- **Scope:** the company universe is deliberately limited to AAPL, MSFT, NVDA, AMZN, GOOGL, META, JPM, and XOM. Search and sector filtering run locally and make no API calls. Sectors are curated broad categories, not inferred from Massive's SIC classifications.
- Company icons are downloaded from Massive company-branding responses and served locally. `public/company-logos/sources.json` records provider URLs without credentials. Newly researched companies can retrieve a provider logo through a server-side image proxy; the API key never reaches the image URL. Failed or unavailable images fall back to a ticker initial. Logos identify companies and do not imply affiliation.
- The research route is loaded separately so the entry page does not download chart code immediately.

## Data provenance and freshness

`data/market-snapshot.json` contains real normalized Massive responses captured on October 16, 2026. It contains eight company profiles plus 262 daily bars per company, requested for October 1, 2025 through October 15, 2026. `data/equity-catalogue.json` joins the active US common-stock ticker reference pages with grouped daily market summaries for October 14 and 15, 2026. The active reference list contained 5,322 records; 5,186 had a matching latest daily bar and supported ticker format. It is saved data, not generated market values. The retrieval timestamps are recorded in the files. The selected price shows its date and saved/live origin; a compact Data popover holds provider and retrieval details. This replaces repetitive banners and footer labels.

Upstream endpoints:

- `GET /v3/reference/tickers?market=stocks&locale=us&type=CS&active=true` — paginated company catalogue.
- `GET /v2/aggs/grouped/locale/us/market/stocks/{date}` — closing price/volume for the universe in one call.
- `GET /v3/reference/tickers/{ticker}` — company profile and optional metrics.
- `GET /v2/aggs/ticker/{ticker}/range/1/day/{from}/{to}` — split-adjusted daily bars.

Reference pages are fetched in batches of up to 1,000. Grouped bars avoid one price request per company. Snapshots are saved deliberately for deterministic review; they are not advertised as a continuously updated market feed.

**Refresh data** requests company details and roughly 380 calendar days of bars through the prior New York calendar day. Excluding the current date avoids presenting an unfinished session as a closing price. Weekends/holidays may mean the latest available session is earlier. The API response's dates determine chart and metric labels.

Server requests are spaced 13 seconds apart for the documented five-per-minute Basic tier. Concurrent refreshes for the same company share work; successful refreshes are cached in memory for one hour. At most two distinct companies may be pending. Failures are not automatically retried, and the UI retains the displayed data with an actionable error. This limiter covers one server process; other users or applications sharing the key can still consume its quota.

The discovery list always shows the saved snapshot. A refreshed detail pane can therefore have a different date or price, with its own provenance label. Server cache is cleared on restart. There is no persistent API cache in this milestone.

Daily change compares the last two available closes, not open versus close. Metric explanations clarify market cap (company size), session volume relative to the available last 20 trading sessions (activity), and high/low over 90 calendar days (recent range). None is presented as a valuation or buy signal. Chart return compares the first and last displayed closes and excludes dividends. The `1W`/`1M`/`3M`/`1Y` controls use 7/30/90/365 calendar-day windows relative to the latest available bar. Missing numbers remain unavailable and display as an em dash. Company-profile metrics and price bars can have different provider update schedules.

## Validation

Automated checks cover consecutive trading-session calculations, absent/zero prior prices, chart range boundaries, New York dates, provider normalization, missing company metrics, and the local API's saved-data, credential-error, unknown-company, and method handling.

Browser checks cover name search, no matches and reset, exchange filtering, sorting, company selection, chart ranges, navigation away and back, reload persistence, and a real server-side refresh. Desktop, narrow app-panel, and mobile layouts are inspected before commit approval.

## Remaining work and limitations

- Implement the final landing page using the shared data layer.
- Add portfolio persistence and company notes.
- Prepare a deployment adapter or a short recording.
- Complete a final keyboard/accessibility pass and integration checks across the finished workflow.
- Record actual time spent, final cuts, and priorities for another four hours before submission.
- The catalogue is a dated active-common-stock universe, not a Fortune 500 or S&P 500 membership list. It excludes ETFs, OTC listings, unsupported ticker formats, and companies without a matching daily bar. Company details and imagery still depend on API entitlements and request limits.
- The catalogue is about 1.6 MB of uncompressed server-side JSON. Larger production datasets would move to server-side search/pagination with transport compression.
- Intraday `1D` charts are intentionally excluded. This milestone uses completed daily bars, not a live trading feed.

## Research references

The choice to show company context alongside price activity follows [FINRA’s stock due-diligence guide](https://syndication.finra.org/content/stock-investing-and-due-diligence). The distinction between market value and valuation is informed by [FINRA’s explanation of investment value](https://syndication.finra.org/content/defining-value-investment). A link to [the SEC’s 10-K guide](https://www.investor.gov/introduction-investing/getting-started/researching-investments/how-read-10-k) points users toward business risks and audited financial statements. Earnings ratios and financial statements are not implemented or fabricated.

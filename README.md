# Equity Research Workbench

A two-page React and TypeScript app for exploring US equities and saving companies to a research portfolio.
The landing page previews the same data and chart used in the workbench.

## Run locally

Use Node.js 24.

```sh
npm ci
npm run dev
```

Open the URL printed in the terminal, usually `http://127.0.0.1:5173`.
Saved data works without credentials.
For API updates, copy `.env.example` to `.env.local`, set `MASSIVE_API_KEY`, and restart the server.
The key stays on the server and should never use a `VITE_*` variable.

```sh
npm test
npm run build
npm run preview
```

Preview normally runs on port 4173.
The API uses Vite development/preview middleware, so deploying only `dist/` will not include the API.

## Key decisions

- **Portfolio:** I treated it as a research collection, without share quantities or investment returns.
  React Context shares membership across pages, and localStorage preserves a validated ticker list across reloads.
  Prices stay separate from membership.
- **Navigation:** Search, filters, sorting, selected company, chart period, and list expansion live in URL parameters so reloads and browser navigation preserve the view.
- **API state:** TanStack Query handles fetched data, caching, loading, and errors.
  The Node API layer keeps credentials private, validates provider data, caches responses, and shares duplicate requests.
- **Design:** A light interface keeps discovery, company research, and the portfolio together on desktop, with a responsive layout for smaller screens.
  The landing preview shares components and state with the workbench.

## Data and limitations

The saved Massive dataset contains 5,186 companies with closing prices, plus full profiles and roughly a year of history for the 30 featured companies.
Apple, Microsoft, and NVIDIA also have saved news and filings.
Other company details load on demand when credentials are configured.

- Prices are daily closes, not real-time quotes.
  The app checks for newer closing sessions on entry; news and filings have separate load/refresh actions.
  The current date becomes eligible after 8:15 PM New York time, allowing a buffer after extended trading; this does not guarantee provider finalization.
- Available data stays visible during updates and failures, with closing dates and retrieval details shown.
  Older prices are labeled.
- The server uses a conservative five-request-per-minute budget; the supplied key's subscription tier was not verified.
  Uncached company research can require waiting, with one automatic retry and a countdown for rate-limit responses.
- Server caches reset on restart and are not shared across instances.
  Portfolios are local to the browser and origin, including the port.
- Sector coverage is incomplete, and news coverage depends on the publishers returned by Massive.
  Missing financial values are not replaced with zero.

## What I cut / another four hours

I left out intraday prices, full financial statements, research notes, and account-based syncing to focus on discovery, research, and saving companies.

With another four hours, I would prioritize:

1. **Reduce research loading delays.**
   Confirm the provider allowance and persist fetched profiles and history so restarting the server does not discard them.
   Serve those results immediately while updating older data, and prioritize the selected company over background work.
2. **Make the submission deployable and verify the complete workflow.**
   Deploy the frontend and API together with server-side credentials.
   Add browser tests that search for a company, save it, reload, and check that a failed API update preserves the existing research.

For a production service, I would also need account-backed portfolios, shared caching and request limits across server instances, scheduled data updates, and monitoring for failed requests and outdated data.
For research usefulness, I would prioritize company notes and stronger news coverage before adding sentiment scores.
Those are further steps, not a claim that another four hours would make the app production-ready.

## Validation

Automated tests cover financial calculations, persistence, provider responses, caching, and request limits.
I also checked the main flows and responsive layouts in the browser.
AI tools assisted with implementation, debugging, and design iteration.

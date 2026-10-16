# Equity Research Workbench

A two-page React and TypeScript application for exploring equities and maintaining a research portfolio.

## Current status

This first milestone contains the runnable application foundation. Equity browsing, company details, the landing page, portfolio persistence, and API integration are not implemented yet.

## Run locally

Use Node.js 24 LTS (`nvm use` if you use nvm).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite.

```sh
npm run typecheck
npm run build
npm run preview
```

## Configuration

`.env.example` documents the planned server-side `MASSIVE_API_KEY` setting. The starter does not read it yet. Keep real credentials in an ignored local environment file or deployment settings; never put the key in a `VITE_*` variable or commit it.

## Initial decisions

- React with strict TypeScript, using Vite for development and production builds.
- Interpret the portfolio as a saved research collection rather than a brokerage account.
- Plan two routes: `/` for an interactive product introduction and `/research` for equity discovery, company details, and the portfolio.
- Keep API data, persistent portfolio choices, and navigation state separate as those features are added.
- Use the provided visual references for a light research workspace and a navy landing page, connected through shared data, typography, and blue accents.

## API access check

On October 16, 2026, the supplied key returned successful responses for the US common-stock ticker list, Apple's company details, and Apple's daily bars (32 records for September 1 through October 15). This verifies those requests, not the account's full subscription or quota. No credential is included in the repository.

## Submission documentation still to complete

Record the implemented state and API architecture, actual data freshness and fallback behavior, validation performed, time spent, known issues, cuts, and priorities for another four hours. This README will be updated with the implementation rather than claiming planned features are finished.

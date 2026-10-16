# Equity Research Workbench

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and purpose

An equity researcher needs to discover companies, understand their price history and business, and keep a saved research portfolio. The application is a React and TypeScript internship take-home, evaluated for design, state management, engineering judgment, and product choices within about four hours.

## Capabilities and constraints

The final product has a marketing landing page and a research workbench. Users browse and search equities, inspect details, and add or remove companies from a portfolio that persists across navigation and reloads. Search state should survive sensible navigation. The supplied Massive REST API is the data source; clearly documented saved data is permitted. A portfolio is interpreted as a research collection, without brokerage transactions or invented returns.

This milestone implements company discovery and inspection. Portfolio persistence, company notes, and the finished landing page are later milestones. No commit or push may be made without the user's next approval.

## Brand commitments

The user supplied ten visual references and approved combining the compact screener of reference 1, the central chart and right-side context of reference 2, company information hierarchy of reference 3, and confident landing typography of reference 8. The agreed direction uses a light research workspace, navy landing page, and a shared blue accent.

The user's follow-up pins softly elevated dropdowns with selected checkmarks, a modern search field and navigation, restrained transitions between company selections, no left selection stripe, and real company logos. The landing page must visibly demonstrate the shared data layer. Subsequent user feedback removes status dots, the explanatory banner, repetitive list/footer/source copy, and requests a much broader company universe and additional chart periods. Price dates and a compact Data popover preserve provenance without visual clutter. These are refinements of the approved direction, not permission to invent product claims.

## Evidence and principles

- Use actual Massive responses or explicitly marked saved snapshots, with dates.
- Keep server credentials out of client bundles and Git.
- Prefer complete workflows and understandable code to feature volume.
- Retain a truthful commit history and document implemented behavior.

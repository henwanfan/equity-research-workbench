# Equity Research Workbench

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and purpose

An equity researcher needs to discover companies, understand their price history and business, and keep a saved research portfolio. The application is a React and TypeScript internship take-home, evaluated for design, state management, engineering judgment, and product choices within about four hours.

## Capabilities and constraints

The final product has a marketing landing page and a research workbench. Users browse and search equities, inspect details, and add or remove companies from a portfolio that persists across navigation and reloads. Search state should survive sensible navigation. The supplied Massive REST API is the data source; clearly documented saved data is permitted. A portfolio is interpreted as a research collection, without brokerage transactions or invented returns.

Company discovery, inspection, and the shared-data marketing landing page are implemented. Portfolio persistence is the next milestone; company notes are optional future work. No commit or push may be made without the user's next approval.

## Brand commitments

The user supplied screener, research-terminal, marketing, and modern dropdown references. The confirmed final direction uses a light landing and light research workspace with shared Manrope typography, blue actions and chart evidence, white surfaces, and a cool gray ground. The marketing hero uses larger typography and a prominent actual company preview connected to the shared data layer.

The user approved replacing the abstract 3D scene with one larger integrated preview: company identity, quote, chart, and useful context together. Company and period switching update that preview; its research link opens the selected company and period. Keep the landing focused on its hero, without the redundant lower section/footer. On desktop it fits one screen; narrow layouts may scroll to preserve usable controls.

Softly elevated keyboard-accessible dropdowns, modern search/navigation, real company logos, and restrained transitions remain pinned. Avoid left selection stripes, status dots, repeated banners/disclaimers, invented market values, and product claims for unfinished capabilities. Dated prices and a compact Data popover preserve provenance.

## Evidence and principles

- Use actual Massive responses or explicitly marked saved snapshots, with dates.
- Keep server credentials out of client bundles and Git.
- Prefer complete workflows and understandable code to feature volume.
- Retain a truthful commit history and document implemented behavior.

Discovery defaults to Featured: 30 curated recognizable companies, followed by a separately labeled group ordered by session volume. Name A–Z, activity, and daily-change orderings are explicit alternatives. The shared header keeps the Equity wordmark and navigation without repeating the product descriptor beside the logo.

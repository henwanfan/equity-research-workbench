# Equity Research Workbench

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and purpose

An equity researcher needs to discover companies, understand their price history and business, and keep a saved research portfolio. The application is a React and TypeScript internship take-home, evaluated for design, state management, engineering judgment, and product choices within about four hours.

## Capabilities and constraints

The final product has a marketing landing page and a research workbench. Users browse and search equities, inspect details, and add or remove companies from a portfolio that persists across navigation and reloads. Search state should survive sensible navigation. The supplied Massive REST API is the data source; clearly documented saved data is permitted. A portfolio is interpreted as a research collection, without brokerage transactions or invented returns.

Company discovery, inspection, and the shared-data marketing landing page are implemented. Portfolio persistence is implemented; company notes are optional future work. No commit or push may be made without the user's next approval.

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

## Company research milestone

Add a restrained Research section beneath price metrics, with News and SEC filings views. Both load independently of company prices/history. Saved real responses for AAPL/MSFT/NVDA work offline; other resources load explicitly to preserve the request allowance. Source dates, publishers, and direct original links support further investigation. Show the latest available annual, quarterly, and material-event report within the fetched 250 filings. News association is not evidence of price-move causation. No sentiment score, generated investment thesis, or analyst recommendation is added. Portfolio persistence is implemented in the subsequent milestone described below.

Research refinement: show a publisher selector over up to 50 provider-associated articles, displaying three at a time. Prioritize headlines naming the selected company, then recency. Do not imply publisher independence or quality from source counts. Show publication and retrieval times in New York time. High/low labels and calculations follow the chosen chart range; session volume comparison remains based on the latest 20 available sessions.

## Detail layout refinement

Use the full selected-company column for price evidence. Group the business overview and existing metadata in a compact facts grid above Research, replacing the sparse full-height right rail. Preserve metadata rather than adding low-value fields to occupy space. Remove logo check badges; selected-row tint and pressed state carry selection. Keep mouse clicks free of the native chart focus rectangle, retain visible keyboard focus, and support pointer/arrow-key inspection with date, close, and change from the displayed start. A subtle baseline marks the initial close.

Chart follow-up: suppress the filled layer's separate pointer focus outline, remove the hover/tap instructional sentence, and place the starting-price legend above the plotting area so the line cannot cross the label. Preserve the outer chart's keyboard focus and arrow-key inspection.

## Persistent portfolio milestone

Interpret a portfolio as an ordered research collection of tickers, with no invented share quantities, allocation, profit/loss, or total value. Keep the collection above discovery in the left column, beside the full-width company detail. Add/remove from the company heading; each saved row opens research and has an explicit remove control. Dated catalogue closes and daily changes allow comparison, with counts of rising/falling saved names. Persist only a versioned ticker list in browser localStorage through an app-level context above both routes. Retain saved entries if current quotes fail or an entry leaves the catalogue. Show persistence failures explicitly while keeping in-memory interaction usable. No new endpoint or upstream request is needed.

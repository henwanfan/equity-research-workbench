---
name: Equity Research Workbench
description: Compact company discovery beside price evidence and business context.
colors:
  primary: '#365ee7'
  ink: '#172133'
  muted: '#657084'
  ground: '#f7f8fb'
  surface: '#fff'
  line: '#e8ecf2'
  selection: '#eff3ff'
  positive: '#087d62'
  negative: '#bc3d4d'
typography:
  display:
    fontFamily: 'Manrope Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(52px, 5.7vw, 80px)'
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: '-0.04em'
  headline:
    fontFamily: 'Manrope Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '25px'
    fontWeight: 750
    lineHeight: 1.3
    letterSpacing: '-0.9px'
  price:
    fontFamily: 'Manrope Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '35px'
    fontWeight: 750
    lineHeight: 1.2
    letterSpacing: '-1.1px'
  body:
    fontFamily: 'Manrope Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '12px'
    lineHeight: 1.9
  label:
    fontFamily: 'Manrope Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '11px'
rounded:
  tag: '4px'
  control: '6px'
  filter: '7px'
  search: '9px'
  panel: '11px'
  preview: '14px'
  landing-action: '8px'
spacing:
  compact: '8px'
  regular: '12px'
  section: '20px'
  gutter: '36px'
components:
  landing-cta:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.surface}'
    rounded: '{rounded.landing-action}'
    padding: '15px 20px'
  landing-preview:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.preview}'
  button-secondary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    padding: '8px 10px'
  search:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.search}'
    height: '44px'
    padding: '0 12px'
  navigation:
    backgroundColor: '#f4f6fa'
    padding: '4px'
    rounded: '10px'
  ticker-tag:
    backgroundColor: '#f3f5f8'
    textColor: '{colors.muted}'
    rounded: '{rounded.tag}'
    padding: '3px 5px'
  dropdown:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.panel}'
    padding: '5px'
---

# Design System: Equity Research Workbench

## Overview

**Creative North Star: "The Research Workbench"**

A light, compact research workspace keeps company discovery beside price evidence and business context. White surfaces, a cool gray ground, blue selection, fine dividers, and Manrope make dense information approachable without sacrificing hierarchy.

The light landing introduces the same research system through a large integrated company preview. Shared typography, surfaces, chart, and data keep the first view connected to the working product. Discovery, company details, and landing are implemented; portfolio persistence is next and company notes remain optional future work.

**Key Characteristics:**

- Compact discovery list beside a full-width company detail column, with business context grouped above Research.
- Light landing and workbench with a shared interactive company chart.
- Real company logos, graceful initial fallbacks, and selected-row tint without badge-like checkmarks.
- Compact on-demand provenance, restrained motion, and tabular financial figures.

## Colors

### Primary

Research Blue identifies selection, links, chart evidence, control focus, and the landing action. Lighter selection tints distinguish research rows and open or checked controls.

### Neutral

Ink carries primary information; Muted supports labels and provenance. White Surface sits on Cool Ground, with fine Line dividers maintaining density without heavy framing.

Positive green and negative red encode signed price changes alongside explicit numbers and signs.

**The Evidence Rule.** Use blue for research interaction and chart evidence; reserve green and red for signed changes.

## Typography

Manrope Variable uses a system sans-serif fallback throughout. The landing display role uses this same family at a larger scale; there is no separate display family or monospace face. The root size is (14px), while most labels and research copy are (11–13px).

Page headings use the headline role; company headings are (18px, weight 750). The price role anchors company details. Descriptions use the body role with a maximum measure of (70ch). Labels stay compact; stronger weight separates values from supporting text. Financial values use tabular numerals. The landing display role pairs ink text with blue emphasis. Supporting copy is (15px) with (1.85) line height.

## Layout

The research container centers at a maximum width of (1640px), with desktop horizontal gutters of (36px). The outer grid pairs a (304px) discovery column with flexible details and a (20px) gap. Details use the full remaining width for the chart, overview, and research. Company facts form a compact five-column grid below the overview, with a wider industry column. At (1450px) and above, discovery becomes (325px) and chart height grows from (260px) to (290px).

At (1180px) and below, discovery narrows to (280px). Company facts use three columns below (1000px) and two below (600px). The discovery list scrolls within a (650px) maximum height on desktop. At (800px) and below, discovery stacks above details and its list becomes a scrollable two-column grid capped at (255px). At (600px) and below, the list becomes one column. At (480px) and below, outer gutters become (12px), chart height becomes (235px), and company facts remain a compact two-column grid. Metrics use two columns at (800px) and below. Minimum body width is (320px).

The landing contains the shared white header and a focused hero on Cool Ground. It centers at (1360px) with a (0.72fr / 1.28fr) text-to-preview grid, (54px) gap, and (40px) side gutters. Its minimum height fills the viewport below the (76px) header; the reviewed (1280 × 720px) desktop composition fits one screen. At (1100px) and below the gap becomes (32px). At (850px) and below the hero stacks within (640px), with natural scrolling and (24px) gutters; at (480px) and below gutters become (18px). The shared header becomes (64px) at (800px). Mobile headlines use `clamp(46px, 8vw, 60px)`. The landing chart uses `clamp(180px, 25svh, 250px)` on desktop, (230px) in stacked layouts, and (215px) on phones. There is no lower section, footer, or scroll anchor.

## Elevation & Depth

The workspace is quiet and primarily separated by borders and tonal surfaces. Main panels have a barely visible shadow (`0 2px 4px #152a5003`). Dropdowns provide deliberate soft elevation (`0 10px 30px #1c305018, 0 2px 7px #1c30500a`). Active navigation uses a small lift (`0 1px 3px #1d305815`). Dark metric-help tooltips contrast with white chart tooltips.

The larger white landing preview has soft elevation (`0 14px 40px #1c30500a, 0 3px 8px #1c305005`). Its depth supports one integrated product surface.

**The Quiet Surface Rule.** Keep research panels visually still; reserve stronger elevation for temporary overlays and the larger landing preview.

## Shapes

Compact rounded rectangles define the system: small tags, gently curved controls, and larger panel corners. Panels and dropdowns use the panel radius, search uses the search radius, and filter triggers use the filter radius. Company logos sit in rounded square tiles (33px), expanding to (44px) in details. Selected company rows use a pale blue tint; logos have no selection badge. The landing preview has the larger preview radius; its company choices and primary action retain the compact control family.

## Components

- **Buttons:** Secondary research actions are white, finely bordered, and compact. Hover shifts the surface and border; keyboard focus uses a visible (3px) outline with (3px) offset. Disabled controls reduce opacity and show a waiting cursor.
- **Search:** A (44px) field pairs a search icon with a keyboard hint. Focus changes the border and adds a pale blue ring. `/` focuses search outside editable controls; a clear button replaces the hint when populated.
- **Landing preview:** One white panel integrates company identity and logo, exact quote and daily change, the shared interactive PriceChart, market cap, session volume, closing date, Data popover, and research action. Apple, Microsoft, and NVIDIA choices use keyboard-operable pressed states. The 1M/3M/1Y controls change the actual chart range; the research link carries both selected company and period. General workbench actions preserve the last research URL during app navigation. Shared query keys, API functions, domain calculations, chart axes, and tooltips keep landing and research aligned. Loading and error states remain explicit.
- **Landing action and motion:** The blue primary link has an (8px) radius and compact arrow. The preview enters with an (8px) rise over (450ms); company content uses the shared (200ms) fade/rise. Reduced-motion preferences disable both. The chart's own interpolation animation is disabled.
- **Navigation:** Overview and Workbench share the same white header and cool gray rounded navigation track. The active link uses white fill, blue text, and subtle elevation. Small screens retain this treatment with tighter padding and hidden icons at the smallest breakpoint.
- **Tags and change pills:** Ticker tags use a neutral fill and thin border. Change pills combine explicit signed values with green or red tonal fills.
- **Discovery rows:** White at rest, softly gray on hover, pale blue when selected. Selection uses the row tint and accessible pressed state, with no logo check badge or left stripe. The 30 featured companies use local logo assets; additional company logos use the server image proxy, with initial fallbacks when unavailable. A catalogue of 5,186 common stocks loads incrementally in groups of (25) rows, with a compact count and load-more control. Search and exchange filtering narrow the list; sorting offers Featured, Name A–Z, Most active, and Daily change. Featured groups are explicitly labeled Featured companies and More companies · most active. The catalogue size describes this saved dataset, not a fixed design constraint.
- **Dropdowns:** Radix Select supplies keyboard interaction and collision-aware positioning. Rounded white menus open (7px) below the trigger. Highlighted items use a neutral tint; checked items use blue tint, stronger blue text, and a right-side checkmark.
- **Data provenance:** A compact Data trigger sits beside the dated price. Its Radix popover opens (8px) below the trigger and uses the shared soft overlay shadow, panel radius, and (16px) padding. The (280px) surface is constrained to the viewport, contains provider/mode/retrieval/closing-date facts, and has an explicit close control. Provenance is available on demand; the workspace omits status dots, a source banner, repetitive footers, verbose source-rail copy, and the reading-guide link.
- **Chart and details:** A blue linear closing-price line and pale area fill dominate the center. Four compact range buttons offer 1W, 1M, 3M, and 1Y, with a white active segment and blue text. The first eight saved company profiles include year-long history; additional profiles and histories come through the server API. Missing history receives an explicit empty state. A vertical inspection guide, highlighted point, right-side axis, and date/price/period-change tooltip support inspection. A subtle dashed reference marks the first displayed close. Mouse clicks have no focus box; keyboard focus retains a soft visible outline and arrow-key inspection. The start-price legend sits in reserved space above the plotting area; the dashed line stays inside the plot. No instructional hover/tap copy is shown. Negative-tabindex internal drawing groups have no focus outline; the keyboard-focusable outer chart keeps its visible focus treatment. Chart interpolation animation is disabled. Company content enters over (200ms) with a small (4px) rise; dropdowns enter over (160ms). Reduced-motion preferences disable animations and transitions.

## Do's and Don'ts

### Do:

- **Do** preserve the chart's dominance and keep company context nearby.
- **Do** retain real company logos with initial fallbacks, selected row tints, and accessible pressed states.
- **Do** keep the dated price and compact Data popover together.
- **Do** preserve keyboard focus and reduced-motion behavior.

### Don't:

- **Don't** add a left selection stripe.
- **Don't** restore status dots, source banners, repeated research footers, or verbose provenance banners.
- **Don't** introduce heavy shadows into research panels or dramatic stock-content motion.
- **Don't** advertise portfolio persistence or company notes as completed, or invent market values and product claims.

Reviewer disposition: **SHIP** for the discovery/details milestone, following independent review. Review captures: `.impeccable/review/desktop.jpg`, `.impeccable/review/mobile.jpg`, `.impeccable/review/user-1280.jpg`, `.impeccable/review/dropdown.jpg`, and `.impeccable/review/data-details.jpg`. The parent workflow reports 13 passing tests and a successful build. This document records source styles and the completed review; it does not claim a new browser verification.

Landing reviewer disposition: **SHIP**, with no blocking findings in the independent light-landing review. Captures: `.impeccable/review/landing-light-desktop.jpg`, `.impeccable/review/landing-light-mobile.jpg` (390px), and `.impeccable/review/landing-light-user.jpg` (1280px). The parent workflow reports passing typecheck/build and 13 tests; browser checks covered keyboard selection of NVIDIA/1Y, quote/chart/source consistency, exact research handoff, heading and return URL, an empty console, and no horizontal overflow at 390px. The detector recorded 96 advisory color-ramp findings in `.impeccable/review/landing-light-detector.json`; no repeat detector run or full contrast certification is claimed.

The shared header uses the Equity wordmark without an adjacent descriptor. Discovery defaults to a curated Featured group followed by an explicitly labeled volume-ranked group. Most active, Name A–Z, and Daily change remain alternatives; ticker breaks equal ranks.

The browsing follow-up serves saved quotes before loading missing profiles/history in the background. Refresh has bounded waits and inline errors; failed requests preserve the existing company view. All 30 featured companies have local logo assets, with initial fallbacks elsewhere. The follow-up adds quota and keyed-initial-response coverage; the current test total is 16 after the refresh-cache integration check.

## Research section addition

A Research section follows the price metrics and compact company overview inside the white company column. The News / SEC filings segmented buttons preserve the existing soft gray controls and blue selected treatment. News uses typographic rows with publisher/date, a linked headline, and a two-line provider description; filings use compact form labels, plain-English titles, filing dates, and SEC links. Fine horizontal dividers separate records. No new sidebar, colored selection border, decorative status dot, or outer card is introduced. Each resource has independent loading, empty, error/retry, and refresh states; previously loaded rows remain present during refresh failures. A compact retrieval caption distinguishes saved from refreshed research without adding a banner. Mobile rows wrap naturally and retain the existing focus and reduced-motion treatments.

The news view includes the incumbent Radix publisher dropdown and a small displayed/available article count. Publication and retrieval captions include time and zone. Chart high/low labels track the active range.

Research footer refinement: preserve 24px of space below the provenance/refresh row. News starts with three articles; Show more reveals another three from the already-loaded response, and Show fewer restores the compact view. Changing publisher resets the visible count to three.

The main quote's percentage pill follows the active chart window and includes its period label. Discovery-row percentages remain daily changes. The catalogue footer offers Show more companies and, after expansion, Show fewer to restore the initial 25 rows and scroll the list to its beginning while preserving company/filter/range selection.

## Persistent research portfolio

The left column stacks the research portfolio above company discovery, separated by the existing 16px gap. Its white panel, 11px corners, fine borders, typography, and row selection treatment reuse the working surface. An empty state explains how to save a company. Populated rows show the real logo, ticker/name, dated closing price and signed daily change, plus a separate remove button. Rows open research without changing the active filters or chart period. The panel shows the number of saved names and rising/falling name counts for the labelled closing session; no allocation or return is implied. Long lists scroll within a 295px region. A compact bookmark toggle sits alongside the selected-company heading; its pressed style and text identify membership. On narrow screens the portfolio stacks before discovery and details, and the heading action wraps. Storage failures have an inline warning, and polite status announcements identify additions/removals. Keyboard removal preserves a useful focus target.

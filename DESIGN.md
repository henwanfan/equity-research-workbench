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
spacing:
  compact: '8px'
  regular: '12px'
  section: '20px'
  gutter: '36px'
components:
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

This document records the implemented discovery and company-details milestone. The navy marketing landing page, portfolio persistence, and company notes remain future work; starter surfaces do not establish their finished visual systems.

**Key Characteristics:**

- Compact discovery list, dominant chart, and contextual company rail.
- Quiet surfaces with softly elevated dropdowns.
- Real company logos, graceful initial fallbacks, and clear selected checkmarks.
- Compact on-demand provenance, restrained motion, and tabular financial figures.

## Colors

### Primary

Research Blue identifies selection, links, chart evidence, and control focus. Pale blue tints distinguish selected rows and open or checked controls.

### Neutral

Ink carries primary information; Muted supports labels and provenance. White Surface sits on Cool Ground, with fine Line dividers maintaining density without heavy framing.

Positive green and negative red encode signed price changes alongside explicit numbers and signs.

**The Evidence Rule.** Use blue for research interaction and chart evidence; reserve green and red for signed changes.

## Typography

Manrope Variable uses a system sans-serif fallback throughout. There is no separate display or monospace family in the workbench. The root size is (14px), while most labels and research copy are (11–13px).

Page headings use the headline role; company headings are (18px, weight 750). The price role anchors company details. Descriptions use the body role with a maximum measure of (70ch). Labels stay compact; stronger weight separates values from supporting text. Financial values use tabular numerals.

## Layout

The research container centers at a maximum width of (1640px), with desktop horizontal gutters of (36px). The outer grid pairs a (304px) discovery column with flexible details and a (20px) gap. Details divide into a flexible chart/content area and a (222px) context rail. At (1450px) and above, discovery becomes (325px), context becomes (250px), and chart height grows from (260px) to (290px).

At (1180px) and below, the context rail moves beneath details; discovery narrows to (280px). The discovery list scrolls within a (650px) maximum height on desktop. At (800px) and below, discovery stacks above details and its list becomes a scrollable two-column grid capped at (255px). At (600px) and below, the list becomes one column. At (480px) and below, outer gutters become (12px), chart height becomes (235px), and context stacks into a single section. Metrics use two columns at (800px) and below. Minimum body width is (320px).

## Elevation & Depth

The workspace is quiet and primarily separated by borders and tonal surfaces. Main panels have a barely visible shadow (`0 2px 4px #152a5003`). Dropdowns provide deliberate soft elevation (`0 10px 30px #1c305018, 0 2px 7px #1c30500a`). Active navigation uses a small lift (`0 1px 3px #1d305815`). Dark metric-help tooltips contrast with white chart tooltips.

**The Quiet Surface Rule.** Keep research panels visually still; reserve stronger elevation for temporary overlays.

## Shapes

Compact rounded rectangles define the system: small tags, gently curved controls, and larger panel corners. Panels and dropdowns use the panel radius, search uses the search radius, and filter triggers use the filter radius. Company logos sit in rounded square tiles (33px), expanding to (44px) in details. Selected logos carry a small circular blue check badge.

## Components

- **Buttons:** Secondary research actions are white, finely bordered, and compact. Hover shifts the surface and border; keyboard focus uses a visible (3px) outline with (3px) offset. Disabled controls reduce opacity and show a waiting cursor.
- **Search:** A (44px) field pairs a search icon with a keyboard hint. Focus changes the border and adds a pale blue ring. `/` focuses search outside editable controls; a clear button replaces the hint when populated.
- **Navigation:** A cool gray rounded track contains compact links. The active link uses white fill, blue text, and subtle elevation. Small screens retain this treatment with tighter padding and hidden icons at the smallest breakpoint.
- **Tags and change pills:** Ticker tags use a neutral fill and thin border. Change pills combine explicit signed values with green or red tonal fills.
- **Discovery rows:** White at rest, softly gray on hover, pale blue when selected. Selection adds a check to the real company logo; it never adds a left stripe. The first eight companies use local logo assets; additional company logos use the server image proxy, with initial fallbacks when unavailable. A catalogue of 5,186 common stocks loads incrementally in groups of (25) rows, with a compact count and load-more control. Search and exchange filtering narrow the list; sorting offers Featured, Most active, Name A–Z, and Daily change. The catalogue size describes this saved dataset, not a fixed design constraint.
- **Dropdowns:** Radix Select supplies keyboard interaction and collision-aware positioning. Rounded white menus open (7px) below the trigger. Highlighted items use a neutral tint; checked items use blue tint, stronger blue text, and a right-side checkmark.
- **Data provenance:** A compact Data trigger sits beside the dated price. Its Radix popover opens (8px) below the trigger and uses the shared soft overlay shadow, panel radius, and (16px) padding. The (280px) surface is constrained to the viewport, contains provider/mode/retrieval/closing-date facts, and has an explicit close control. Provenance is available on demand; the workspace omits status dots, a source banner, repetitive footers, verbose source-rail copy, and the reading-guide link.
- **Chart and details:** A blue linear closing-price line and pale area fill dominate the center. Four compact range buttons offer 1W, 1M, 3M, and 1Y, with a white active segment and blue text. The first eight saved company profiles include year-long history; additional profiles and histories come through the server API. Missing history receives an explicit empty state. Horizontal dashed guides, right-side values, and dated tooltips support inspection. Chart interpolation animation is disabled. Company content enters over (200ms) with a small (4px) rise; dropdowns enter over (160ms). Reduced-motion preferences disable animations and transitions.

## Do's and Don'ts

### Do:

- **Do** preserve the chart's dominance and keep company context nearby.
- **Do** retain real company logos with initial fallbacks, selected tints, and checkmarks.
- **Do** keep the dated price and compact Data popover together.
- **Do** preserve keyboard focus and reduced-motion behavior.

### Don't:

- **Don't** add a left selection stripe.
- **Don't** restore status dots, source banners, repeated footers, or verbose provenance in the context rail.
- **Don't** introduce heavy card shadows or dramatic stock-content motion.
- **Don't** present the planned landing page or portfolio as completed.

Reviewer disposition: **SHIP** for the discovery/details milestone, following independent review. Review captures: `.impeccable/review/desktop.jpg`, `.impeccable/review/mobile.jpg`, `.impeccable/review/user-1280.jpg`, `.impeccable/review/dropdown.jpg`, and `.impeccable/review/data-details.jpg`. The parent workflow reports 13 passing tests and a successful build. This document records source styles and the completed review; it does not claim a new browser verification.

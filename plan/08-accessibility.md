# 08 — Accessibility Specification

> Status: draft v1 · Inputs: W3C/WAI primary sources, Highcharts/Visa/ECharts prior art, WCAG 2.2, forced-colors/reduced-motion research
> Stance: accessible **by default** — the ecosystem's citable failure (shadcn/Recharts WCAG 1.1.1/1.4.1/1.4.13 failures) is our differentiator.

## 1. Three-tier semantic model (per chart instance)

| Tier | When | Implementation |
|---|---|---|
| **T0 Redundant/decorative** | Chart is redundant with adjacent text (sparkline next to "▲ 12%") | `summary={false}` → `aria-hidden="true"`. Note (verified vs W3C decision tree): the tree files *graphical* content redundant with nearby text under "Functional Images", not "Decorative" — but the implementation (empty alternative / hidden from AT) is the same for both branches. Docs teach the decision without misciting the taxonomy. |
| **T1 Informative (default)** | Chart carries information alone | `role="img"` + `<title>` + `aria-labelledby` (name = `title` prop + auto summary). Verified: ARIA 1.2 marks `img` children presentational ("SHOULD NOT expose descendants" — SHOULD-level, near-universal in practice). `<title>`+`aria-labelledby` chosen over bare `aria-label` as the more robust cross-AT pattern (historical Safari/VoiceOver quirks). |
| **T2 Complex/interactive (opt-in)** | Interactive charts, or author wants full data exposure | Visually-hidden data table via `dataTable` prop (`aria-describedby`), keyboard point navigation on the interactive entry (roving focus on an HTML overlay, Visa/Data Navigator pattern — never per-point SVG focus). |

## 2. Auto-generated summaries — the flagship feature

`describeSeries(data, opts) → "Trending up 12%. Range 3 to 18. Last value 17."`

- Pure function in `core/summary.ts`; exported standalone (also a selling point).
- Template-driven per data shape: trend (direction + magnitude %), range, last value for S1; largest/smallest for S2; fraction for S3; value-vs-target for S4.
- Deterministic heuristics (slope sign, first-vs-last delta, min/max) — no ML. Micro charts are single-series and statistically constrained, exactly where template generation IS reliable (answer to Highcharts' "automation can't do quality alt text" objection).
- i18n: templates in a swappable strings object; en shipped, structure documented for community locales. Numbers via `Intl.NumberFormat`.
- Precedent basis: ECharts auto-aria (structural only), ustwo's recommended formula, arXiv 2110.04406 4-level model (we implement levels 1–2; level 3 trends is our addition). **No library does this today — verified.**

## 3. WCAG 2.2 conformance matrix (CI-checked where automatable)

| SC | Our handling |
|---|---|
| 1.1.1 Non-text Content (A) | T1 default summary; T0 explicit opt-out |
| 1.3.1 Info & Relationships (A) | Data table option; semantic HTML overlays |
| 1.4.1 Use of Color (A) | Direction always double-encoded (glyph/sign + color); multi-series get dash patterns/marker shapes; ActivityGrid gets numeric labels/tooltips |
| 1.4.3 Text Contrast (AA) | Value labels ≥ 4.5:1 in default themes (CI-checked) |
| 1.4.11 Non-text Contrast (AA) | Data strokes target ≥ 4.5:1 (exceeding 3:1 due to thin-stroke anti-aliasing warning in W3C's own Understanding doc); default stroke ≥ 1.25px; Okabe-Ito yellow excluded from light-bg default order |
| 1.4.13 Content on Hover (AA) | Hover labels are dismissible (Esc), hoverable-equivalent (rendered inline, not floating), persistent while focused |
| 2.1.1 Keyboard (A) | Interactive entry fully keyboard operable; static charts are non-interactive by design |
| 2.2.2 Pause, Stop, Hide (A) | Auto-triggered motion (entrance, data-update tween) is one-shot ≤ 400 ms — exempt by the 5-second rule, and we still gate it on reduced-motion. No looping animation exists in the library by design |
| 2.3.3 Animation from Interactions (AAA) | Hover/focus-triggered motion (interaction-initiated per the Understanding doc) disableable via `animate={false}` + reduced-motion gate. (Verified: 2.3.3 covers *interaction*-triggered motion only; auto data-update motion falls under 2.2.2) |
| 4.1.2 Name/Role/Value (A) | role=img + accessible name composition; live regions for `live` charts |

## 4. Media-query adaptations (shipped in styles.css + JS gates)

- **`prefers-reduced-motion: reduce`**: CSS `animation: none; transition: none` block + `matchMedia` gate in WAAPI code → jump to final state (never delete informational signals: live-pulse becomes static color flash + aria-live text). Recharts' `"auto"` prop pattern adopted.
- **`forced-colors: active`**: explicit re-declaration block — data ink → `CanvasText`, accent/selected → `Highlight`, muted → `GrayText`, bands adapted. `forced-color-adjust: none` only on genuinely color-encoded marks (heat cells), always paired with non-color encoding. Note: spec forces SVG fill/stroke (MDN authoritative) but engines historically diverged — explicit re-declaration is the cross-browser-safe pattern either way. Focus rings: `outline: 2px solid transparent` (never `outline: none`).
- **`prefers-contrast: more`**: stroke-width bump (1.25→2), high-contrast token swap, low-alpha fills solidified. No chart-lib prior art — we define the pattern (documented as such).

## 5. Live/updating charts

- `live` mode: throttled `aria-live="polite"` region announcing the **updated summary** (never per-point churn), configurable `minAnnounceInterval` (Highcharts precedent: 5 s default). Verified caveat: no official APG pattern exists for live charts, and MDN explicitly warns against announcing every update on frequently-updating widgets — throttled-summary-or-off is the aligned design; high-frequency streams should default to `off` with on-demand announcement.

## 6. Verification

- **Automated**: axe-core on every doc example + fixture (CI); contrast checks on all token values both themes; `prefers-*` emulation tests in Playwright.
- **Manual protocol per release**: NVDA + VoiceOver pass on all components (scripted checklist); Windows High Contrast visual check; keyboard-only walkthrough of interactive entries.
- **Docs**: dedicated accessibility page: what's automatic, what needs author input, the decorative decision tree, screen-reader demo recording (launch asset).

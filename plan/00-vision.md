# 00 — Vision & Product Thesis

> Status: draft v1 · Source: founder brain dump (2026-07-06) + market research (see `01-research-findings.md`)

## One-liner

**A micro library solving the microchart problem: micro CPU, micro RAM, micro bundle — maximum delight, maximum customization, one intuitive interface.**

Word-sized, cell-sized, tooltip-sized charts for React. Zero dependencies. Handcrafted, Tufte-grounded, modern-SaaS crisp. Never AI-slop.

## The gap

The web has excellent *macro* chart libraries (ECharts, Recharts, visx, uPlot) and a graveyard of *micro* ones. Nothing today combines:

1. **Micro-first design** — charts designed to live inline: in a sentence, a table cell, a callout, a tooltip, a tab header, a badge. Not shrunken dashboards.
2. **Zero runtime dependencies** — no d3 scales, no lodash, no styling runtime. Self-contained.
3. **Extreme performance** — hundreds of instances per page (every table row) with negligible CPU/RAM; SSR/RSC-capable static output.
4. **A consistent, minimal, deeply customizable API** — every chart shares the same prop grammar; minimal interface, maximum customization.
5. **Delight as a feature** — purposeful animation, micro-interactions, beautiful defaults; respects `prefers-reduced-motion`.
6. **Accessibility as a default** — not an addon.
7. **A design philosophy** — Tufte's playbook, executed at micro scale, with a modern enterprise-SaaS finish.
8. **Charts wherever text lives** — exports that look exactly like the render (fonts included), print/e-ink/editorial themes, a React-free string renderer for email/badges/servers, and an AI-native JSON spec that streams into charts inside LLM chat (see `13`/`14`).

## Non-goals (v1)

- Not a dashboard/BI framework. No axes-heavy, interactive-brush, zoomable macro charts.
- Not a d3 replacement. No general-purpose scale/shape toolkit exposed publicly (internals stay internal).
- No Android/iOS in v1. Architecture keeps a path open (headless core, renderer adapters) but native ports only if the web library succeeds.
- No framework-agnostic core *published* in v1 — React library first; the internal core/renderer split makes a vanilla-JS port possible later.
- No chart type that cannot earn its keep at ≤ 200×60 px.

## Product principles

1. **Micro in, micro out.** Every component works at word size by default. If it needs a legend to be understood, it doesn't belong here (direct labels only — Tufte).
2. **Zero dependencies, zero apologies.** `dependencies: {}`. React is a peer. Everything else — scales, paths, easing, color — is written in-house, tested, and tiny.
3. **One grammar.** Learn one chart, know them all. Same data props, same theming props, same animation props, same a11y props across the entire 96-type catalog.
4. **Beautiful by default, themeable to the bone.** Defaults look like a senior designer at a modern SaaS company shipped them. Every visual decision overridable via CSS custom properties + prop-level tokens.
5. **The Tufte playbook.** Data-ink ratio, lie factor = 1 (areas anchor at zero), no chartjunk, color encodes — never decorates, small multiples, direct labeling, sparklines as word-sized graphics.
6. **Performance is a feature, measured.** Size budgets in CI per component. Render benchmarks in CI. SSR-static by default; client JS only where interaction/animation demands it.
7. **Accessible always.** Every chart has a text alternative, colorblind-safe defaults, contrast-checked strokes, reduced-motion handling, forced-colors handling.
8. **Handcrafted feel.** Optical corrections (half-pixel alignment, endpoint dots, tuned easing curves) that make output feel human-made, not generated.

## Success criteria (12 months)

- v1 (5 charts) shipped, < 2 kB gzip per chart, 0 dependencies verified in CI.
- 1,000+ GitHub stars or clear qualitative signal (used by a recognizable product's table cells).
- A11y audited (axe clean + manual SR pass on every component).
- v2 catalog (from the 96-type plan: decision micrographs + expressive + frontier flagships) specced and in progress.
- No open "this looks broken at small size" class of bugs — micro rendering is the core competency.

## Naming

Working name: **microcharts**. Check npm availability for final name before scaffolding (see `10-roadmap.md`, Step 0).

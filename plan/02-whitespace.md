# 02 — Whitespace & Positioning

> Status: complete · Derived from `01-research-findings.md`

## The whitespace statement

**There is no free, open-source, actively-maintained, zero-dependency, React-idiomatic (hooks/TS/RSC-safe), accessible library that provides a consistent family of word/cell-sized chart primitives optimized for rendering hundreds of instances per view.**

Every existing option fails at least two of those requirements simultaneously:

| Option | Fatal flaws |
|---|---|
| react-sparklines (213k dl/wk!) | dead since 2017, no a11y, no TS, no tree-shaking |
| @fnando/sparkline | not React, no a11y, stalled |
| Design-system sparklines (Mantine/Chakra/MUI/Fluent) | 100–145 kB parent-engine tax, can't use standalone |
| Kendo / AG Grid sparklines | commercial license |
| Big chart libs (Recharts et al.) | 10–230× oversized, one-big-chart architecture, ceremony APIs |
| shadcn/Radix ecosystem | no microchart story at all |

## Demand evidence

1. 213k weekly downloads of a package dead for 9 years — devs ship it to production "for lack of a better option" (their words, in its issues).
2. Six design systems independently reinvented a Sparkline component (Mantine, Chakra, MUI X, Fluent, Kendo, AG Grid).
3. Grafana built its own and still has years-old open bugs — the micro rendering problem is genuinely hard.
4. 2026 charting discourse has a "which chart library" category but no "which microchart library" category — no vocabulary, no leader, no benchmark.

## Differentiators (each individually verifiable, none currently existing)

1. **Zero dependencies, ≤ 2 kB gzip per chart, ≤ 10 kB whole library.** Falsifiable number = the entire marketing pitch (uPlot playbook).
2. **RSC-native**: static charts render server-side with zero client JS. No chart library does this (Tremor is 'use client' throughout).
3. **Many-instances-first architecture**: shared scales, minimal node count, no per-instance observers, virtualization-friendly. Nobody optimizes for the table-cell case.
4. **Auto-generated natural-language summaries** ("↑ trending up 12%, range 3–18, last 17") — verified as a genuine first; Highcharts delegates trend perception to audio, Chart.js/Plot/shadcn generate nothing. Anticipated pushback (Highcharts: "automated technologies cannot produce consistent quality alt text") answered by scope: micro charts have exactly the constrained, single-series statistical shape where template-generated summaries ARE reliable.
5. **Accessibility as default**: citable WCAG failures in shadcn/Recharts (1.1.1, 1.4.1, 1.4.13) become our launch-post material.
6. **Tufte-grounded design language** with modern SaaS finish — a *stance*, not a toggle; no competitor has any design philosophy at all.
7. **Container-query adaptivity** — zero chart libraries use it yet.
8. **shadcn-style copy-paste CLI** as second distribution mode + llms.txt — AI-agent-native distribution in a category where users are already asking for it (lightweight-charts issue #2026).

## Positioning

- **Category creation**: "the microchart library" — own the word. Not "another chart library."
- **One-liner**: *Word-sized charts for React. Zero dependencies, ~1 kB per chart, accessible by default.*
- **The Tufte hook** for the design-literate audience; **the number** for HN; **the shadcn-gap** for the modern React audience.
- North star (Tremor precedent): become the inline-data-layer default for dashboards and admin tables.

## Risks & honest counterpoints

| Risk | Mitigation |
|---|---|
| "Just use Recharts with axes hidden" inertia | Bundle-size + a11y receipts; live benchmark page (500 sparklines: us vs them) |
| Niche too small | react-sparklines' 213k/wk floor says otherwise; category includes every dashboard table |
| Solo-maintainer credibility (the exact disease that killed the category) | Public roadmap, CI-enforced quality gates, boring-but-alive release cadence; docs quality signals production-grade intent |
| Design-system gravity (people use what Mantine ships) | We're the thing design systems *should* wrap; copy-paste mode makes adoption frictionless |
| Fancy animation vs perf-brand tension | Animation strictly opt-in per chart, zero-cost when off, SSR path has none |

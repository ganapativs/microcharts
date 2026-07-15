# Homepage redesign — direction, rationale, system

_2026-07 · branch `feat/homepage-redesign`. Phase-1 prototypes live at `/lab/hero-a`,
`/lab/hero-b`, `/lab/hero-c` (noindexed; kept for reference)._

## Phase 1 — three directions, scored

All three prototypes share identical copy, CTAs, and the install command; only the visual
thesis differs. Screenshots at 1440/390, light + dark, live in the session archive.

| Criterion (1–5)     | A · Silk & Ink | B · Living Field | C · Inside the Sentence |
| ------------------- | :---: | :---: | :---: |
| Thesis clarity      | 4 | 3 | **5** |
| Mesmerize factor    | **5** | 3 | 4 |
| Honesty             | 2 | 4 | **5** |
| Performance headroom| 3 | 4 | **5** |
| Distinctiveness     | 2 | 3 | **5** |
| Mobile survival     | 4 | 4 | **5** |
| **Total**           | 20 | 21 | **29** |

**A — Silk & Ink.** The domain-warped silk (hand-written WebGL1, ~2.5 kB, DPR-capped,
IO/visibility-paused) is genuinely lovely in light mode and the streamed serif reply card is
the single best thesis element of the whole exploration. But the silk fails the page's one
governing rule — it is the only pixel on the fold that is not a microchart doing its job. It
is also the most imitable element (paper.design's signature, not ours), it collapses in dark
mode (a brightness filter is not a design), and a hero shader was already tried on this site
once and rejected. The shader dies; the reply card survives.

**B — The Living Field.** Honest (every field mark is a real static `@microcharts/react`
component) and cheap (transform-only parallax, one listener). But at readable contrast the
field is texture, and texture-behind-headline is a hero pattern motion engineers have seen.
Worse, the centered composition spends the fold's best real estate on air — the streamed
reply card doesn't fit. The catalog-as-background idea is better served by section 03, where
the catalog is the content.

**C — Inside the Sentence.** The charts are grammar: the headline's sparkline and sparkbar
are real components sitting inside the sentence at punctuation precision — the product
demonstrating itself in the first second. The typeset-in load sequence (words settle in
reading order, then each chart draws where the type pauses, then a caret blinks at the full
stop) is the only load moment of the three that could not belong to any other library's
site. Weaknesses at desktop: an empty right column and post-load stillness.

## Final direction — "The Typeset Answer" (C + A's reply card)

C's typeset sentence is the spine. A's streamed serif reply card fills C's empty right
column and cures its stillness — the brief explicitly sanctions this graft. The fold becomes
one continuous choreography in reading order:

1. **0–1.0 s** — headline words settle (pure CSS stagger; SSR-visible without JS),
2. **1.0–1.7 s** — the two inline charts draw themselves, left to right, with the library's
   own `animate` entrance (dogfooding `@microcharts/react/motion`),
3. **1.9 s →** — the assistant reply card starts streaming: plain chart grammar types out in
   a reading serif and morphs into shipped components mid-sentence. Three scenarios rotate.

Ambient afterwards: the caret blinks at the full stop, the "write" sparkline quietly
re-plots every ~7 s, the reply card cycles. Nothing else on the fold moves.

No shader, no field. The ground is what charts have always lived on: paper with a faint
grid, masked to the top of the fold. Every mark on the page is a real
`@microcharts/react` component — decoration that couldn't come from the library got cut.

`prefers-reduced-motion`: the sentence renders settled, charts pre-drawn, the reply card
shows the finished first scenario. Designed, not disabled.

## Type

| Role | Face | Why |
| --- | --- | --- |
| Display | **Bricolage Grotesque** (variable, optical) | The established site voice — expressive grotesque, not the AI-serif pack. Unchanged. |
| UI / body | **Hanken Grotesk** | Established; compact humanist. Unchanged. |
| Reading serif | **Newsreader** (italic + regular, latin subset) | New, one job: the streamed reply and the italic emphasis words (`write`, `trust`). The demo is about *reading* an AI answer; a serif sells reading. Bricolage has no italic, so emphasis needed a second voice anyway. Subset + `display=swap`; loaded only by the home/lab surface. |
| Mono | **JetBrains Mono** | Established; grammar, eyebrows, machine surfaces. Unchanged. |

## Color

No new palette. The single `--accent` token (cobalt `#2f52d4` light / cornflower `#7f9cf5`
dark) keeps driving chrome and chart emphasis; the section-07 theming demo drives real
`--mc-*` custom properties through `defineTheme` — the page is the theming system's own
demo. The one dark band (05 · Made for models) uses the existing dark field values so
light/dark parity holds in both directions.

## Motion vocabulary (one system, used everywhere)

- **Easings:** entrances `var(--ease-out-expo)` (site standard, `cubic-bezier(.16,1,.3,1)`
  — springier sibling of the brief's `.22,1,.36,1`); ambient loops symmetric ease.
- **Durations:** ~0.4 s UI, ~0.9 s reveals. Two tiers only.
- **Charts move the way charts should:** lines draw (stroke-dash via the library's own
  `animate`), bars grow from the baseline, dots pop last — this is the shipped motion
  engine, not bespoke keyframes. Stagger 40–70 ms.
- **Scroll reveals:** the existing shared-IO `Reveal`, one-shot, never re-trigger.
- **Restraint:** the hero owns the orchestrated moment; each section below gets at most one
  motion idea (02 typing, 03 staggered tile draw, 05 sequential terminal lines, 07 live
  re-theme). Everything gated on `prefers-reduced-motion`.

## Narrative arc

Hero (the sentence) → 01 the problem (charts grew up in dashboards; answers moved into
sentences — real weight comparison: recharts 3.9.2 at 145 kB min+gzip + 11 dependencies vs
a 2.27 kB median microchart at 0 dependencies, both bars real MiniBars, source cited) →
02 the grammar (JSX types in, the real component settles, the generated accessible sentence
shown under it) → 03 the catalog (tier chips + ~24 live tiles from the registry) → 04 the
principles + the refusals ("not shipping, on purpose") → 05 made for models (the dark band;
machine surfaces terminal) → 06 the receipts (each stat drawn by a microchart of itself) →
07 theming (`defineTheme` swatches re-theme the section live) → final CTA.

All numbers flow from `docs-facts.ts` / `stats.ts` (measured, CI-checked) — the page cannot
quote a size the build didn't measure. The one external figure (recharts) is pinned to a
version and dated, fetched from bundlephobia 2026-07-15.

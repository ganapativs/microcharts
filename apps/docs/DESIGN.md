# Homepage redesign — direction, rationale, system

_2026-07 · branch `feat/homepage-redesign`. Phase-1 prototypes were explored in-session; screenshots at 1440/390,
light + dark, live in the session archive._

## Phase 1 — three directions, scored

All three prototypes share identical copy, CTAs, and the install command; only the visual thesis differs. Screenshots at
1440/390, light + dark, live in the session archive.

| Criterion (1–5)      | A · Silk & Ink | B · Living Field | C · Inside the Sentence |
| -------------------- | :------------: | :--------------: | :---------------------: |
| Thesis clarity       |       4        |        3         |          **5**          |
| Mesmerize factor     |     **5**      |        3         |            4            |
| Honesty              |       2        |        4         |          **5**          |
| Performance headroom |       3        |        4         |          **5**          |
| Distinctiveness      |       2        |        3         |          **5**          |
| Mobile survival      |       4        |        4         |          **5**          |
| **Total**            |       20       |        21        |         **29**          |

**A — Silk & Ink.** The domain-warped silk (hand-written WebGL1, ~2.5 kB, DPR-capped, IO/visibility-paused) is genuinely
lovely in light mode and the streamed serif reply card is the single best thesis element of the whole exploration. But
the silk fails the page's one governing rule — it is the only pixel on the fold that is not a microchart doing its job.
It is also the most imitable element (paper.design's signature, not ours), it collapses in dark mode (a brightness
filter is not a design), and a hero shader was already tried on this site once and rejected. The shader dies; the reply
card survives.

**B — The Living Field.** Honest (every field mark is a real static `@microcharts/react` component) and cheap
(transform-only parallax, one listener). But at readable contrast the field is texture, and texture-behind-headline is a
hero pattern motion engineers have seen. Worse, the centered composition spends the fold's best real estate on air — the
streamed reply card doesn't fit. The catalog-as-background idea is better served by section 03, where the catalog is the
content.

**C — Inside the Sentence.** The charts are grammar: the headline's sparkline and sparkbar are real components sitting
inside the sentence at punctuation precision — the product demonstrating itself in the first second. The typeset-in load
sequence (words settle in reading order, then each chart draws where the type pauses, then a caret blinks at the full
stop) is the only load moment of the three that could not belong to any other library's site. Weaknesses at desktop: an
empty right column and post-load stillness.

## Final direction — "The Typeset Answer" (C + A's reply card)

C's typeset sentence is the spine. A's streamed serif reply card fills C's empty right column and cures its stillness —
the brief explicitly sanctions this graft. The fold becomes one continuous choreography in reading order:

1. **0–1.0 s** — headline words settle (pure CSS stagger; SSR-visible without JS),
2. **1.0–1.7 s** — the two inline charts draw themselves, left to right, with the library's own `animate` entrance
   (dogfooding `@microcharts/react/motion`),
3. **1.9 s →** — the assistant reply card starts streaming: plain chart grammar types out in a reading serif and morphs
   into shipped components mid-sentence. Three scenarios rotate.

Ambient afterwards: the caret blinks at the full stop, the "write" sparkline quietly re-plots every ~7 s, the reply card
cycles. Nothing else on the fold moves.

No shader, no field. The ground is what charts have always lived on: paper with a faint grid, masked to the top of the
fold. Every mark on the page is a real `@microcharts/react` component — decoration that couldn't come from the library
got cut.

`prefers-reduced-motion`: the sentence renders settled, charts pre-drawn, the reply card shows the finished first
scenario. Designed, not disabled.

## Type

| Role          | Face                                            | Why                                                                                                                                                                                                                                                                              |
| ------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display       | **Bricolage Grotesque** (variable, optical)     | The established site voice — expressive grotesque, not the AI-serif pack. Unchanged.                                                                                                                                                                                             |
| UI / body     | **Hanken Grotesk**                              | Established; compact humanist. Unchanged.                                                                                                                                                                                                                                        |
| Reading serif | **Newsreader** (italic + regular, latin subset) | New, one job: the streamed reply and the italic emphasis words (`write`, `trust`). The demo is about _reading_ an AI answer; a serif sells reading. Bricolage has no italic, so emphasis needed a second voice anyway. Subset + `display=swap`; loaded only by the home surface. |
| Mono          | **JetBrains Mono**                              | Established; grammar, eyebrows, machine surfaces. Unchanged.                                                                                                                                                                                                                     |

## Color

No new palette. The single `--accent` token (cobalt `#2f52d4` light / cornflower `#7f9cf5` dark) keeps driving chrome
and chart emphasis; the section-07 theming demo drives real `--mc-*` custom properties through `defineTheme` — the page
is the theming system's own demo. The one dark band (05 · Made for models) uses the existing dark field values so
light/dark parity holds in both directions.

## Motion vocabulary (one system, used everywhere)

- **Easings:** entrances `var(--ease-out-expo)` (site standard, `cubic-bezier(.16,1,.3,1)` — springier sibling of the
  brief's `.22,1,.36,1`); ambient loops symmetric ease.
- **Durations:** ~0.4 s UI, ~0.9 s reveals. Two tiers only.
- **Charts move the way charts should:** lines draw (stroke-dash via the library's own `animate`), bars grow from the
  baseline, dots pop last — this is the shipped motion engine, not bespoke keyframes. Stagger 40–70 ms.
- **Scroll reveals:** the existing shared-IO `Reveal`, one-shot, never re-trigger.
- **Restraint:** the hero owns the orchestrated moment; each section below gets at most one motion idea (02 typing, 03
  staggered tile draw, 05 sequential terminal lines, 07 live re-theme). Everything gated on `prefers-reduced-motion`.

## Narrative arc

The order is the order a human decides in, not the order the library was built in:

Hero (the claim, demonstrated live: an answer with charts inside it) → 01 the grammar (the reader just watched text
become charts; this explains the trick in the same breath — JSX types in, the real component settles, the generated
accessible sentence shown under it) → 02 the catalog (what's in the box: tier chips + live tiles; closed by the refusals
strip — "traded up, on purpose" is the same editorial decision as the catalog) → 03 where they live (where a human uses
it: product UI, report, cell, sentence — no AI required) → 04 made for models (the one dark band, the AI chapter in
priority order: the provider wall FIRST — "does it work with my stack?" — then the machine-surfaces terminal and a
deliberately small safe-to-emit card side by side; graceful degradation is table stakes, not a headline) → 05 the cost
(the size argument lands AFTER the reader wants the thing: not head-to-head with recharts — different jobs; recharts
3.9.2 one tree-shaken LineChart ~106 kB gzip (+ 11 deps; package 145 kB via bundlephobia) as a cost reference for a full
toolkit vs the measured median microchart for the inlined mark; same linear scale, source cited; closed by the receipts
strip — the page's ONE home for sizes/deps/client-JS, each stat drawn by a microchart of itself) → 06 the examples → 07
theming (`defineTheme` swatches re-theme the section live) → final CTA.

_2026-07-17 consolidation (two passes): the standalone principles, robustness, and receipts sections were merged away —
one home per fact. The principles grid restated claims other sections already prove live; its unique line (one encoding
channel, lie factor = 1) moved into the refusals header. Robustness is the proof of 04's "safe to emit" claim, so it
lives inside that band, demoted to a half-width card. The receipts are the evidence for the cost argument, so they
close 05. The size pitch originally opened the page (old problem→solution arc); it moved below because the hero already
sells the solution and interrupting the demo context with a bundle-size lecture broke the read._

All numbers flow from `docs-facts.ts` / `stats.ts` (measured, CI-checked) — the page cannot quote a size the build
didn't measure. The one external figure (recharts) is pinned to a version and dated: package size from bundlephobia
2026-07-15; one-chart client cost from an esbuild tree-shake measurement 2026-07-21 (recharts ships `sideEffects: false`
— tree-shaking works, but the shared kernel keeps one chart ~70–106 kB).

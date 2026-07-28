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

Ambient afterwards: the "write" sparkline quietly re-plots every ~7 s, the reply card cycles. Nothing else on the fold
moves.

> **Amended 2026-07-26 — no blinking caret.** The fold and `/docs/ai` both used to end the stream with a `steps(1)`
> block cursor. It snapped a full-height accent bar on and off twice a second exactly where the reader's eye rested,
> which read as flicker rather than liveness, and a hard cursor block isn't what a real assistant surface shows. The
> arriving word now carries the signal instead: the last token of the in-flight text run is split off and faded in
> (`.mc-tok`, 0.2 s from opacity 0.15). Softer, and it draws the eye to the thing that actually changed. The split also
> costs less per token — the settled head stops growing, so only the one-word tail re-renders.

No shader, no field. The ground is what charts have always lived on: paper with a faint grid, masked to the top of the
fold. Every mark on the page is a real `@microcharts/react` component — decoration that couldn't come from the library
got cut.

`prefers-reduced-motion`: the sentence renders settled, charts pre-drawn, the reply card shows the finished first
scenario. Designed, not disabled.

## Type

| Role          | Face                                         | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display       | **Open Runde** (statics, self-hosted)        | Replaced Mona Sans 2026-07-28, when the home page's face became the site's. A rounded cut of Inter (SIL OFL) — warmer than the industrial grotesques the earlier rounds settled on, and it holds authority at 3rem / 500 without the extra weight. Statics, not a variable font, so only the three weights the site sets ship: 500 for headings and doc titles, 600 for the home page's section heads and the footer wordmark, 700 for its two bookend lines. 20 kB each, latin-subset from the Fontsource files. |
| UI / body     | **Hanken Grotesk**                           | Established; compact humanist. Unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Reading serif | **Source Serif 4** (italic + regular, latin) | One job: the streamed reply and the italic emphasis words (`write`, `trust`). It is the closest open face to the serif streaming assistants set replies in, so the demo reads like the surface it depicts. `display=swap`; loaded by the home page and the brand page's type specimen.                                                                                                                                                                                                                            |
| Mono          | **JetBrains Mono**                           | Established; grammar, eyebrows, machine surfaces. Unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

### Scale (2026-07-26)

The weight came down and stayed down; the size came down and then went back up part way. Weight was the actual problem —
600 on a grotesque this sturdy shouts, and the old sizes were partly compensating for Bricolage's width.

| Token                             | Was                                     | Now                                        |
| --------------------------------- | --------------------------------------- | ------------------------------------------ |
| `.display` weight / tracking / lh | 600 / -0.021em / 0.98                   | **500 / -0.016em / 1.06**                  |
| Hero `h1` (base→xl)               | 2.05 / 2.65 / 3.2 / 3.45rem             | **2.05 / 2.45 / 2.8 / 3rem**               |
| `--text-fluid-h2`                 | clamp(1.6rem, 1.05rem + 2.1vw, 2.65rem) | **clamp(1.5rem, 1.12rem + 1.5vw, 2.2rem)** |
| `--text-fluid-hero`               | clamp(2.45rem, 1.4rem + 4.8vw, 5.1rem)  | **clamp(2.1rem, 1.4rem + 2.9vw, 3.2rem)**  |
| `.prose h2` weight                | 560                                     | **500**                                    |

A first pass took the hero to 2.6rem and the h2 ceiling to 1.95rem to sit level with the docs. That went too far: at
2.6rem the headline lost against the reply panel and the fold read thin. The landing point is roughly halfway back — the
fold is still the loudest thing on the site, by a step and a half rather than three.

Every marketing heading routes through `--text-fluid-h2` or the hero `h1`, so this is the whole ramp — there is no third
place to change.

## Color

No new palette. The single `--accent` token (cobalt `#2f52d4` light / lifted blue `#528dff` dark) keeps driving chrome
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

## 2026-07-25 — the calm pass

Launch feedback was consistent: people liked the product and found the homepage exhausting — "everything is constantly
moving out from under my eyes," and the relentless motion + aphoristic copy read as generated. The fix is a page that
moves **once, where the motion is the argument**, and is otherwise still:

- **Ambient loops are gone.** The hero reply streams ONCE and settles (the replay control steps through the three
  scenarios on demand); the catalog board no longer rotates a tile (modules upgrade in place — same slugs, same keys);
  every "live" dot is a static dot; the /charts live-chip pulse is off.
- **One-shot theatrics are gone where they delayed information.** The grammar demo shows its full code instantly (no
  typewriter); the cost bars and figures render settled (no wipe, no count-up); the terminal panels don't deal their
  lines one by one.
- **What stays animated:** the hero stream (the thesis, played once), chart draw entrances via the library's own
  `animate` (dogfooding, viewport- and reduced-motion-gated by the motion engine), scroll reveals (softened: 10px rise +
  fade, 0.55s, the entrance blur cut), and interaction feedback (hover, the theming demo's re-theme).
- **Copy:** the "Not X. Y." / "X in, Y out" aphorism cadence was appearing in almost every heading — an LLM tell.
  Headings are now plain and concrete (the cost section's headline is the measured kB range itself); the hero H1 and
  01's "Plain text in, shipped components out" keep their parallelism as the two earned uses.

All numbers flow from `docs-facts.ts` / `stats.ts` (measured, CI-checked) — the page cannot quote a size the build
didn't measure. The one external figure (recharts) is pinned to a version and dated: package size from bundlephobia
2026-07-15; one-chart client cost from an esbuild tree-shake measurement 2026-07-21 (recharts ships `sideEffects: false`
— tree-shaking works, but the shared kernel keeps one chart ~70–106 kB).

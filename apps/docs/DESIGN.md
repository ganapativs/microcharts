# The site's design system

_Two surfaces, one set of tokens. This file is the contract for anyone (human or agent) changing how the site looks._

The site is `apps/docs`, and it has exactly two visual surfaces:

- **The marketing surface** — `/`, `/charts`, `/charts/<collection>`, `/examples`, `/examples/<slug>`, `/brand`. Scoped
  to `.surface`, defined in `src/app/surface.css`. Every one of these routes is the same page with different content,
  and a reader crossing between them should feel nothing change but the words.
- **The documentation surface** — `/docs/**`, Fumadocs' own shell plus the components in `src/components/charts`. It
  keeps its own chrome (sidebar, TOC, panels, code insets) and is deliberately quieter and denser than marketing.

They share `global.css`: one palette, one accent token, one hairline, one type stack, one set of chart presets. A theme
switch, an accent change or a chart-preset swap lands on both without either surface knowing about the other.

## The marketing surface

`src/app/surface.css` is the whole language. Every non-typographic value in it is an ALIAS onto a token `global.css`
already owns, so the accent picker and the six chart presets keep working through the site's own machinery.

| Group        | Tokens                                            | What they are                                                                          |
| ------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Surface      | `--field`, `--field-1..3`                         | Four graded levels, never one flat black. A card is `--field-1`; a hover is not.       |
| Ink          | `--ink`, `--ink-2`, `--ink-3`                     | Three steps. Hierarchy comes from contrast, not weight. All three clear AA both modes. |
| Rules        | `--rule`, `--rule-2`                              | Structure only, and both faint. A rule appears where space alone would be ambiguous.   |
| Meaning edge | `--edge-accent`                                   | The one edge that means something: "you are on this". Heavier in dark.                 |
| Inversion    | `--paper`, `--paper-ink`                          | The one inverted sheet. Flips WITH the theme, so it is always the opposite surface.    |
| Measure      | `--m-lead`, `--m-prose`, `--m-head`, `--m-note`   | Three absolute edges in px, not ch, so mono and body columns line up.                  |
| Rhythm       | `--sp-act`, `--sp-sub`, `--sp-block`, `--sp-lede` | Four gaps and only four, so a gap MEANS something.                                     |

### Layout

One shell (`.shell`) at the site nav's exact measure and gutters, so a page's first line starts under the wordmark.
Sections are `.act` (padding-top only — a section owns the space above it, so removing one can never collapse two gaps
into one). A page with no hero above it opens on `.act-open` instead. Sub-gaps are named for the relationship they
express: `.u-sub`, `.u-block`, `.u-lede`, and `.u-ruled` for a block that draws its own rule.

### Type ramp

`.display-1` · `.display-2` · `.h3` · `.lead` · `.prose` · `.sentence` · `.mono` · `.mono-s` · `.kicker` · `.num` ·
`.figure`. Two rules hold across all of it: **the display face is 40px and up only**, and **it never carries a numeral**
— every figure on the surface is JetBrains Mono, `.num` inline and `.figure` when the number is the statement.

### Actions

`.door`, and `.door[data-primary]` for the one primary action in a view. Hierarchy is type size and ink; the affordance
is a rule under the label that grows on hover rather than lighting up, so the row stays still. **There are no filled
pills, outlines or shadows on this surface** — the page has no filled surfaces anywhere else, so a button that is one
reads as a widget from another site. `.ulink` for links in running text, `.cmd` for an install command.

### Surfaces and hover

Two containers, and the choice between them is about count:

- `.plate` — one edge, no elevation. For a handful of objects that each carry a lot (an example app, a spec panel).
- `.field-cell` — a field with no line ink at all, separated by its gap. For a grid of many small things: ruling all
  four sides of a hundred cells costs ~220 edges, and the eye sorts the chrome before it reaches the ink.

**Hover is an inset accent edge (`--edge-accent`), everywhere, on every reachable object.** Stepping the field one tone
was the earlier answer and it failed in both modes: grey reads as disabled in light, and in dark the two steps are close
enough that the tile looked inert. It is an inset ring rather than a border so the edge costs no layout — a border that
appears on hover moves the content inside it, which on a grid of a hundred cells is a hundred marks twitching under the
cursor. Nothing lifts, glows, tilts or casts.

### Motion

**No entrance motion.** No scroll reveals, no staggered fades, no charts drawing themselves in. Every entrance this
surface ever tried could only hide something the server had already painted, so the reload read as a flicker. First
paint is never gated on JS; `first-paint.test.ts` holds that line (the old `<Reveal>` wrapper had been reduced to a
plain server `<div>` long before it was deleted for having nothing left to do).

What is allowed: transitions on hover and focus, ≤ 0.3 s, on one easing token (`--e`); `[data-state]` swaps for a
control that is genuinely swapping (the landing's rotating claim, the scroll cue's tick). `home.test.ts` asserts the
landing page declares exactly one `@keyframes`, by name.

### Voice

Plain declaratives that could have been typed by the person who built it. The tells to cut, every time: bulleted feature
grids, poetic closers, cliffhangers, rule-of-three cadence, tidy symmetry, filler intensifiers ("genuinely", "truly"),
marketing adjectives, and duration or effort claims. Keep honest asides, modesty, contractions, uneven rhythm, and a
real concession where there is one. A heading describes; it never teases. Numbers are always measured and current — the
marketing pages read every figure from `docs-facts.ts` / `stats.ts` / `showcase.ts`, so a page cannot quote a size the
build did not measure.

## Type

| Role          | Face                                         | Why                                                                                                                                                                                                                                                                                                                                                          |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Display       | **Open Runde** (statics, self-hosted)        | A rounded cut of Inter (SIL OFL) — warmer than the industrial grotesques earlier rounds settled on, and it holds authority at 3rem / 500 without extra weight. Statics, not a variable font, so only the three weights the site sets ship: 500 for docs titles, 600 for section heads and the footer wordmark, 700 for the landing page's two bookend lines. |
| UI / body     | **Hanken Grotesk**                           | Compact humanist. Everything read at length, on both surfaces.                                                                                                                                                                                                                                                                                               |
| Reading serif | **Source Serif 4** (italic + regular, latin) | One job: prose depicted AS prose — the landing page's living sentence and its paper inversion. Loaded by the landing route and by the brand page's type specimen, nowhere else.                                                                                                                                                                              |
| Mono          | **JetBrains Mono**                           | Grammar, kickers, every figure, machine surfaces.                                                                                                                                                                                                                                                                                                            |

### The docs ramp

The marketing surface sets its own sizes (see the type ramp above). The documentation surface routes through
`--text-fluid-h2` and the docs `h1`, so that pair is its whole ramp — there is no third place to change.

| Token                             | Value                                  |
| --------------------------------- | -------------------------------------- |
| `.display` weight / tracking / lh | 500 / -0.016em / 1.06                  |
| `--text-fluid-h2`                 | clamp(1.5rem, 1.12rem + 1.5vw, 2.2rem) |
| `--text-fluid-hero`               | clamp(2.1rem, 1.4rem + 2.9vw, 3.2rem)  |
| `.prose h2` weight                | 500                                    |

Weight was the real problem the 2026-07-26 pass fixed: 600 on a grotesque this sturdy shouts, and the old sizes were
partly compensating for a wider face that is no longer in use.

## Color

One `--accent` token (cobalt `#2f52d4` light / lifted blue `#528dff` dark) drives chrome, links and chart emphasis; five
siblings swap in from the picker. No page introduces a palette of its own. Valence stays fixed whatever the accent is —
bluish-green positive, vermillion negative — because it is an encoding, not decoration. The brand page's specimen
grounds (`.bk-stage`) are the one place a fixed non-themed colour is correct: a mono mark for dark ink has to be shown
against the paper it is for.

## What came before

This file used to document a homepage called "The Typeset Answer": a fold with a streamed serif reply card, a typeset-in
load sequence, seven numbered sections, and scroll reveals throughout. That page was replaced in 2026-07 by the current
landing page — four acts, no entrance motion — and the sections describing it have been removed rather than left to rot.
Two of its conclusions survived the replacement and are now rules above rather than history:

- **Move once, where the motion is the argument.** Launch feedback was that the product was liked and the page was
  exhausting: "everything is constantly moving out from under my eyes." Ambient loops, one-shot theatrics that delayed
  information, and every "live" pulse that was not reporting live state were cut site-wide and have not come back.
- **The aphorism cadence is an LLM tell.** "Not X. Y." / "X in, Y out" had reached almost every heading. Headings are
  plain and concrete now, and the voice rules above are the general form of that fix.

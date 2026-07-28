# The site's design system

_Two surfaces, one set of tokens. This file is the contract for anyone (human or agent) changing how the site looks._

The site is `apps/docs`, and it has exactly two visual surfaces:

- **The marketing surface** — `/`, `/charts`, `/charts/<collection>`, `/examples`, `/examples/<slug>`, `/brand`. Scoped
  to `.surface`, defined in `src/app/surface.css` (the language) plus two per-route layers: `src/app/(landing)/home.css`
  (the eleven components only `/` has) and `src/app/(home)/marketing.css` (the catalog plane and its dock, the example
  plates, the brand specimen grounds). Every one of these routes is the same page with different content, and a reader
  crossing between them should feel nothing change but the words.
- **The documentation surface** — `/docs/**`, Fumadocs' own shell plus the components in `src/components/charts` and
  `src/components/ui`. It keeps its own chrome (sidebar, TOC, panels, code insets) and is deliberately quieter and
  denser than marketing. **It has not yet adopted the marketing language — the section "Bringing the docs into the
  language" below is the contract for that pass.**

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
— every figure on the surface is JetBrains Mono, `.num` inline and `.figure` when the number is the statement. Reading
sizes are rem; drawing sizes (labels inside a diagram) stay px, split by job, not by size.

### Actions

`.door`, and `.door[data-primary]` for the one primary action in a view. Hierarchy is type size and ink; the affordance
is a rule under the label that grows on hover rather than lighting up, so the row stays still. **There are no filled
pills, outlines or shadows on this surface** — the page has no filled surfaces anywhere else, so a button that is one
reads as a widget from another site. `.ulink` for links in running text, `.cmd` for an install command.

**State is never colour alone.** A control that is ON takes the ink and grows an accent rule under it (`.toggle-rule`,
`scaleX` from the centre so the direction of travel is never wrong). The collection row, the question chips, the dock's
pills and the landing's domain toggle all speak this one mark.

**Press is acknowledged on pointer-down, not release.** Cards and tiles press in (`scale: 0.99` — scale, not translate,
so the mark stays centred), a door's label dips, the command's copy icon dips. A navigation that takes a moment to start
reads as a click that missed.

**Touch targets:** small controls whose size is the design (a 6px rail dot, a 14px command line) keep their size and
grow an out-of-flow 44px hit box (`.tap`, vertical only). Controls that are type (doors, collection links, chips) grow
real padding under `@media (pointer: coarse)` instead — their rows have no clear space for an out-of-flow box to borrow.

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

That "nothing paints outside its box" rule has a payoff beyond taste: the catalog plane and the example mark grids run
`content-visibility: auto` (which forces `contain: paint`) precisely because no hover shadow, tilt or bloom needs to
escape a cell. Focus rings inside contained cells are drawn inset for the same reason.

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

**These voice rules are not marketing-only.** They apply to every sentence the site ships, `/docs/**` included. Docs
prose additionally never invents mechanism: a claim about behavior quotes what the build measured or what a test asserts
(`docs-claims.test.ts`, `summary-claims.test.ts`, `chart-a11y-claims.test.ts` hold that line).

## Type

| Role          | Face                                         | Why                                                                                                                                                                                                                                                                                                                                                          |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Display       | **Open Runde** (statics, self-hosted)        | A rounded cut of Inter (SIL OFL) — warmer than the industrial grotesques earlier rounds settled on, and it holds authority at 3rem / 500 without extra weight. Statics, not a variable font, so only the three weights the site sets ship: 500 for docs titles, 600 for section heads and the footer wordmark, 700 for the landing page's two bookend lines. |
| UI / body     | **Hanken Grotesk**                           | Compact humanist. Everything read at length, on both surfaces.                                                                                                                                                                                                                                                                                               |
| Reading serif | **Source Serif 4** (italic + regular, latin) | One job: prose depicted AS prose — the landing page's living sentence and its paper inversion. Loaded by the landing route and by the brand page's type specimen, nowhere else.                                                                                                                                                                              |
| Mono          | **JetBrains Mono**                           | Grammar, kickers, every figure, machine surfaces.                                                                                                                                                                                                                                                                                                            |

### The docs ramp (as built today)

The marketing surface sets its own sizes (see the type ramp above). The docs ramp is currently:

- **h1** — `font-display text-[2.15em] font-medium tracking-[-0.025em]`, hard-coded in TWO files
  (`src/app/docs/[[...slug]]/page.tsx` and `src/components/chart-doc-page.tsx`). The restyle pass should hoist this to
  one class.
- **h2** — stock Fumadocs prose size (1.5em), with family/weight/tracking overridden in `global.css` ("Docs chrome"
  block): display face, 500, `-0.014em`.
- **h3/h4** — pure Fumadocs prose defaults, untouched.

`--text-fluid-h2` and `--text-fluid-hero` still exist in `@theme` but have **zero consumers** — they are dead tokens
from the pre-2026-07 ramp and should be deleted, not routed through. (An earlier version of this file claimed the docs
ramp ran through them; it does not.)

Weight was the real problem the 2026-07-26 pass fixed: 600 on a grotesque this sturdy shouts, and the old sizes were
partly compensating for a wider face that is no longer in use.

## Color

One `--accent` token (cobalt `#2f52d4` light / lifted blue `#528dff` dark) drives chrome, links and chart emphasis; five
siblings swap in from the picker. No page introduces a palette of its own. Valence stays fixed whatever the accent is —
bluish-green positive, vermillion negative — because it is an encoding, not decoration. The brand page's specimen
grounds (`.bk-stage`) are the one place a fixed non-themed colour is correct: a mono mark for dark ink has to be shown
against the paper it is for. The `[data-mc-preset]` and `[data-accent]` blocks in `global.css` are generated /
test-locked (`preset-parity.test.ts`, `accent-palettes.test.ts`) — never hand-edit them.

## Bringing the docs into the language

The next pass restyles `/docs/**` onto the marketing language. This section is the contract for it: what crosses over
unchanged, what the docs keep by design, and the inventory of what has to change.

### What crosses over (rules, not suggestions)

1. **Hover is an inset accent edge.** Every reachable object — panel links, related-chart cards, prev/next cards,
   swatches, drawer buttons — answers the cursor with `--edge-accent` (or its equivalent alias in docs scope), never
   with a lift, a shadow, a translateY, or a scale-up.
2. **Nothing has elevation.** The `.panel` shell keeps its job (a doc page needs bounded stages) but becomes the docs'
   `.plate`: one hairline edge, no `--glass-shadow`, no glass rim. Same for prose tables, standalone code fences,
   `<Cards>`, and the prev/next footer. Frost stays only on the chrome that floats over scrolling content (sidebar, TOC,
   search dialog, popovers) — same precedent as the catalog dock.
3. **No filled pills or filled buttons.** Active state = ink + accent rule (the `.toggle-rule` mark), resting state =
   type. This replaces every `bg-fd-primary/[0.05..0.12]` tint, the raised `.seg` pill, the `rounded-full border` chip
   rows, and the filled accent CTAs (`.cta-accent`, `.agent-prompt-copy`, `.g2-setup-chip`, live-tab's send button).
   Docs actions become doors: `.door[data-primary]` for the one primary action on a page (Open in StackBlitz, Copy
   prompt), quiet doors for the rest. If a control genuinely needs a field at rest inside a dense panel, it is
   `--field-2` with no border — never an accent tint.
4. **No entrance motion, and no decorative loops.** `pop-in` (popover/copy-check), `chip-pop`, and the readout's
   `animate-pulse` dot go. State swaps in response to a direct user action are fine (a check replacing a copy icon may
   swap instantly or cross-fade ≤ 0.3 s); anything that plays on mount or on scroll is not. The ONE exemption: the
   StreamDemo token/chart entrance keyframes — there the motion IS the content (it depicts streaming), same class of
   exemption as the landing's rotating claim.
5. **Press on pointer-down.** Buttons and card links press in (`scale`), exactly as marketing does.
6. **The display face never carries a numeral.** Applies immediately: the `.display` numerals in `perf.tsx` and
   `size-footprint-card.tsx` become mono figures (`.figure` / `.num` equivalents), and `.display text-lg` in
   `chooser.tsx` becomes a Hanken sub-head.
7. **One easing token, ≤ 0.3 s** for every hover/focus transition.
8. **Voice** — the tells list above, applied to every doc page and every panel label. Headings describe.

### What the docs keep (decided, not pending)

- **Their chrome and their density.** Sidebar, TOC, breadcrumb, search — Fumadocs' shell stays, restyled through tokens
  only. Docs are a reading surface; they stay denser than marketing and do NOT adopt `--sp-act`-scale rhythm, the
  `.shell` measure, or `.act` sections.
- **The display-face 40px floor is relaxed to a "titles only" rule on docs.** The docs h1 (~34px) and h2 keep the
  display face — they are page structure, which is what the face is for. The floor's real intent survives as: display
  face only on page/section titles, never on UI labels, chips, or numerals.
- **Panels, code insets, capability drawers, prop tables, playground** — the component vocabulary stays. This pass
  changes their skin (edges, hover, active marks, motion), not their anatomy.
- **`grid-paper` stages stay.** Marketing dropped graph paper because a texture multiplied across 106 cells competes
  with the marks; a doc page has one stage and it is a measuring context (playground, StreamDemo). Same logic as the
  brand page keeping it.
- **Live regions, a11y panes, reduced-motion/-transparency/forced-colors fallbacks** — untouched in behavior;
  forced-colors mappings must be re-verified wherever a filled state is replaced by an accent rule (a rule needs a
  `Highlight` equivalent, same fix the dock already carries).
- **Structure tests stay law:** `chart-section-order.test.ts`, `sidebar-order.test.ts`, the claims tests, and
  `first-paint.test.ts` (which already walks all of `src/`, docs components included).

### The work list (found 2026-07-28, file:line current then)

Elevation / glass to strip: `.panel`'s `--glass-shadow` + rim (global.css `@layer components`), `.glass-lift` (hover
translateY −2px + lift shadow; used by `ai-static.tsx` SurfaceCards), prose-table / standalone-fence / `<Cards>` /
prev-next panel shadows (global.css ~1375–1527), `token-swatches.tsx:199` (`hover:-translate-y-0.5 hover:shadow-sm`),
playground readout overlay `shadow-lg` (`playground.tsx:182–262`), `size-footprint-card.tsx:61`.

Filled state / pills to convert to ink + accent rule: `.seg`/`.seg-opt` raised active pill (global.css ~1051), the
playground mode radiogroup + drawer buttons + badge chips (`playground.tsx:373–425, 545`), StreamDemo tab pills
(`stream-demo.tsx:268`), live-tab suggestion chips + composer + filled send button (`live-tab.tsx:267–294`),
`a11y-pane.tsx:60` Badge, `chooser-filter.tsx:57`, `ai-guide.tsx:137`, `annotation-hosts.tsx:117`, `token-studio.tsx:78`
active seg tint.

Filled CTAs to become doors: `.cta-accent` (+ its light-sweep `::after`), `.cta-ghost`, `.agent-prompt-copy`,
`.g2-setup-chip` — call sites: `stackblitz-sandbox.tsx:55`, `setup-with-ai.tsx:32,68`, `agent-prompt-copy.tsx:29`, and
the h1 action row in `docs/[[...slug]]/page.tsx`.

Motion to remove: `pop-in` (copy.tsx:35, copy-agent-setup.tsx:49, appearance-menu.tsx:199), `chip-pop`
(appearance-menu.tsx:68), `animate-pulse` readout dot (playground.tsx:209), toggle knob keeps its slide (state swap,
allowed).

Type fixes: display-face numerals (`perf.tsx:97,116`, `size-footprint-card.tsx:104`), `.display text-lg`
(`chooser.tsx:226`), hoist the duplicated h1 classes, delete the dead `--text-fluid-*` tokens.

Off-canon radii: `token-studio.tsx:218` (`rounded-2xl` — use `--radius-panel`).

### Guards for the pass

`home.test.ts` reads only `surface.css` + `home.css` — it does not protect the docs. When the restyle lands, add a docs
equivalent (or extend it): no `@keyframes` beyond the exempted stream set in docs-reachable CSS, no
`shadow-`/`translate-y` on hover in docs components, no `bg-fd-primary/` opacity tints on interactive states. The
existing `first-paint.test.ts` already bans reveal patterns repo-wide; lean on it rather than duplicating.

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

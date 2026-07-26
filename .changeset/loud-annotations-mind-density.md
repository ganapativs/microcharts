---
"@microcharts/react": minor
---

The systemic tier of the consistency audit: nine rules the library already stated, none of which anything checked. Every
fix ships with the guard that would have caught it, and each guard was confirmed to fail against the old behaviour
first.

**Annotation labels were laid out at one size and painted at another, on every host.** `annotationFontSize` drives the
truncation budget, the `edgeFlip` anchor and every top clamp in `shared/annotations.tsx` — but the `<text fontSize>`
attribute it wrote is inert, because `:where(.mc-root text)` sets `font-size` as a CSS declaration and a declaration
outranks a presentation attribute. The painted size was the HOST's `--mc-label-size`: a different number on each of the
27 hosts, conditional on an unrelated prop on six of them, and on the three that render no text of their own
(`PairedBars`, `ControlStrip`, `CyclePlot`) not a viewBox-relative number at all — the `0.75em` default resolves against
the surrounding prose, so the same annotation painted at one size in a table cell and another in a heading. The layer
now sets `--mc-label-size` on the label itself, so one ramp reaches every host unconditionally.

Fixing that made two faults underneath it measurable. Annotation labels clamped their top with a 0.78-ascent model that
real faces exceed, so the top label painted ~0.1em above the frame — 1.0 viewBox unit on every host, the same defect and
the same fix (`dominant-baseline: central` plus a half-em clamp) that `Sparkline label="minmax"` just landed. And
`Marker` was the one label in the file that never went through the truncator: a long label at x = 0 start-anchored and
ran the whole width and out of the frame. The containment suite now measures annotation labels on both axes across six
hosts, and asserts the other half of the rule — that a label which cannot fit is dropped rather than painted over the
edge.

**On-fill label ink failed WCAG AA on most of the fills it lands on.** `--mc-on-fill` was a fixed light ink, and one
rule spelled its value out instead of reading the token. Measured: 2.1–3.7:1 on the mid-tone categorical fills in either
theme, and 2.7–3.0:1 on `--mc-accent`/`--mc-positive` in dark mode, where the palette is deliberately LIFTED and those
fills are the lighter of the two. So the ink now flips with the theme, categorical fills take their own `--mc-on-cat`
(mid-tone fills want the opposite ink from deep ones), and light-mode sapphire — the one deep cat — is a scoped,
documented exception. `TraceFold`'s dim span labels stop borrowing `--mc-surface`, which painted them in the page colour
at 1.4:1: not receding, disappearing. `defineTheme` derives `--mc-on-cat` from its own generated palette, so the
measurement travels with a custom accent instead of being silently voided by one.

**`mono` and `eink` shipped six jewel tones.** Neither preset remapped `--mc-cat-1…6`, so nine categorical charts kept
full colour inside a preset whose own comment says "no chroma (the panel can't show it)". Both now derive six tints from
`--mc-stroke`. The range is deliberately narrow: a wider ramp puts the middle steps at mid-grey, where NO single label
ink clears 4.5:1, and keeping every step light means the ordinary label ink stays legible on all six in both themes.
`print` keeps its chroma on purpose — it is a colour-output context — and that decision is now asserted too.

**High Contrast Mode could turn missing data into a value.** A hollow mark says so with a literal `fill="none"`, and the
forced-colors ink mappings painted straight over it: `HeatStrip`'s muted rect is its MISSING-DATA cell, and it filled
solid `GrayText`. One blanket rule now keeps a hollow mark hollow, expressed once so the role added next cannot forget
it. Separately, the categorical channel had no forced-colors mapping at all — `.mc-root` sets
`forced-color-adjust: none`, which PRESERVES authored hues rather than mapping them, so `--mc-cat-4` shipped
near-invisible on a black forced background. Six lightness steps on the system ink now carry the encoding, with a
`Canvas` hairline between segments doing the separating that the narrow ramp cannot.

**Thirty inline stroke widths opted out of `--mc-density`.** `--mc-sw` is `--mc-stroke-width × --mc-density`, and it was
referenced only inside the stylesheet; twenty charts wrote the base token directly and so held their PRIMARY mark at a
fixed weight while every stroke around it scaled. Six primary marks were also missing
`vector-effect: non-scaling-stroke`, with no CSS default to catch them, so they thickened with their container — and
every interactive entry spreads `width: 100%`. Both are now swept and guarded.

**A render-phase ref write in the one module all 84 picker charts share.** `useActivePicker` mirrored `selected` into a
ref during render, so a render that concurrent React discards (Offscreen, a suspended sibling, StrictMode's double
invoke) left the ref holding a value that was never committed and the next tap cleared the wrong selection. The ref is
gone: `selected` only changes from discrete events, which React flushes synchronously, so the handler closures are never
stale. `react-hooks/rules-of-hooks` is now enforced — verified against a probe file with a conditionally-called
`useState` that passed silently until it was pinned — and it immediately caught two missing dependency arrays in this
pass.

**Inline seats froze at mount.** `useSeatHoist` read the seat once while `Chart` recomputes it every render, and
`styles.css` cancels the SVG's own translate as soon as the wrapper is seated — so a post-mount seat change (`SparkBar`
flipping bar↔win-loss) left the wrapper at a stale offset with no fallback. It re-reads now, and clears the hoisted copy
when a chart stops emitting a seat.

**Percent formatting was en-US everywhere.** A literal `` `${Math.round(x * 100)}%` `` is not a percent, it is an en-US
percent: most of Europe wants a NBSP before the sign, `tr-TR` puts the sign first, several locales use their own digits.
Roughly forty sites across the catalog — painted labels, readout chips, live-region announcements and summary sentences
alike — now go through one `makePercentFormatter`, so a `locale` that localised every other number on a chart no longer
leaves its percentages in English. `FillWord`, `Hourglass`, `MoonPhase`, `ParetoStrip` and `TimeInRange` gain the
`locale` prop they needed to make that reachable. Five more rendered strings that no bundle could translate moved into
`SummaryStrings` (`paretoCount`, `biasStripLabel`, `changePointRegime`, `dirNames`, and the quantile band level, which
was handed to the bundle as a bare number with `%` baked into the template).

**Prose gutters at the digits rate.** `textGutter`'s 0.62 per character is calibrated for the tabular figures the
library formats itself; caller-supplied and translated text measures up to 0.95, which is why `textGutterProse` exists —
and only two call sites used it. `Hypnogram`, `EventRaster`, `DataDiff`, `SproutRow` and `EventTimeline` reserved room
for author text or translated keywords at the figures rate. `DataDiff` also had no horizontal degradation at all, so a
long key drove its plot width negative; it gains the drop gate its siblings have. Two charts the audit flagged turned
out to be correct — they format their own numbers — and only re-derived the shared estimate inline instead of calling
it.

Also: `PairedBars` emits `data-mc-origin`, so a negative bar grows out of the baseline instead of inward from the box
edge. `StatusDot`'s pulse halo scaled 1.9× from r = 3 in an 8-unit box and painted 1.7 units into the page for the whole
animation; the end scale is now pinned by containment, and the looping animation is recorded as the catalog's one
documented exemption (the loop is the reading — a monitoring dot holding still says the feed stopped) rather than
contradicting the design notes. `MC_EASE_ENTER` had drifted from `--mc-easing`, so a chart's CSS transitions and its
scripted entrance eased on different curves; they are pinned equal by a test. (`MC_DUR`/`MC_EASE_MOVE` are kept, not
removed — the audit read "no consumers" as dead code, but they are published vocabulary for the UI _around_ a chart, the
same category as `PALETTE`/`CATEGORICAL`. They now say so, and say why they are coarser than the engine's per-archetype
tables.)

**New props, all additive.** Every interactive entry now declares `onActive` as well as `onSelect` — the 19 non-picker
scalars implemented only the latter while the shared contract and the quickstart documented both. `ActivityGrid` gains
`steps`, a knob its geometry always accepted but its Props never exposed, spelled the way its six siblings spell it.
`IconArray` gains `format`, the one chart that took `locale` without it. `RetentionCurve` gains `compare`, with
`benchmark` kept as a deprecated alias that still wins when both are passed: `compare` is the catalog word for a second
series to read the first against, and `DualSparkline`'s own `compare` JSDoc calls it "the benchmark series", which is
how the two names drifted apart.

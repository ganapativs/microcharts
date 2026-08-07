---
"@microcharts/react": minor
---

A `format` prop can change how a number reads. It can no longer change what it means.

**Chart formatting defaults merge instead of being replaced.** `makeFormatter` resolved its options as
`format ?? defaults`, so a chart's defaults were consulted only when you passed nothing at all. Those defaults carry the
chart's UNIT — `{ style: "percent" }` on the share labels of Funnel, Progress, ProgressRing, StackedArea, OHLC,
LikertStrip, IconArray, ConfusionGrid, EventTimeline, BreathingDot, BiasStrip, Honeycomb, DualWindowMeter,
VolumeProfile and HistogramStrip — so `format={{ notation: "compact" }}`, written to shorten six-figure counts, deleted
`style: "percent"` in the same breath and rendered three percent as `0.03`. A plausible wrong number, in the label a
reader is most likely to quote, with nothing to warn you. Options now merge per key, so the unit survives a change to
notation or precision, and an explicit `{ style: "decimal" }` still opts out of it. Changing the unit drops the chart's
digit defaults with it: `maximumFractionDigits: 0` is calibrated for "3%", and carried into `style: "decimal"` it
rounded 0.03 to 0.

**A caller's bound no longer throws.** `Intl` rejects `minimumFractionDigits` above `maximumFractionDigits` with a
`RangeError`, which a merge can now produce from two individually reasonable numbers. Where the crossing comes from the
chart's default, the chart's number yields. Where both numbers come from your own object, it still throws — that one is
visible to you.

**BREAKING: `makeFormatter` takes two arguments.** The exported helper's third parameter — documented in the formatting
guide as "the fallback used when `format` is undefined" — is the mechanism behind the defect above, and it is gone.
Charts with unit defaults call a new internal `makeUnitFormatter`. If you passed a third argument, merge it yourself:
`makeFormatter({ ...defaults, ...format }, locale)`. The two-argument call is unchanged, which is every use in the docs
apart from that one line.

The split is also why the fix costs nothing on charts that format a bare number: subpaths are bundled standalone, so
routing all ~75 of them through the merging path would charge each one 95 B gzip for a branch it can never reach —
enough to push `./sparkline/interactive` through the 7 kB wall.

**Charts that print their own sign no longer print two.** Delta formats a magnitude and prepends the direction itself,
so `format={{ signDisplay: "always" }}` — a legal thing to write — rendered `++0.7 pp`, and a negative rendered
`−+3%`. The same shape was in ten more places: Waterfall (five), DataDiff (two), Bullet, TrendArrow and WinProbWorm.
Each now strips a sign the formatter already emitted. TrendArrow's case was the quietest: it prints no sign of its own,
so a signed formatter put `+5` beside a down arrow.

A source-level gate now fails any chart that concatenates a sign onto a formatted absolute value without passing it
through `unsigned` or `withPlus`, so this class cannot come back.

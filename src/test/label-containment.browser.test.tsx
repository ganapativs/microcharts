// Label containment, measured in a REAL browser with the REAL stylesheet.
//
// Why this file exists (and why the node-project containment tests could not
// catch what it catches):
//
//   1. `styles.css` sets `:where(.mc-root text){ font-size: calc(var(--mc-label-size)
//      * var(--mc-density)) }`. A CSS declaration ALWAYS beats an SVG presentation
//      attribute — `:where()` zero specificity still outranks one — so a chart's
//      `fontSize={n}` attribute is inert unless that chart also pins
//      `--mc-label-size`. A chart that reserves a gutter from `n` while the browser
//      paints at `0.75em` spills its labels outside the viewBox.
//   2. jsdom returns 0 from `getComputedTextLength`/`getBoundingClientRect` on SVG
//      text, and the node project never loads the stylesheet, so neither the size
//      override nor the resulting overflow is observable there.
//   3. The node-project assertions estimate width as `chars * fontSize * 0.62` —
//      the same constant and the same (inert) attribute the production code uses.
//      They can only ever confirm themselves.
//
// `.mc-root` is `overflow: visible` by contract, so an escape here is a real
// layout spill in the page, not a clip. This suite measures painted geometry.
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import type { ReactElement } from "react";

// The load-bearing import: without the stylesheet the bug under test vanishes.
import "../../styles.css";

import { BiasStrip } from "../charts/bias-strip/index.js";
import { BumpStrip } from "../charts/bump-strip/index.js";
import { DotPlot } from "../charts/dot-plot/index.js";
import { DualSparkline } from "../charts/dual-sparkline/index.js";
import { Dumbbell } from "../charts/dumbbell/index.js";
import { EventTimeline } from "../charts/event-timeline/index.js";
import { Funnel } from "../charts/funnel/index.js";
import { GradeProfile } from "../charts/grade-profile/index.js";
import { HeatCell } from "../charts/heat-cell/index.js";
import { LikertStrip } from "../charts/likert-strip/index.js";
import { Ohlc } from "../charts/ohlc/index.js";
import { Progress } from "../charts/progress/index.js";
import { ProgressRing } from "../charts/progress-ring/index.js";
import { SegmentedBar } from "../charts/segmented-bar/index.js";
import { Slope } from "../charts/slope/index.js";
import { SparkBar } from "../charts/sparkbar/index.js";
import { Sparkline } from "../charts/sparkline/index.js";
import { SpreadBand } from "../charts/spread-band/index.js";
import { StackedArea } from "../charts/stacked-area/index.js";
import { StreakSpark } from "../charts/streak-spark/index.js";
import { TrendArrow } from "../charts/trend-arrow/index.js";
import { Waterfall } from "../charts/waterfall/index.js";

// Controls: charts that already pin `--mc-label-size`. They must pass too —
// otherwise a green suite would prove only that the assertion is toothless.
import { IconArray } from "../charts/icon-array/index.js";
import { CoverageStrip } from "../charts/coverage-strip/index.js";
import { Thermometer } from "../charts/thermometer/index.js";

/**
 * Labels are the point of this suite, so every case renders in its most
 * label-heavy mode. Category strings are deliberately wide — uppercase Latin
 * measures ~0.64 units/char against the library's 0.62 estimate, so a label
 * like "SOUTHWEST" is the honest adversary for a reserved gutter, not a
 * contrived one. Values are wide too: a formatter emitting group separators is
 * the common real-world case.
 */
const CASES: Record<string, () => ReactElement> = {
  // Explicit widths throughout: several charts default to a width narrower than
  // their own label drop-out threshold (slope 40, bias-strip 56), which would
  // silently suppress the labels this suite exists to measure.
  // ≥ 5 pairs: below that there is no limits-of-agreement band, `geo.biasY` is
  // null and the caption is suppressed (bias-strip/geometry.ts:101).
  "bias-strip": () => (
    <BiasStrip
      data={[
        { a: 10, b: 14 },
        { a: 20, b: 17 },
        { a: 30, b: 36 },
        { a: 40, b: 38 },
        { a: 50, b: 57 },
        { a: 60, b: 55 },
      ]}
      width={120}
      label="bias"
      title="Bias"
    />
  ),
  "bump-strip": () => <BumpStrip data={[3, 1, 4, 2, 5]} label="ends" title="Rank" />,
  "dot-plot": () => (
    <DotPlot
      data={[
        { label: "SOUTHWEST", value: 1234567 },
        { label: "NORTHEAST", value: 987654 },
      ]}
      label="value"
      title="Region"
    />
  ),
  "dual-sparkline": () => (
    <DualSparkline data={[3, 6, 2, 8, 5]} compare={[2, 4, 5, 3, 7]} label="last" title="Dual" />
  ),
  dumbbell: () => (
    <Dumbbell
      data={[
        { label: "SOUTHWEST", from: 120, to: 940 },
        { label: "NORTHEAST", from: 300, to: 610 },
      ]}
      label="value"
      title="Change"
    />
  ),
  "event-timeline": () => (
    <EventTimeline
      data={[
        { start: 0, end: 3, label: "DEPLOYMENT" },
        { start: 4, end: 9, label: "ROLLBACK" },
      ]}
      label="spans"
      title="Timeline"
    />
  ),
  funnel: () => (
    <Funnel
      data={[
        { label: "VISITED", value: 1000 },
        { label: "SIGNED UP", value: 620 },
        { label: "PAID", value: 120 },
      ]}
      label="percent"
      title="Funnel"
    />
  ),
  "grade-profile": () => (
    <GradeProfile
      data={[
        { d: 0, elev: 100 },
        { d: 50, elev: 260 },
        { d: 100, elev: 180 },
      ]}
      label="max"
      title="Grade"
    />
  ),
  // A lone cell cannot auto-scale, so without a domain the value has no step and
  // the label is suppressed (heat-cell/index.tsx:33-35).
  "heat-cell": () => <HeatCell value={87} domain={[0, 100]} label="value" title="Heat" />,
  "likert-strip": () => (
    <LikertStrip
      data={[
        { label: "AGREE", value: 40 },
        { label: "NEUTRAL", value: 35 },
        { label: "DISAGREE", value: 25 },
      ]}
      label="ends"
      title="Likert"
    />
  ),
  ohlc: () => (
    <Ohlc
      data={[
        { open: 10, high: 14, low: 9, close: 13 },
        { open: 13, high: 18, low: 12, close: 1234567 },
      ]}
      label="last"
      title="OHLC"
    />
  ),
  progress: () => <Progress value={0.97} label="percent" title="Progress" />,
  "progress-ring": () => <ProgressRing value={0.97} label="percent" title="Ring" />,
  "segmented-bar": () => (
    <SegmentedBar
      data={[
        { label: "ALPHA", value: 42 },
        { label: "BRAVO", value: 33 },
        { label: "CHARLIE", value: 25 },
      ]}
      label="percent"
      title="Split"
    />
  ),
  // Short labels on purpose. Slope drops its labels wholesale when its own
  // char-count estimate says they will not fit (`slopeFrame` → `labelsDropped`),
  // so an over-long label makes this case pass vacuously. The bug bites exactly
  // where the estimate says "fits" — correct char count, wrong font size.
  slope: () => (
    <Slope
      data={[
        { label: "South", from: 20, to: 33 },
        { label: "North", from: 44, to: 28 },
      ]}
      width={140}
      label="both"
      title="Slope"
    />
  ),
  sparkbar: () => <SparkBar data={[3, 6, 2, 8, 1234567]} label="last" title="Bars" />,
  "sparkline-last": () => <Sparkline data={[3, 6, 2, 8, 1234567]} label="last" title="Line" />,
  // sparkline is the only chart in the catalog emitting TWO distinct label sizes
  // (`metrics.fontSize` for the endpoint, `mmFont` for min/max), so it needs its
  // own case — a single root-level pin cannot serve both.
  // `label="minmax"` is suppressed below ~28px tall (sparkline/index.tsx:96-98).
  "sparkline-minmax": () => (
    <Sparkline data={[3, 6, 2, 8, 1234567]} height={40} label="minmax" title="Line" />
  ),
  "spread-band": () => (
    <SpreadBand
      data={[
        { a: 10, b: 14 },
        { a: 20, b: 17 },
        { a: 30, b: 42 },
      ]}
      label="gap"
      title="Spread"
    />
  ),
  "stacked-area": () => (
    <StackedArea
      data={[
        { label: "ALPHA", values: [3, 6, 2, 8] },
        { label: "BRAVO", values: [2, 3, 5, 4] },
      ]}
      label="last"
      title="Stack"
    />
  ),
  // Default height on purpose: the geometry now reserves the label's own band, so
  // the label seats at word size. It previously needed a ~48-unit box to appear
  // at all, which the default 20 never gave it.
  "streak-spark": () => (
    <StreakSpark data={[true, true, true, true, false, true, true]} label="both" title="Streak" />
  ),
  "trend-arrow": () => <TrendArrow value={0.22} showValue title="Trend" />,
  waterfall: () => (
    <Waterfall
      data={[
        { label: "START", value: 100 },
        { label: "GAINS", value: 40 },
        { label: "LOSSES", value: -20 },
      ]}
      label="delta"
      title="Waterfall"
    />
  ),

  // --- controls: already pin --mc-label-size, must stay green ---
  "icon-array (control)": () => <IconArray value={3} total={20} label="percent" title="Icons" />,
  "coverage-strip (control)": () => (
    <CoverageStrip data={[1, 0, 1, 1, 0, 1]} label="percent" title="Coverage" />
  ),
  "thermometer (control)": () => <Thermometer value={1234567} label="value" title="Temp" />,
};

/**
 * Horizontal spill of every `<text>` past its own `<svg>`, in viewBox units.
 * Horizontal only: a text node's client rect includes font ascent/descent
 * leading, which routinely exceeds the glyph ink vertically and would make a
 * vertical assertion fire on correct charts.
 */
function measureSpill(root: ParentNode): { label: string; spill: number }[] {
  const out: { label: string; spill: number }[] = [];
  for (const svg of root.querySelectorAll("svg.mc-root")) {
    const box = svg.getBoundingClientRect();
    if (box.width < 2) continue;
    const vb = (svg.getAttribute("viewBox") ?? "").split(/[\s,]+/).map(Number);
    if (vb.length !== 4 || !vb[2]) continue;
    const cssPerUnit = box.width / vb[2];
    for (const text of svg.querySelectorAll("text")) {
      const content = (text.textContent ?? "").trim();
      if (!content) continue;
      const r = text.getBoundingClientRect();
      if (r.width === 0) continue;
      const spillPx = Math.max(box.left - r.left, r.right - box.right);
      if (spillPx > 0) out.push({ label: content, spill: spillPx / cssPerUnit });
    }
  }
  return out;
}

// One viewBox unit of slack absorbs sub-pixel rounding and the hinting jitter
// that shifts a glyph edge by a fraction at small sizes. A real spill from an
// unpinned font size is 5–18 units, so this tolerance does not mask the bug.
const TOLERANCE_UNITS = 1;

describe("label containment (real browser + real stylesheet)", () => {
  for (const [name, renderChart] of Object.entries(CASES)) {
    it(`${name} — every label stays inside the viewBox`, async () => {
      const screen = await render(renderChart());
      // Non-vacuity guard. A mistyped prop (`label` where the chart wants
      // `showValue`) renders no text at all, and a "no labels escaped" assertion
      // over zero labels passes while proving nothing. Every case here is
      // configured into a label-bearing mode, so zero text nodes is a bug in
      // this file, not a passing chart.
      const rendered = [...screen.container.querySelectorAll("svg.mc-root text")].filter(
        (t) => (t.textContent ?? "").trim() !== "",
      );
      expect(rendered.length, "case renders at least one label").toBeGreaterThan(0);

      const spills = measureSpill(screen.container);
      const worst = spills.filter((s) => s.spill > TOLERANCE_UNITS);
      expect(
        worst,
        `labels painting outside the viewBox: ${worst
          .map((w) => `"${w.label}" by ${w.spill.toFixed(1)}u`)
          .join(", ")}`,
      ).toEqual([]);
    });
  }

  // `--mc-density` scales the label but the gutter reserved for it is computed
  // server-side and cannot see the variable, so an unbounded density paints text
  // outside the viewBox. styles.css caps the label multiplier at 1.25; this is
  // the assertion that keeps the cap honest. dot-plot is the worst case in the
  // catalog — a caller-supplied all-caps row label, whose prose gutter carries
  // the least slack. Measured before the cap: no spill through 1.25, 7.5 units at 1.5.
  for (const density of ["0.8", "1", "1.25", "1.5", "2"]) {
    it(`density=${density} — labels stay inside the viewBox`, async () => {
      const screen = await render(
        <div style={{ "--mc-density": density } as React.CSSProperties}>
          <DotPlot data={[{ label: "SOUTHWEST", value: 1234567 }]} label="value" title="Density" />
          <Sparkline data={[3, 6, 2, 8, 1234567]} label="last" title="Density" />
        </div>,
      );
      const worst = measureSpill(screen.container).filter((s) => s.spill > TOLERANCE_UNITS);
      expect(
        worst,
        `at density ${density}: ${worst.map((w) => `"${w.label}" by ${w.spill.toFixed(1)}u`).join(", ")}`,
      ).toEqual([]);
    });
  }

  it("the stylesheet is actually loaded (guards the whole suite)", async () => {
    const screen = await render(<Sparkline data={[1, 2, 3]} title="Guard" />);
    const svg = screen.container.querySelector("svg.mc-root")!;
    // `fill` comes from `:where(.mc-root ...)` in styles.css. If the import ever
    // silently stops applying, every assertion above would pass vacuously.
    expect(getComputedStyle(svg).getPropertyValue("--mc-label-size").trim()).not.toBe("");
  });
});

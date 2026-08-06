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
import { TapeGauge } from "../charts/tape-gauge/index.js";
import { TrendArrow } from "../charts/trend-arrow/index.js";
import { Waterfall } from "../charts/waterfall/index.js";

// Controls: charts that already pin `--mc-label-size`. They must pass too —
// otherwise a green suite would prove only that the assertion is toothless.
import { IconArray } from "../charts/icon-array/index.js";
import { CoverageStrip } from "../charts/coverage-strip/index.js";
import { Thermometer } from "../charts/thermometer/index.js";

// Annotation hosts. Their annotation labels are laid out by `annotationFontSize`
// in shared/annotations-host.tsx and were painted at whatever the HOST's
// `--mc-label-size` resolved to — a different number per host, conditional on an
// unrelated prop on six of them, and on the three that render no text of their
// own not a viewBox-relative number at all.
import { Marker, TargetZone, Threshold } from "../shared/annotations.js";
import { ControlStrip } from "../charts/control-strip/index.js";
import { CyclePlot } from "../charts/cycle-plot/index.js";
import { ForecastCone } from "../charts/forecast-cone/index.js";
import { NetFlow } from "../charts/net-flow/index.js";
import { PairedBars } from "../charts/paired-bars/index.js";

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
      // Wide enough for a span label to SEAT at the prose per-char rate. These
      // are caller-supplied all-caps strings measured at 0.95 units/char, not
      // the 0.62 digits rate the fit test used to use, so at the 80-unit default
      // both labels now drop and the non-vacuity guard below (correctly) fires.
      width={220}
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
  // The same chart with a name budget that scales: at 300 units the right
  // gutter carries 10 characters of caller text plus a value, where the 140-unit
  // case carries 5. A budget that grows without the reservation growing with it
  // paints straight out of the box, which is what this case watches.
  "slope (wide)": () => (
    <Slope
      data={[
        { label: "SUBSCRIPTIONRENEWALS", from: 20, to: 33 },
        { label: "SUBSCRIPTIONRATE", from: 44, to: 28 },
      ]}
      width={300}
      height={54}
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
/** The same measurement on the vertical axis — top and bottom viewBox edges. */
function measureSpillY(root: ParentNode): { label: string; spill: number }[] {
  const out: { label: string; spill: number }[] = [];
  for (const svg of root.querySelectorAll("svg.mc-root")) {
    const box = svg.getBoundingClientRect();
    if (box.height < 2) continue;
    const vb = (svg.getAttribute("viewBox") ?? "").split(/[\s,]+/).map(Number);
    if (vb.length !== 4 || !vb[3]) continue;
    const cssPerUnit = box.height / vb[3];
    for (const text of svg.querySelectorAll("text")) {
      const content = (text.textContent ?? "").trim();
      if (!content) continue;
      const r = text.getBoundingClientRect();
      if (r.height === 0) continue;
      const spillPx = Math.max(box.top - r.top, r.bottom - box.bottom);
      if (spillPx > 0) out.push({ label: content, spill: spillPx / cssPerUnit });
    }
  }
  return out;
}

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

  // VERTICAL spill. `measureSpill` above compares only left/right edges, which
  // is exactly why `label="minmax"` passed while painting outside the top of the
  // box: its two labels are placed by y, and its size pin was missing, so they
  // were laid out at 5–9 units and painted at the inherited 0.75em. Charts whose
  // labels are positioned vertically need both axes measured.
  const VERTICAL: Record<string, () => ReactElement> = {
    "sparkline label=minmax (short)": () => (
      <Sparkline data={[3, 9, 2, 8, 5]} label="minmax" height={28} title="MinMax" />
    ),
    "sparkline label=minmax (tall)": () => (
      <Sparkline data={[3, 9, 2, 8, 5]} label="minmax" height={48} title="MinMax" />
    ),
    "sparkline label=minmax (flat series)": () => (
      <Sparkline data={[5, 5, 5, 5]} label="minmax" height={40} title="Flat" />
    ),
    "sparkline label=minmax (long figures)": () => (
      <Sparkline data={[1234567, 9, 2, 8, 5]} label="minmax" height={40} title="Long" />
    ),
    "sparkline label=last": () => (
      <Sparkline data={[3, 6, 2, 8, 5]} label="last" height={20} title="Last" />
    ),
    // Two type sizes in one chart: the root pins the TICK size, so the hero
    // readout needs an inline font-size or it paints at 7 while its clearance
    // is reserved for up to 13.
    "tape-gauge readout (vertical)": () => (
      <TapeGauge value={142} span={25} height={80} title="Airspeed" />
    ),
    "tape-gauge readout (horizontal)": () => (
      <TapeGauge
        value={142}
        span={25}
        orientation="horizontal"
        width={90}
        height={34}
        title="Air"
      />
    ),
  };

  // Tighter than the horizontal tolerance on purpose. These charts are ~28 units
  // tall rendered at 1 unit = 1 px, so a vertical escape is small in absolute
  // terms and still wrong: the unpinned `minmax` labels measured exactly 1.0
  // unit past each edge, which a 1-unit slack would wave through.
  const VERTICAL_TOLERANCE = 0.5;

  for (const [name, renderChart] of Object.entries(VERTICAL)) {
    it(`${name} — labels stay inside the viewBox top and bottom`, async () => {
      const screen = await render(renderChart());
      const worst = measureSpillY(screen.container).filter((s) => s.spill > VERTICAL_TOLERANCE);
      expect(
        worst,
        `${name}: ${worst.map((w) => `"${w.label}" by ${w.spill.toFixed(1)}u`).join(", ")}`,
      ).toEqual([]);
    });
  }

  // ANNOTATION labels, on both axes. `annotationFontSize(height)` drives the
  // truncation budget in `fit()`, the `edgeFlip` anchor, and every top clamp in
  // shared/annotations.tsx — but the `<text fontSize>` attribute it wrote was
  // inert, so the painted size was the host's `--mc-label-size`. The three hosts
  // below that render no text of their own never pinned it at all, which left the
  // `0.75em` default resolving against the SURROUNDING PROSE: the same annotation
  // painted at a different size in a heading than in a table cell, and nothing in
  // the chart's own geometry could know. The labels here are deliberately long
  // and hard against both edges, which is where a mismatched size escapes.
  const LONG = "Committed baseline";
  const ANNOTATED: Record<string, () => ReactElement> = {
    // no pin at all — the three hosts that render no text themselves
    "paired-bars + annotations": () => (
      <PairedBars
        data={[
          { label: "East", value: 940, ref: 1200 },
          { label: "West", value: 410, ref: 400 },
        ]}
        title="Paired"
      >
        <Threshold y={1200} label={LONG} />
        <Marker x={0} label={LONG} />
      </PairedBars>
    ),
    "control-strip + annotations": () => (
      <ControlStrip data={[10, 11, 9, 10, 11, 9, 10, 10, 11, 9, 10, 16]} title="Control">
        <Threshold y={16} label={LONG} />
        <TargetZone y={[9, 11]} label={LONG} />
      </ControlStrip>
    ),
    "cycle-plot + annotations": () => (
      <CyclePlot
        data={[3, 6, 2, 8, 5, 4, 7, 3, 6, 2, 8, 5, 4, 7]}
        period={7}
        slots={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
        title="Cycle"
      >
        <Threshold y={8} label={LONG} />
        <Marker x={0} label={LONG} />
      </CyclePlot>
    ),
    // pinned only when their own label prop is on — so the annotation size
    // depended on a prop that has nothing to do with annotations
    "net-flow + annotations (label off)": () => (
      <NetFlow
        data={[
          { in: 4, out: 3 },
          { in: 5, out: 4 },
          { in: 6, out: 4 },
        ]}
        label="none"
        title="Flow"
      >
        <Threshold y={6} label={LONG} />
      </NetFlow>
    ),
    "forecast-cone + annotations (label off)": () => (
      <ForecastCone
        data={[3, 5, 4, 6]}
        forecast={{ mid: [7, 8], p80: [[5, 9] as const, [4, 11] as const] }}
        label="none"
        title="Cone"
      >
        <Threshold y={9} label={LONG} />
        <Marker x={0} label={LONG} />
      </ForecastCone>
    ),
    // A Marker label with nowhere to go. Marker was the one label in
    // shared/annotations.tsx that never went through the truncator, so on a
    // word-sized host a long label start-anchored at x = 0 ran the whole width
    // and straight out of the frame. Narrow box + a label far longer than it.
    "marker label on a word-sized host": () => (
      <PairedBars
        data={[
          { label: "E", value: 940, ref: 1200 },
          { label: "W", value: 410, ref: 400 },
        ]}
        width={60}
        height={20}
        title="Narrow"
      >
        <Marker x={0} label="Committed baseline, revised upward" />
      </PairedBars>
    ),
    "threshold label on a word-sized host": () => (
      <ControlStrip data={[10, 11, 9, 10, 11, 9]} width={60} height={20} title="Narrow">
        <Threshold y={11} label="Committed baseline, revised upward" />
      </ControlStrip>
    ),
    // control: a host with an UNCONDITIONAL pin. It must pass too, or a green
    // suite would only prove the assertion is toothless.
    "waterfall + annotations (control)": () => (
      <Waterfall
        data={[
          { label: "Start", value: 100 },
          { label: "Up", value: 40 },
          { label: "Down", value: -30 },
        ]}
        title="Waterfall"
      >
        <Threshold y={110} label={LONG} />
      </Waterfall>
    ),
  };

  for (const [name, renderChart] of Object.entries(ANNOTATED)) {
    it(`${name} — annotation labels stay inside the viewBox`, async () => {
      const screen = await render(renderChart());
      // Non-vacuity: the host must actually be drawing the annotation text.
      const drawn = [...screen.container.querySelectorAll("svg.mc-root text")].map((t) =>
        (t.textContent ?? "").trim(),
      );
      expect(
        drawn.some((t) => t.length > 0 && LONG.startsWith(t.replace(/…$/, ""))),
        `host draws no annotation label (drew: ${JSON.stringify(drawn)})`,
      ).toBe(true);

      const worst = [...measureSpill(screen.container), ...measureSpillY(screen.container)].filter(
        (s) => s.spill > VERTICAL_TOLERANCE,
      );
      expect(
        worst,
        `${name}: ${worst.map((w) => `"${w.label}" by ${w.spill.toFixed(1)}u`).join(", ")}`,
      ).toEqual([]);
    });
  }

  // A label that cannot fit is DROPPED, not painted over the edge — the other
  // half of the containment contract, and the half a "no spill" assertion over a
  // label-bearing fixture cannot reach (it needs a case where the right answer is
  // zero labels, which the non-vacuity guard above forbids).
  //
  // EventTimeline's span labels are caller text drawn INSIDE the span, so the fit
  // test has to measure them at the prose rate. `labels.ts` measured `WWWW…` at
  // 0.95 units/char — the bound that estimator exists for — against 0.62 for the
  // figures the library formats itself. An all-caps word is only ~0.64/char and
  // fits either way, so it proves nothing; these two are seated by the digits
  // rate and then paint 3.5 units past the viewBox (arithmetic: an 8-char label
  // at font 7 needs 53.2 units and the span is 42.2, but 0.62 asks for only 34.7).
  it("event-timeline drops a span label it cannot seat", async () => {
    const screen = await render(
      <EventTimeline
        data={[
          { start: 0, end: 3, label: "WWWWWW" },
          { start: 4, end: 9, label: "WWWWWWWW" },
        ]}
        label="spans"
        title="Timeline"
      />,
    );
    const painted = [...screen.container.querySelectorAll("svg.mc-root text")]
      .map((t) => (t.textContent ?? "").trim())
      .filter(Boolean);
    expect(painted, "neither label can seat at this width, so neither may paint").toEqual([]);
    expect(measureSpill(screen.container).filter((x) => x.spill > TOLERANCE_UNITS)).toEqual([]);
  });

  it("the stylesheet is actually loaded (guards the whole suite)", async () => {
    const screen = await render(<Sparkline data={[1, 2, 3]} title="Guard" />);
    const svg = screen.container.querySelector("svg.mc-root")!;
    // `fill` comes from `:where(.mc-root ...)` in styles.css. If the import ever
    // silently stops applying, every assertion above would pass vacuously.
    expect(getComputedStyle(svg).getPropertyValue("--mc-label-size").trim()).not.toBe("");
  });
});

// Interactive readout containment, measured in a real browser.
//
// The readout chip is `position: absolute` HTML floating over the SVG, with
// `white-space: nowrap`. Its width is therefore its TEXT's width, bounded by
// nothing about the chart — the SVG containment suite cannot see it, because it
// is not in the SVG. Measured before this suite existed: a phase-trace readout
// 217px wide over a 44px chart.
//
// `styles.css` now caps the chip at `max-width: 100%` with an ellipsis, so it can
// no longer paint across the page. That makes the failure mode quieter but not
// better: an over-long readout is silently truncated and the user reads
// "Latency 99.2…" instead of a number. So the assertion here is not "does it
// fit the page" but "does it fit WITHOUT being ellipsized" — `scrollWidth`
// exceeding `clientWidth` is the browser telling us the text did not fit.
//
// That makes readout verbosity a mechanical, reviewable property instead of an
// editorial opinion: if a chart cannot show its readout at its own default size,
// the readout is too long for that chart.
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import type { ReactElement } from "react";

import "../../styles.css";

import { PhaseTrace } from "../charts/phase-trace/client.js";
import { QuadrantDot } from "../charts/quadrant-dot/client.js";
import { ABStrips } from "../charts/ab-strips/client.js";
import { StackedArea } from "../charts/stacked-area/client.js";
import { EtaBar } from "../charts/eta-bar/client.js";
import { DataDiff } from "../charts/data-diff/client.js";
import { TraceFold } from "../charts/trace-fold/client.js";
import { PartitionStrip } from "../charts/partition-strip/client.js";
import { ConfusionGrid } from "../charts/confusion-grid/client.js";
import { CalibrationStrip } from "../charts/calibration-strip/client.js";
import { FoldedDayBand } from "../charts/folded-day-band/client.js";
import { Ohlc } from "../charts/ohlc/client.js";
import { Slope } from "../charts/slope/client.js";
import { Waterfall } from "../charts/waterfall/client.js";
import { RetentionCurve } from "../charts/retention-curve/client.js";
import { CohortTriangle } from "../charts/cohort-triangle/client.js";
import { Funnel } from "../charts/funnel/client.js";
import { MicroScatter } from "../charts/micro-scatter/client.js";
import { Sparkline } from "../charts/sparkline/client.js";
import { LikertStrip } from "../charts/likert-strip/client.js";
import { VolumeProfile } from "../charts/volume-profile/client.js";
import { SegmentedBar } from "../charts/segmented-bar/client.js";
import { MicroDonut } from "../charts/micro-donut/client.js";
import { ActivityGrid } from "../charts/activity-grid/client.js";
import { WindBarb } from "../charts/wind-barb/client.js";

/**
 * Every chart at its OWN default size — the size the docs demo it at and the
 * size the word-sized brief is written for. Passing only at 300px wide would
 * prove nothing about the product.
 *
 * Category labels are realistic rather than adversarial ("Checkout", not
 * "WWWWWWWW"): the question is whether the readout template is too verbose for
 * ordinary data, not whether pathological input can break it.
 */
const CASES: Record<string, () => ReactElement> = {
  "phase-trace": () => (
    <PhaseTrace
      data={[
        { x: 12, y: 40 },
        { x: 30, y: 55 },
        { x: 52, y: 72 },
        { x: 71, y: 66 },
      ]}
      xLabel="CPU"
      yLabel="Latency"
      title="Phase"
    />
  ),
  // `field` optional: focal is always navigable (index 0); peers follow.
  "quadrant-dot": () => (
    <QuadrantDot
      data={{ x: 62, y: 78 }}
      field={[
        { x: 20, y: 30 },
        { x: 45, y: 65 },
        { x: 80, y: 40 },
      ]}
      xLabel="Reach"
      yLabel="Impact"
      title="Quadrant"
    />
  ),
  "ab-strips": () => (
    <ABStrips
      data={{ a: [120, 135, 128, 140, 132], b: [150, 162, 158, 149, 155] }}
      seriesLabels={["Control", "Variant"]}
      title="AB"
    />
  ),
  "stacked-area": () => (
    <StackedArea
      data={[
        { label: "Search", values: [3, 6, 2, 8] },
        { label: "Direct", values: [2, 3, 5, 4] },
        { label: "Social", values: [1, 2, 2, 3] },
      ]}
      title="Mix"
    />
  ),
  "eta-bar": () => <EtaBar progress={0.62} elapsed={480} title="ETA" />,
  "data-diff": () => (
    <DataDiff
      data={[
        { key: "items", added: 40, removed: 20 },
        { key: "users", added: 12, removed: 30 },
      ]}
      title="Diff"
    />
  ),
  "trace-fold": () => (
    <TraceFold
      data={[
        { label: "handler", start: 0, duration: 100, depth: 0, critical: true },
        { label: "db.query", start: 10, duration: 60, depth: 1, critical: true },
        { label: "render", start: 75, duration: 20, depth: 1 },
      ]}
      title="Trace"
    />
  ),
  "partition-strip": () => (
    <PartitionStrip
      data={[
        {
          label: "Compute",
          children: [
            { label: "CPU", value: 40 },
            { label: "GPU", value: 25 },
          ],
        },
        {
          label: "Storage",
          children: [
            { label: "SSD", value: 20 },
            { label: "Cold", value: 15 },
          ],
        },
      ]}
      title="Spend"
    />
  ),
  "confusion-grid": () => (
    <ConfusionGrid
      data={{
        labels: ["cat", "dog"],
        counts: [
          [42, 8],
          [5, 45],
        ],
      }}
      title="Confusion"
    />
  ),
  "calibration-strip": () => (
    <CalibrationStrip
      data={[
        { predicted: 0.1, observed: 0.12, count: 120 },
        { predicted: 0.5, observed: 0.47, count: 200 },
        { predicted: 0.9, observed: 0.88, count: 90 },
      ]}
      title="Calibration"
    />
  ),
  "folded-day-band": () => (
    <FoldedDayBand
      data={Array.from({ length: 48 }, (_, i) => ({ t: i * 1800, value: 40 + (i % 12) * 3 }))}
      title="Day"
    />
  ),
  ohlc: () => (
    <Ohlc
      data={[
        { open: 10, high: 14, low: 9, close: 13 },
        { open: 13, high: 18, low: 12, close: 16 },
        { open: 16, high: 17, low: 11, close: 12 },
      ]}
      title="OHLC"
    />
  ),
  slope: () => (
    <Slope
      data={[
        { label: "South", from: 20, to: 33 },
        { label: "North", from: 44, to: 28 },
      ]}
      title="Slope"
    />
  ),
  waterfall: () => (
    <Waterfall
      data={[
        { label: "Start", value: 100 },
        { label: "Gains", value: 40 },
        { label: "Losses", value: -20 },
      ]}
      title="Waterfall"
    />
  ),
  "retention-curve": () => <RetentionCurve data={[1, 0.62, 0.48, 0.4, 0.36]} title="Retention" />,
  "cohort-triangle": () => (
    <CohortTriangle
      data={[
        { label: "Jan", values: [1, 0.6, 0.4] },
        { label: "Feb", values: [1, 0.55, 0.38] },
        { label: "Mar", values: [1, 0.5] },
      ]}
      title="Cohorts"
    />
  ),
  funnel: () => (
    <Funnel
      data={[
        { label: "Visited", value: 1000 },
        { label: "Signed up", value: 620 },
        { label: "Paid", value: 120 },
      ]}
      title="Funnel"
    />
  ),
  // Charts whose readouts gained the magnitude behind their share (or the date
  // behind their cell). Each one is a place where the width gate previously
  // pushed a number out of the chip, so each has to hold the line from BOTH
  // sides — see readout-value-visibility.browser.test.tsx for the other one.
  "likert-strip": () => (
    <LikertStrip
      data={[
        { label: "Strongly disagree", value: 10 },
        { label: "Disagree", value: 14 },
        { label: "Neutral", value: 14 },
        { label: "Agree", value: 34 },
        { label: "Strongly agree", value: 28 },
      ]}
      title="Q1"
    />
  ),
  "volume-profile": () => (
    <VolumeProfile
      data={[
        { level: 138, weight: 8 },
        { level: 142, weight: 25 },
        { level: 146, weight: 7 },
      ]}
      bins={3}
      title="Volume"
    />
  ),
  "segmented-bar": () => (
    <SegmentedBar
      data={[
        { label: "Chrome", value: 620 },
        { label: "Safari", value: 240 },
        { label: "Firefox", value: 90 },
        { label: "Edge", value: 30 },
        { label: "Arc", value: 12 },
        { label: "Brave", value: 8 },
      ]}
      title="Share"
    />
  ),
  "micro-donut": () => (
    <MicroDonut
      data={[
        { label: "Chrome", value: 620 },
        { label: "Safari", value: 240 },
        { label: "Firefox", value: 90 },
      ]}
      title="Share"
    />
  ),
  "activity-grid (dated)": () => (
    <ActivityGrid
      data={Array.from({ length: 21 }, (_, i) => i)}
      anchor="2026-03-02"
      title="Commits"
    />
  ),
  "wind-barb": () => <WindBarb direction={225} magnitude={32} title="Wind" />,
  // Controls: the audit found these already terse. They must stay green,
  // otherwise the assertion is measuring the harness rather than the readouts.
  "micro-scatter (control)": () => (
    <MicroScatter
      data={[
        { x: 1, y: 2 },
        { x: 3, y: 5 },
        { x: 6, y: 4 },
      ]}
      title="Scatter"
    />
  ),
  "sparkline (control)": () => <Sparkline data={[3, 6, 2, 8, 5]} title="Line" />,
};

const pointer = (el: Element, type: string, x: number, y: number): void => {
  el.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      clientX: x,
      clientY: y,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
    }),
  );
};

interface Worst {
  text: string;
  overflowPx: number;
  chipPx: number;
  hostPx: number;
}

/**
 * Sweep the pointer across the chart and return the worst truncation seen.
 *
 * Two things this has to get right. The sweep matters because several charts
 * only render a readout over a mark, and the longest readout is rarely under the
 * first sample. And the `await` matters because the readout is React state: it
 * lands on the next tick, so measuring synchronously after dispatch reads a DOM
 * that has not rendered the chip yet — which reports every chart as clean.
 * Keyboard is tried too; a few charts commit their readout on roving rather than
 * on hover.
 */
async function worstTruncation(host: HTMLElement): Promise<{
  worst: Worst | null;
  seen: number;
  widest: string;
}> {
  const box = host.getBoundingClientRect();
  let worst: Worst | null = null;
  let seen = 0;
  let widest = "";

  const sample = (): void => {
    for (const chip of host.querySelectorAll<HTMLElement>(".mc-spark-readout")) {
      const text = (chip.textContent ?? "").trim();
      if (!text) continue;
      seen++;
      if (text.length > widest.length) widest = text;
      // scrollWidth > clientWidth means the browser could not fit the text and
      // the ellipsis is showing. 1px of slack absorbs sub-pixel rounding.
      const overflow = chip.scrollWidth - chip.clientWidth;
      if (overflow > 1 && (!worst || overflow > worst.overflowPx)) {
        worst = {
          text,
          overflowPx: overflow,
          chipPx: Math.round(chip.getBoundingClientRect().width),
          hostPx: Math.round(box.width),
        };
      }
    }
  };
  const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

  host.focus();
  for (let i = 0; i <= 12; i++) {
    const x = box.left + (box.width * i) / 12;
    const y = box.top + box.height / 2;
    pointer(host, "pointerenter", x, y);
    pointer(host, "pointermove", x, y);
    await settle();
    sample();
  }
  pointer(host, "pointerleave", box.left, box.top);

  // Keyboard pass: rove the whole series for charts that only read out on focus.
  for (let i = 0; i < 12; i++) {
    host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await settle();
    sample();
  }
  return { worst, seen, widest };
}

describe("interactive readout fits its own chart", () => {
  for (const [name, renderChart] of Object.entries(CASES)) {
    it(`${name} — readout is not truncated at the chart's default size`, async () => {
      const screen = await render(renderChart());
      const host = screen.container.querySelector<HTMLElement>('span[role="img"][tabindex]');
      expect(host, "interactive host wrapper").not.toBeNull();

      const { worst, seen, widest } = await worstTruncation(host!);
      // Non-vacuity guard. If the sweep never surfaced a readout, "nothing was
      // truncated" is true and worthless — the same trap that made seven cases
      // in the SVG containment suite pass while rendering no text at all.
      expect(seen, "pointer sweep surfaced at least one readout").toBeGreaterThan(0);
      expect(
        worst,
        worst
          ? `readout "${worst.text}" overflows its chip by ${worst.overflowPx}px ` +
              `(chip ${worst.chipPx}px, chart ${worst.hostPx}px) — it renders ellipsized`
          : `widest readout seen: "${widest}"`,
      ).toBeNull();
    });
  }
});

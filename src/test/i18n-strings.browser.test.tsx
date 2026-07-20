// No hardcoded English in rendered chart text.
//
// The canon is that English lives only in the core `EN_*` string modules, so a
// consumer can pass `strings` and get a fully localized chart. That rule was
// enforced by reading code, which is why it drifted: an audit of the interactive
// entries found English baked into readout chips in dozens of charts — "median",
// "vs", "target", "plan", "cohort", "Series 2", "n=", ", critical" — alongside
// hardcoded `%` signs and `+`/`−` glyphs that bypass `format`/`locale` too.
//
// This makes the rule mechanical. Every chart renders with a `strings` object
// whose every entry is replaced by a sentinel token, so ALL legitimate prose
// comes out as «key». Anything else alphabetic in the output was written into
// the component, not into a string module.
//
// The interactive entries are the target: readouts are where the drift lives,
// and they only exist in a browser.
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import type { ReactElement } from "react";

import "../../styles.css";
import { EN } from "../core/strings.js";

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
import { Ohlc } from "../charts/ohlc/client.js";
import { Slope } from "../charts/slope/client.js";
import { Waterfall } from "../charts/waterfall/client.js";
import { RetentionCurve } from "../charts/retention-curve/client.js";
import { CohortTriangle } from "../charts/cohort-triangle/client.js";
import { Funnel } from "../charts/funnel/client.js";
import { CyclePlot } from "../charts/cycle-plot/client.js";
import { ControlStrip } from "../charts/control-strip/client.js";
import { PairedBars } from "../charts/paired-bars/client.js";
import { DualSparkline } from "../charts/dual-sparkline/client.js";
import { QueueDepth } from "../charts/queue-depth/client.js";
import { BurnChart } from "../charts/burn-chart/client.js";

/**
 * A `strings` stand-in where every entry renders as «key».
 *
 * `SummaryStrings` holds three shapes — plain strings, template functions, and
 * fixed-length tuples of names — so the proxy mirrors whatever `EN` has at that
 * key. It is a Proxy rather than a mapped object because each chart accepts only
 * its own `Pick` of the interface, and several read keys conditionally.
 */
const SENTINELS = new Proxy({} as Record<string, unknown>, {
  get(_target, key: string) {
    const real = (EN as unknown as Record<string, unknown>)[key];
    if (typeof real === "function") return () => `«${key}»`;
    if (Array.isArray(real)) return real.map((_, i) => `«${key}.${i}»`);
    return `«${key}»`;
  },
  has: () => true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the proxy stands
// in for ~30 different `Pick<SummaryStrings, …>` shapes; typing it as each
// chart's own slice would mean 22 casts saying the same thing.
const S = SENTINELS as any;

/**
 * Caller-supplied labels are deliberately digits: they pass through to the
 * output verbatim and by design, so alphabetic ones would be indistinguishable
 * from the hardcoded English this suite hunts for.
 */
const CASES: Record<string, () => ReactElement> = {
  "phase-trace": () => (
    <PhaseTrace
      data={[
        { x: 12, y: 40 },
        { x: 30, y: 55 },
        { x: 52, y: 72 },
      ]}
      strings={S}
    />
  ),
  "quadrant-dot": () => (
    <QuadrantDot
      data={{ x: 62, y: 78 }}
      field={[
        { x: 20, y: 30 },
        { x: 45, y: 65 },
      ]}
      strings={S}
    />
  ),
  "ab-strips": () => (
    <ABStrips
      data={{ a: [120, 135, 128, 140, 132], b: [150, 162, 158, 149, 155] }}
      seriesLabels={["1", "2"]}
      strings={S}
    />
  ),
  "stacked-area": () => (
    <StackedArea data={[{ values: [3, 6, 2, 8] }, { values: [2, 3, 5, 4] }]} strings={S} />
  ),
  "eta-bar": () => <EtaBar progress={0.62} elapsed={480} rate={0.1} strings={S} />,
  "data-diff": () => <DataDiff data={[{ key: "1", added: 40, removed: 20 }]} strings={S} />,
  "trace-fold": () => (
    <TraceFold
      data={[
        { label: "1", start: 0, duration: 100, depth: 0, critical: true },
        { label: "2", start: 10, duration: 60, depth: 1 },
      ]}
      strings={S}
    />
  ),
  "partition-strip": () => (
    <PartitionStrip
      data={[
        {
          label: "1",
          children: [
            { label: "11", value: 40 },
            { label: "12", value: 25 },
          ],
        },
        { label: "2", children: [{ label: "21", value: 20 }] },
      ]}
      strings={S}
    />
  ),
  "confusion-grid": () => (
    <ConfusionGrid
      data={{
        labels: ["1", "2"],
        counts: [
          [42, 8],
          [5, 45],
        ],
      }}
      strings={S}
    />
  ),
  "calibration-strip": () => (
    <CalibrationStrip
      data={[
        { predicted: 0.1, observed: 0.12, count: 120 },
        { predicted: 0.9, observed: 0.88, count: 90 },
      ]}
      strings={S}
    />
  ),
  ohlc: () => (
    <Ohlc
      data={[
        { open: 10, high: 14, low: 9, close: 13 },
        { open: 13, high: 18, low: 12, close: 16 },
      ]}
      strings={S}
    />
  ),
  slope: () => (
    <Slope
      data={[
        { label: "1", from: 20, to: 33 },
        { label: "2", from: 44, to: 28 },
      ]}
      label="both"
      strings={S}
    />
  ),
  waterfall: () => (
    <Waterfall
      data={[
        { label: "1", value: 100 },
        { label: "2", value: -20 },
      ]}
      strings={S}
    />
  ),
  "retention-curve": () => <RetentionCurve data={[1, 0.62, 0.48, 0.4]} strings={S} />,
  "cohort-triangle": () => (
    <CohortTriangle
      data={[
        { label: "1", values: [1, 0.6, 0.4] },
        { label: "2", values: [1, 0.55] },
      ]}
      strings={S}
    />
  ),
  funnel: () => (
    <Funnel
      data={[
        { label: "1", value: 1000 },
        { label: "2", value: 620 },
      ]}
      strings={S}
    />
  ),
  "cycle-plot": () => (
    <CyclePlot
      data={[3, 6, 2, 8, 5, 7, 4, 9, 3, 6, 2, 8]}
      slots={["1", "2", "3", "4"]}
      period={4}
      strings={S}
    />
  ),
  "control-strip": () => <ControlStrip data={[3, 6, 2, 8, 5, 7, 4, 9]} strings={S} />,
  "paired-bars": () => (
    <PairedBars
      data={[
        { label: "1", value: 62, ref: 48 },
        { label: "2", value: 41, ref: 55 },
      ]}
      strings={S}
    />
  ),
  "dual-sparkline": () => (
    <DualSparkline data={[3, 6, 2, 8, 5]} compare={[2, 4, 5, 3, 7]} strings={S} />
  ),
  "queue-depth": () => <QueueDepth data={[3, 6, 2, 8, 5]} capacity={10} strings={S} />,
  "burn-chart": () => (
    <BurnChart data={{ plan: [10, 8, 6, 4, 2], actual: [10, 9, 7, 6, 3] }} strings={S} />
  ),
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

/**
 * Alphabetic runs left after every sentinel is removed. Two or more letters, so
 * a stray unit initial is not reported as prose; `«key»` tokens and the digits
 * that `format` produces are stripped first.
 */
function englishLeaks(text: string): string[] {
  const withoutSentinels = text.replace(/«[^»]*»/g, " ");
  return [...new Set(withoutSentinels.match(/[A-Za-z]{2,}/g) ?? [])];
}

async function renderedText(host: HTMLElement): Promise<string> {
  const box = host.getBoundingClientRect();
  const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
  let text = "";
  const collect = (): void => {
    // Everything the user can perceive: SVG labels, the readout chip, and the
    // live region a screen reader hears.
    text += ` ${host.textContent ?? ""}`;
    text += ` ${host.getAttribute("aria-label") ?? ""}`;
  };
  host.focus();
  collect();
  for (let i = 0; i <= 8; i++) {
    const x = box.left + (box.width * i) / 8;
    const y = box.top + box.height / 2;
    pointer(host, "pointerenter", x, y);
    pointer(host, "pointermove", x, y);
    await settle();
    collect();
  }
  for (let i = 0; i < 8; i++) {
    host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await settle();
    collect();
  }
  return text;
}

describe("rendered chart text contains no hardcoded English", () => {
  for (const [name, renderChart] of Object.entries(CASES)) {
    it(`${name} — all prose comes from \`strings\``, async () => {
      const screen = await render(renderChart());
      const host = screen.container.querySelector<HTMLElement>('span[role="img"][tabindex]');
      expect(host, "interactive host wrapper").not.toBeNull();

      const text = await renderedText(host!);
      // Non-vacuity: if no sentinel ever rendered, the chart never consulted
      // `strings` in this run and "no leaks" would be true and meaningless.
      expect(text, "chart rendered at least one string from `strings`").toContain("«");

      const leaks = englishLeaks(text);
      expect(leaks, `hardcoded English in rendered output: ${leaks.join(", ")}`).toEqual([]);
    });
  }
});

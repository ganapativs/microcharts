// Hostile-but-ordinary inputs: the "a chart must never break" bar.
//
// The shared edge fixtures cover hostile DATA (empty, nulls, NaN, ±Infinity).
// This suite covers hostile CONFIG — the props a host computes rather than
// types by hand: a window that is momentarily 0, a `period` from an empty
// input field (`Number("")` → NaN), a `total` holding a raw count, a domain
// derived with `Math.min(...)` over a series that contains a NaN, a `parent`
// graph with a cycle. Each case below hung, crashed, or silently emitted
// NaN coordinates before the guards these tests pin.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { scaleLinear, maxOf, minOf } from "../core/scale.js";
import { criticalPath } from "../charts/trace-fold/geometry.js";
import { tapeGaugeGeometry } from "../charts/tape-gauge/geometry.js";
import { cycleGeometry } from "../charts/cycle-plot/geometry.js";
import { ActivityGrid } from "../charts/activity-grid/index.js";
import { PictogramRow } from "../charts/pictogram-row/index.js";
import { Progress } from "../charts/progress/index.js";
import { Thermometer } from "../charts/thermometer/index.js";
import { HeartbeatBlip } from "../charts/heartbeat-blip/index.js";
import { TapeGauge } from "../charts/tape-gauge/index.js";
import { Sparkline } from "../charts/sparkline/index.js";
import { Waterfall } from "../charts/waterfall/index.js";
import { CyclePlot } from "../charts/cycle-plot/index.js";
import { TraceFold } from "../charts/trace-fold/index.js";

/** Every numeric attribute a chart emitted, so "NaN" can't hide in one of them. */
function attrsOf(markup: string): string[] {
  return [
    ...markup.matchAll(/(?:d|x|y|cx|cy|x1|x2|y1|y2|width|height|fill-opacity)="([^"]*)"/g),
  ].map((m) => m[1]!);
}

function expectNoNaN(markup: string, what: string): void {
  const bad = attrsOf(markup).filter((v) => /NaN|Infinity/.test(v));
  expect(bad, `${what} emitted non-finite coordinates: ${bad.slice(0, 3).join(", ")}`).toEqual([]);
}

describe("scaleLinear survives an unrepresentable domain", () => {
  // A slope of exactly 0 is finite, so the old guard passed and
  // `Infinity * 0` → NaN reached the emitted coordinate.
  it("infinite span maps to the range midpoint, never NaN", () => {
    expect(scaleLinear([-Infinity, Infinity], [0, 100])(5)).toBe(50);
    expect(scaleLinear([-1e308, 1e308], [0, 100])(1e308)).toBe(50);
  });

  it("a finite domain still scales exactly", () => {
    expect(scaleLinear([0, 10], [0, 100])(2.5)).toBe(25);
  });
});

describe("maxOf / minOf replace the spread (stack-safe, same semantics)", () => {
  it("agrees with Math.max/min on ordinary input, seed included", () => {
    expect(maxOf([3, 9, 4])).toBe(Math.max(3, 9, 4));
    expect(minOf([3, 9, 4])).toBe(Math.min(3, 9, 4));
    expect(maxOf([], 0)).toBe(0);
    expect(maxOf([-5, -2], 0)).toBe(0);
    expect(minOf([5, 2], 0)).toBe(0);
  });

  it("propagates NaN exactly like the spread form", () => {
    expect(maxOf([1, NaN, 3])).toBeNaN();
    expect(minOf([1, NaN, 3])).toBeNaN();
  });

  it("handles an array far past the spread's argument limit", () => {
    const big = Array.from<number>({ length: 300_000 }).fill(1);
    big[123_456] = 7;
    expect(maxOf(big)).toBe(7); // Math.max(...big) throws RangeError here
  });
});

describe("no chart hangs on a pathological config", () => {
  // Each of these spun until the tab died before the fix, so a plain
  // assertion IS the regression test: reaching it at all means termination.
  it("TapeGauge: a step smaller than one ULP of the value terminates", () => {
    const geo = tapeGaugeGeometry({
      value: 1e17,
      span: 10,
      zones: [],
      tick: null,
      width: 46,
      height: 60,
      orientation: "vertical",
    });
    // Reaching this line at all is the assertion — the loop used to never end.
    // The emitted tick path is bounded because the tick count is.
    expect(geo.tickPath.length).toBeLessThan(20_000);
  });

  it("TapeGauge: a non-finite value renders without ticks rather than hanging", () => {
    const markup = renderToStaticMarkup(<TapeGauge value={Infinity} span={60} />);
    expectNoNaN(markup, "TapeGauge(Infinity)");
  });

  it("TraceFold: a span parented to itself terminates", () => {
    const flags = criticalPath([{ label: "root", start: 0, duration: 10, depth: 0, parent: 0 }]);
    expect(flags).toEqual([true]);
  });

  it("TraceFold: a two-span parent cycle terminates", () => {
    const flags = criticalPath([
      { label: "a", start: 0, duration: 10, depth: 0, parent: 1 },
      { label: "b", start: 0, duration: 10, depth: 1, parent: 0 },
    ]);
    expect(flags.some(Boolean)).toBe(true);
  });
});

describe("an unbounded count saturates instead of exhausting memory", () => {
  it("PictogramRow: a raw count as `total` renders a bounded number of units", () => {
    const markup = renderToStaticMarkup(<PictogramRow value={5} total={3_000_000} />);
    const units = markup.match(/<(circle|rect)/g)?.length ?? 0;
    expect(units).toBeGreaterThan(0);
    expect(units).toBeLessThanOrEqual(220);
  });

  it("Progress: a huge `segments` renders a bounded number of slots", () => {
    const markup = renderToStaticMarkup(<Progress value={0.4} segments={1_000_000} />);
    // One <g> per slot (each holds a track rect and, when filled, a fill rect).
    expect(markup.match(/<g\b/g)?.length ?? 0).toBeLessThanOrEqual(200);
  });

  it("Thermometer: a huge `ticks` renders a bounded number of ticks", () => {
    const markup = renderToStaticMarkup(<Thermometer value={40} ticks={1_000_000} />);
    expect(markup.match(/<line/g)?.length ?? 0).toBeLessThanOrEqual(220);
  });
});

describe("a config value a host can compute never breaks the render", () => {
  it("CyclePlot: period={NaN} renders instead of throwing", () => {
    // `Number("")` on an empty input field is the ordinary way to get here.
    expect(cycleGeometry({ width: 120, height: 40, data: [1, 2, 3], period: NaN })).not.toBeNull();
    expectNoNaN(
      renderToStaticMarkup(<CyclePlot data={[1, 2, 3]} period={NaN} />),
      "CyclePlot(NaN period)",
    );
  });

  it("HeartbeatBlip: window={0} keeps the spikes on the plot", () => {
    const markup = renderToStaticMarkup(<HeartbeatBlip events={[0]} now={0} window={0} />);
    expectNoNaN(markup, "HeartbeatBlip(window 0)");
  });

  it("HeartbeatBlip: a non-finite window never reaches the accessible name", () => {
    const markup = renderToStaticMarkup(<HeartbeatBlip events={[0]} now={0} window={NaN} />);
    expect(markup).not.toMatch(/NaN|Infinity/);
  });

  it("ActivityGrid: a NaN domain does not paint NaN opacities", () => {
    const markup = renderToStaticMarkup(<ActivityGrid data={[3, 7, 2, 9]} domain={[NaN, NaN]} />);
    expectNoNaN(markup, "ActivityGrid(NaN domain)");
  });
});

describe("finite inputs whose arithmetic overflows still render", () => {
  it("Sparkline: an infinite domain renders on the midline", () => {
    expectNoNaN(
      renderToStaticMarkup(<Sparkline data={[1, 2, 3]} domain={[-Infinity, Infinity]} />),
      "Sparkline(infinite domain)",
    );
  });

  it("Waterfall: a running total past 1e308 renders", () => {
    expectNoNaN(
      renderToStaticMarkup(
        <Waterfall
          data={[
            { label: "a", value: 1e308 },
            { label: "b", value: 1e308 },
            { label: "c", value: -5e307 },
          ]}
        />,
      ),
      "Waterfall(overflowing total)",
    );
  });

  it("TraceFold: a span whose end overflows renders", () => {
    expectNoNaN(
      renderToStaticMarkup(
        <TraceFold data={[{ label: "a", start: 1e308, duration: 1e308, depth: 0 }]} />,
      ),
      "TraceFold(overflowing end)",
    );
  });
});

import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { ChangePoint } from "./change-point/index.js";
import { BreathingDot } from "./breathing-dot/index.js";
import { ActivityGrid } from "./activity-grid/index.js";
import { BumpStrip } from "./bump-strip/index.js";
import { Ohlc } from "./ohlc/index.js";
import { NetFlow } from "./net-flow/index.js";
import { PercentileLadder } from "./percentile-ladder/index.js";
import { SegmentedBar } from "./segmented-bar/index.js";
import { ShiftHistogram } from "./shift-histogram/index.js";
import { RetentionCurve } from "./retention-curve/index.js";
import { Funnel } from "./funnel/index.js";
import { DualWindowMeter } from "./dual-window-meter/index.js";
import { GardenGrid } from "./garden-grid/index.js";
import { TreeRings } from "./tree-rings/index.js";
import { TraceFold } from "./trace-fold/index.js";
import { VolumeProfile } from "./volume-profile/index.js";
import { CitySkyline } from "./city-skyline/index.js";
import { DataDiff } from "./data-diff/index.js";
import { DotPlot } from "./dot-plot/index.js";
import { Delta } from "./delta/index.js";
import { DualSparkline } from "./dual-sparkline/index.js";
import { Sparkline } from "./sparkline/index.js";
import { SparkBar } from "./sparkbar/index.js";
import { Slope } from "./slope/index.js";
import { Thermometer } from "./thermometer/index.js";
import { TapeGauge } from "./tape-gauge/index.js";
import { Honeycomb } from "./honeycomb/index.js";
import { MicroDonut } from "./micro-donut/index.js";
import { Hourglass } from "./hourglass/index.js";
import { GradedBand } from "./graded-band/index.js";
import { HeartbeatBlip } from "./heartbeat-blip/index.js";
import { HistogramStrip } from "./histogram-strip/index.js";
import { Horizon } from "./horizon/index.js";
import { Hypnogram } from "./hypnogram/index.js";
import { IconArray } from "./icon-array/index.js";
import { MicroBox } from "./micro-box/index.js";
import { CyclePlot } from "./cycle-plot/index.js";
import { ControlStrip } from "./control-strip/index.js";
import { PolarClock } from "./polar-clock/index.js";

// One sweep over the 2026-09 audit: every `it` below was a shipped defect of
// one of four kinds — a label gated against the wrong bound (spills or stacks),
// a gate that counted inputs instead of painted marks, a non-finite input
// reaching the markup or being replaced by a fabricated finite value, and a
// client basis that disagreed with the static it composes. Per-chart tests
// carry the chart's own contract; this file carries the cross-chart pattern.

const draw = (ui: React.ReactNode) => {
  const { container } = render(ui);
  const svg = container.querySelector("svg");
  const [, , vw, vh] = (svg?.getAttribute("viewBox") ?? "0 0 0 0").split(" ").map(Number);
  const texts = [...container.querySelectorAll("text")];
  const html = container.innerHTML;
  const name =
    svg?.getAttribute("aria-label") ??
    container.querySelector("[aria-label]")?.getAttribute("aria-label") ??
    "";
  return { container, svg, vw: vw!, vh: vh!, texts, html, name };
};
afterEach(cleanup);

/** Estimated horizontal extent of a text node from its anchor + 0.62 em/char. */
const xExtent = (t: SVGTextElement): [number, number] => {
  const x = Number(t.getAttribute("x"));
  const fs = Number(t.getAttribute("font-size"));
  const w = (t.textContent ?? "").length * 0.62 * fs;
  const a = t.getAttribute("text-anchor");
  return a === "end" ? [x - w, x] : a === "middle" ? [x - w / 2, x + w / 2] : [x, x + w];
};
const yExtent = (t: SVGTextElement): [number, number] => {
  const y = Number(t.getAttribute("y"));
  const fs = Number(t.getAttribute("font-size"));
  return [y - fs / 2, y + fs / 2];
};

const inside = (r: ReturnType<typeof draw>) => {
  for (const t of r.texts) {
    const [x0, x1] = xExtent(t);
    const [y0, y1] = yExtent(t);
    expect(x0, `"${t.textContent}" left`).toBeGreaterThanOrEqual(-0.01);
    expect(x1, `"${t.textContent}" right`).toBeLessThanOrEqual(r.vw + 0.01);
    expect(y0, `"${t.textContent}" top`).toBeGreaterThanOrEqual(-0.01);
    expect(y1, `"${t.textContent}" bottom`).toBeLessThanOrEqual(r.vh + 0.01);
  }
};

describe("labels gated against the box they actually sit in", () => {
  it("<BreathingDot> reserves for a fraction-digit format, not just '100%'", () => {
    inside(
      draw(<BreathingDot value={0.1234} label="value" format={{ maximumFractionDigits: 2 }} />),
    );
  });
  it("<BumpStrip> drops the rank labels in a box shorter than the font", () => {
    expect(draw(<BumpStrip data={[3, 2, 1]} height={6} />).texts).toHaveLength(0);
  });
  it("<Ohlc label='last'> drops a gutter wider than half the box, and a label a 5-tall box can't seat", () => {
    const p = { open: 1234, high: 1240, low: 1230, close: 1234 };
    const narrow = draw(<Ohlc data={[p, p, p]} width={20} height={16} label="last" />);
    for (const el of narrow.container.querySelectorAll("rect, line")) {
      for (const a of ["x", "x1", "x2"]) {
        const v = el.getAttribute(a);
        if (v !== null) expect(Number(v), a).toBeGreaterThanOrEqual(0);
      }
    }
    expect(draw(<Ohlc data={[p, p, p]} width={80} height={5} label="last" />).texts).toHaveLength(
      0,
    );
  });
  it("<NetFlow mode='bars'> clamps a column to the half-height under a short domain", () => {
    const r = draw(
      <NetFlow
        data={[
          { in: 50, out: 40 },
          { in: 5, out: 5 },
        ]}
        mode="bars"
        domain={[0, 10]}
        width={80}
        height={20}
      />,
    );
    for (const rect of r.container.querySelectorAll("rect")) {
      const y = Number(rect.getAttribute("y"));
      const h = Number(rect.getAttribute("height"));
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y + h).toBeLessThanOrEqual(20);
    }
  });
  it("<SegmentedBar> drops in-segment labels in a box shorter than the font", () => {
    const data = [
      { label: "a", value: 80 },
      { label: "b", value: 20 },
    ];
    expect(draw(<SegmentedBar data={data} width={60} height={6} />).texts).toHaveLength(0);
    inside(draw(<SegmentedBar data={data} labelSize={12} />));
  });
  it("<ShiftHistogram> drops the shift label — and its gutter — in a 6-tall box", () => {
    const r = draw(
      <ShiftHistogram data={{ before: [1, 2, 3], after: [2, 3, 4] }} width={80} height={6} />,
    );
    expect(r.texts).toHaveLength(0);
    expect(r.vw).toBe(80);
  });
  it("<Funnel> drops the labels when their band would leave the columns no height", () => {
    const r = draw(
      <Funnel
        data={[
          { label: "a", value: 100 },
          { label: "b", value: 50 },
        ]}
        height={8}
      />,
    );
    expect(r.texts).toHaveLength(0);
    const hs = [...r.container.querySelectorAll("rect")].map((x) =>
      Number(x.getAttribute("height")),
    );
    expect(hs.length).toBeGreaterThan(0);
    for (const h of hs) expect(h).toBeGreaterThan(0);
  });
  it("<DualWindowMeter> paints the fast reading alone when the slow window is unfilled", () => {
    const r = draw(
      <DualWindowMeter
        data={Array.from({ length: 20 }, (_, i) => 10 + (i % 3))}
        target={11}
        height={16}
      />,
    );
    expect(r.texts.length).toBeGreaterThan(0);
  });
  it("<TreeRings label='last'> drops a raised label the disc cannot seat", () => {
    expect(draw(<TreeRings data={[1, 2, 3]} label="last" labelSize={30} />).texts).toHaveLength(0);
  });
  it("<VolumeProfile> clamps the POC label by half the font in an edge row", () => {
    inside(
      draw(
        <VolumeProfile
          width={80}
          data={[100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 111, 111, 111, 111]}
        />,
      ),
    );
    inside(
      draw(
        <VolumeProfile
          width={80}
          data={[100, 100, 100, 100, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111]}
        />,
      ),
    );
  });
  it("<CitySkyline label='value'> drops a numeral wider than its building", () => {
    inside(draw(<CitySkyline data={[{ label: "a", value: 1000 }]} label="value" />));
  });
  it("<DataDiff label='totals'> keeps a wide footer inside the box (or drops it)", () => {
    inside(
      draw(
        <DataDiff
          data={[{ key: "a", added: 1200, removed: 3400 }]}
          label="totals"
          height={34}
          width={80}
        />,
      ),
    );
  });
  it("<DotPlot label='value'> gates the numerals on the font, not only an 8-unit pitch", () => {
    const data = [
      { label: "a", value: 1 },
      { label: "b", value: 2 },
    ];
    inside(draw(<DotPlot data={data} height={16} label="value" labelSize={12} />));
  });
  it("<Sparkline> / <SparkBar> drop a label the box cannot hold instead of pushing the plot out", () => {
    const fmt = { style: "currency", currency: "USD" } as const;
    const line = draw(
      <Sparkline data={[1234567, 1234567]} width={40} height={20} label="last" format={fmt} />,
    );
    inside(line);
    for (const el of line.container.querySelectorAll("path, circle")) {
      const d = el.getAttribute("d") ?? el.getAttribute("cx") ?? "";
      expect(d, "no negative x").not.toMatch(/(^|[ML])-/);
    }
    inside(
      draw(<SparkBar data={[1234567, 1234567]} width={40} height={20} label="last" format={fmt} />),
    );
  });
  it("<Slope> density counts the rows that paint, not the rows in the array", () => {
    const rows = [10, 20, 30, 40, 50, 60].map((v, i) => ({ label: `r${i}`, from: v, to: 70 - v }));
    const a = draw(<Slope data={rows} width={40} height={40} label="value" />).texts.length;
    const b = draw(
      <Slope
        data={[...rows, { label: "g", from: NaN, to: NaN }]}
        width={40}
        height={40}
        label="value"
      />,
    ).texts.length;
    expect(a).toBeGreaterThan(0);
    expect(b).toBe(a);
  });
  it("<Thermometer orientation='horizontal'> seats the value label inside its band", () => {
    inside(draw(<Thermometer value={50} orientation="horizontal" label="value" />));
    inside(draw(<Thermometer value={50} orientation="horizontal" label="value" fontSize={12} />));
  });
  it("<TapeGauge> never draws a rate chevron outside the box", () => {
    const uis = [
      () => (
        <TapeGauge
          value={12345}
          rate={5000}
          span={100}
          width={46}
          height={60}
          orientation="horizontal"
        />
      ),
      () => <TapeGauge value={12345} rate={5000} span={100} height={20} />,
    ];
    for (const ui of uis) {
      const r = draw(ui());
      for (const p of r.container.querySelectorAll("path")) {
        const d = p.getAttribute("d") ?? "";
        if (!/l[-\d.]+ [-\d.]+l/.test(d)) continue; // chevrons only
        const m = d.match(/^M([-\d.]+) ([-\d.]+)/)!;
        const [x, y] = [Number(m[1]), Number(m[2])];
        expect(x).toBeGreaterThanOrEqual(-0.01);
        expect(x + 2).toBeLessThanOrEqual(r.vw + 0.01);
        expect(y).toBeGreaterThanOrEqual(-2.01);
        expect(y + 4).toBeLessThanOrEqual(r.vh + 2.01);
      }
    }
  });
  it("<Honeycomb> and <MicroDonut> drop a label wider than the space it is centred on", () => {
    expect(draw(<Honeycomb value={1} total={1} label="count" />).texts).toHaveLength(0);
    expect(draw(<Honeycomb value={2} total={2} label="percent" />).texts).toHaveLength(0);
    expect(
      draw(<MicroDonut data={[{ label: "a", value: 1234567 }]} label="total" />).texts,
    ).toHaveLength(0);
    expect(
      draw(<MicroDonut data={[{ label: "a", value: 12 }]} label="total" />).texts,
    ).toHaveLength(1);
  });
});

describe("non-finite input never fabricates a number", () => {
  it("<ChangePoint> reads '—' for a ratio with no basis, never '0%' or 'NaN%'", () => {
    const zero = draw(<ChangePoint data={[0, 0, 0, 0, 5, 5, 5, 5]} breaks={[4]} label="delta" />);
    expect(zero.name).not.toContain("0%");
    expect(zero.name).toContain("—");
    const gap = draw(
      <ChangePoint data={[1, 2, 3, 4, NaN, NaN, NaN, NaN]} breaks={[4]} label="delta" />,
    );
    expect(gap.html).not.toContain("NaN");
    expect(gap.name).not.toContain("NaN");
  });
  it("<ActivityGrid> paints a value under domain[0] at level 1, never a negative opacity", () => {
    const r = draw(<ActivityGrid data={[1, 150]} domain={[50, 100]} layout="strip" />);
    for (const el of r.container.querySelectorAll("[fill-opacity]"))
      expect(Number(el.getAttribute("fill-opacity"))).toBeGreaterThanOrEqual(0);
  });
  it("<PercentileLadder> states no multiple over a zero median", () => {
    const r = draw(<PercentileLadder data={[0, 0, 0, 0, 0, 0, 0, 0, 0, 10]} />);
    expect(r.name).not.toContain("0×");
    expect(r.name).toContain("—");
  });
  it("<RetentionCurve> formats the value the data holds, not a 2-dp rounding of it", () => {
    const r = draw(
      <RetentionCurve
        data={[1, 0.4167]}
        plateau={false}
        format={{ style: "percent", maximumFractionDigits: 1 }}
      />,
    );
    expect(r.name).toContain("41.7%");
  });
  it("<GardenGrid> shows a positive value under domain[0] as step 1, not a missing plant", () => {
    const r = draw(<GardenGrid data={[5, 15, 20]} rows={1} domain={[10, 20]} />);
    expect(r.html).not.toMatch(/step -\d/);
    expect(r.container.querySelectorAll("circle, path").length).toBeGreaterThanOrEqual(3);
  });
  it("<TraceFold> keeps every span in the box when the starts span past float range", () => {
    const r = draw(
      <TraceFold
        data={[
          { label: "a", start: -1e308, duration: 1, depth: 0 },
          { label: "b", start: 1e308, duration: 1, depth: 0 },
        ]}
      />,
    );
    expect(r.html).not.toMatch(/NaN|Infinity/);
  });
  it("<CitySkyline label='value'> never prints '0' for a negative building", () => {
    const r = draw(<CitySkyline data={[{ label: "a", value: -5 }]} label="value" />);
    expect(r.texts.map((t) => t.textContent)).not.toContain("0");
  });
  it("<Delta from={0}> shows the absolute change, not a percent of nothing", () => {
    const { container } = render(<Delta value={12} from={0} />);
    expect(container.textContent).not.toContain("%");
    expect(container.textContent).toContain("12");
    cleanup();
  });
  it("<DualSparkline> / describeSeries state the absolute change when the ratio overflows", () => {
    const r = draw(<DualSparkline data={[5e-324, 1]} compare={[1, 2]} />);
    expect(r.name).not.toMatch(/Infinity|∞/);
    expect(draw(<Sparkline data={[5e-324, 1]} />).name).not.toMatch(/Infinity|∞/);
  });
  it("<Thermometer value={±Infinity}> paints no fill under its 'No data.' name", () => {
    // NaN already paints the empty tube; ±Infinity must render byte-identically
    const empty = draw(<Thermometer value={NaN} />).html;
    for (const v of [Infinity, -Infinity]) {
      const r = draw(<Thermometer value={v} />);
      expect(r.name).toBe("No data.");
      expect(r.html).toBe(empty);
    }
  });
  it("<Hourglass value={NaN}> is no data in the static too", () => {
    const r = draw(<Hourglass value={NaN} label="elapsed" />);
    expect(r.name).toBe("No data.");
    expect(r.texts).toHaveLength(0);
  });
  it("<CyclePlot> / <ControlStrip> survive sums that overflow", () => {
    expect(
      draw(<CyclePlot data={[1e308, 1e308, 1, 1, 1, 1, 1e308, 1e308]} period={4} />).html,
    ).not.toMatch(/Infinity|NaN/);
    expect(draw(<ControlStrip data={[1e308, -1e308, 1e308]} />).name).not.toMatch(/∞|Infinity/);
  });
  it("<PolarClock now={1.5}> renders instead of throwing", () => {
    expect(() => draw(<PolarClock data={[1, 2, 3, 4]} now={1.5} />)).not.toThrow();
  });
  it("a NaN side never reaches the markup under the 1×1 fallback frame", () => {
    const ui = [
      () => <GradedBand data={[1, 2, 3]} width={NaN} />,
      () => <GradedBand data={[1, 2, 3]} height={NaN} />,
      () => <HeartbeatBlip events={[1, 2, 3]} width={NaN} />,
      () => <HistogramStrip data={[1, 2, 3]} width={NaN} />,
      () => <HistogramStrip data={[1, 2, 3]} height={NaN} />,
      () => <Horizon data={[1, 2, 3]} width={NaN} />,
      () => (
        <Hypnogram
          data={[
            { t: 0, state: "wake" },
            { t: 1, state: "rem" },
          ]}
          width={NaN}
        />
      ),
      () => <IconArray value={0.3} width={NaN} />,
      () => <IconArray value={0.3} height={NaN} />,
      () => <MicroBox data={[1, 2, 3, 4]} width={NaN} />,
    ];
    for (const u of ui) expect(draw(u()).html).not.toMatch(/NaN/);
  });
});

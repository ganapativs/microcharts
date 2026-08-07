// Every chart that paints an in-SVG label takes `labelSize`, and honors it.
//
// The defect this gate exists for: `labelFont` floors label size at 7 viewBox
// units, and an app had no way to raise it. The token that looked like the lever
// — `--mc-label-size` — is written by each chart onto its OWN host, so setting it
// on a wrapper worked on the charts with no labels and was silently overridden on
// the ~80 that have them. One name, two meanings. The floor cannot move through
// CSS either: the same number reserves the label's gutter inside `geometry.ts`,
// which is pure, React-free and never sees a custom property, and a font larger
// than its gutter paints into the page (`.mc-root` is `overflow: visible`). So it
// travels as a PROP, and this file holds the three halves of that contract.
//
// 1. COVERAGE, read from source, like readout-presence next door: a chart that
//    renders `<text>` accepts `labelSize` on both entries, or is a documented
//    exception. A render matrix cannot catch the chart that never took the prop.
// 2. HONORED, by rendering: at a raised floor the painted `font-size` is at
//    least what was asked, or the label DROPPED. Shrinking back under the floor
//    is the one answer the prop forbids.
// 3. CONTAINED, by arithmetic on the painted attributes: a raised floor may not
//    push text past the viewBox. `label-containment.browser.test.tsx` measures
//    the same rule in a real browser with the real stylesheet at DEFAULT size;
//    this covers the raised one across the whole catalog, which a per-chart
//    fixture list would not.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, type ComponentType } from "react";

import { Bullet } from "../charts/bullet/index.js";
import { DotPlot } from "../charts/dot-plot/index.js";
import { Funnel } from "../charts/funnel/index.js";
import { HeatCell } from "../charts/heat-cell/index.js";
import { MicroDonut } from "../charts/micro-donut/index.js";
import { MiniBar } from "../charts/mini-bar/index.js";
import { Progress } from "../charts/progress/index.js";
import { SegmentedBar } from "../charts/segmented-bar/index.js";
import { SparkBar } from "../charts/sparkbar/index.js";
import { Sparkline } from "../charts/sparkline/index.js";
import { TallyMarks } from "../charts/tally-marks/index.js";
import { Thermometer } from "../charts/thermometer/index.js";
import { TrendArrow } from "../charts/trend-arrow/index.js";
import { Waterfall } from "../charts/waterfall/index.js";

const CHARTS_DIR = join(import.meta.dirname, "..", "charts");

/**
 * Charts whose text is the MARK, not a label: an explicit `fontSize` prop sets
 * it outright, well above any legibility floor, and there is no derived size for
 * `labelSize` to raise. A second name for one number is the grammar violation
 * this prop exists to end, so they stay out. Every entry needs a reason.
 */
const NO_LABEL_SIZE: Record<string, string> = {
  "fat-digits": "the numeral IS the chart; `fontSize` sets it, default 14 units",
  "fill-word": "the word IS the chart; `fontSize` sets it, default 12 units",
};

const charts = readdirSync(CHARTS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("__"))
  .map((d) => d.name)
  .map((name) => {
    const read = (file: string): string => {
      try {
        return readFileSync(join(CHARTS_DIR, name, file), "utf8");
      } catch {
        return "";
      }
    };
    return { name, index: read("index.tsx"), client: read("client.tsx") };
  });

/** Charts that put text in the SVG. `<text>` in either entry — a few paint their
 *  only label from the interactive overlay. */
const painters = charts.filter((c) => /<text[\s>]/.test(c.index) || /<text[\s>]/.test(c.client));

describe("labelSize is offered wherever a label is painted", () => {
  it("covers the whole catalog", () => {
    // Guards the guard: a broken read here would assert nothing at all.
    expect(charts.length).toBeGreaterThan(100);
    expect(painters.length).toBeGreaterThan(75);
  });

  for (const { name, index, client } of painters) {
    describe(name, () => {
      it("declares `labelSize` (or is a documented exception)", () => {
        if (index.includes("labelSize?: number | undefined") || index.includes('| "labelSize"')) {
          return;
        }
        expect(
          NO_LABEL_SIZE[name],
          `${name}: paints <text> but takes no \`labelSize\`. Thread it into ` +
            `geometry as \`labelFont\`'s \`min\`, or add it to NO_LABEL_SIZE ` +
            `with a reason`,
        ).toBeTruthy();
      });

      it("threads it into the size the label is laid out at", () => {
        if (NO_LABEL_SIZE[name]) return;
        // The prop has to REACH the sizing, not merely be accepted. Both entries
        // compute the same gutters from pure geometry, so an interactive entry
        // that recomputes a font without the floor draws its overlay on a plot
        // box the static child never used.
        expect(
          /labelSize/.test(index) && index.split("labelSize").length > 2,
          `${name}: declares \`labelSize\` and never reads it`,
        ).toBe(true);
        if (/labelFont\(|rowLabelFont\(/.test(client)) {
          expect(
            /labelSize/.test(client),
            `${name}: the interactive entry re-derives a label font without ` +
              `\`labelSize\`, so its overlay would sit on a different plot box`,
          ).toBe(true);
        }
      });
    });
  }
});

/** Nothing may write the app-facing token onto a chart host — that collision is
 *  the defect. Charts pin `--mc-label-px`, the private channel `.mc-root text`
 *  reads first; `--mc-label-size` stays the app's to set. */
describe("the two label-size tokens stay separate", () => {
  for (const { name, index, client } of charts) {
    it(`${name} pins --mc-label-px, never --mc-label-size`, () => {
      expect(
        /--mc-label-size/.test(index) || /--mc-label-size/.test(client),
        `${name}: writes --mc-label-size on its own host, which is what made an ` +
          `app setting that token a no-op on every chart with a label`,
      ).toBe(false);
    });
  }
});

// --- honored + contained, by rendering ------------------------------------

const SERIES = [4, 9, 2, 7, 5, 8, 3];

/**
 * Painted `<text>` marks, with the box each one claims.
 *
 * The horizontal run is the library's own per-char over-estimate (`textGutter`,
 * 0.62 units per unit of font size) placed by the mark's own `text-anchor`, and
 * the vertical one is the 0.78/0.22 ascent split `labelFitsY` gates on — so a
 * reading here agrees with the arithmetic the chart reserved its gutter with.
 */
interface Painted {
  size: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function texts(html: string): Painted[] {
  const out: Painted[] = [];
  for (const m of html.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
    const attrs = m[1] ?? "";
    const num = (n: string): number => Number(new RegExp(`\\b${n}="([^"]*)"`).exec(attrs)?.[1]);
    const size = num("font-size");
    if (!Number.isFinite(size)) continue;
    const chars = (m[2] ?? "").replace(/<[^>]*>/g, "").trim().length;
    const run = chars * size * 0.62;
    const x = num("x") || 0;
    const y = num("y") || 0;
    const anchor = /text-anchor="(\w+)"/.exec(attrs)?.[1] ?? "start";
    const left = anchor === "middle" ? x - run / 2 : anchor === "end" ? x - run : x;
    // `dominant-baseline: central` straddles y; otherwise the baseline is
    // alphabetic and the ascent sits above it.
    const central = /dominant-baseline="(central|middle)"/.test(attrs);
    out.push({
      size,
      left,
      right: left + run,
      top: y - size * (central ? 0.5 : 0.78),
      bottom: y + size * (central ? 0.5 : 0.22),
    });
  }
  return out;
}

const RAISED = 10;

/**
 * Charts that render from a plain number series and a value label. Enough of the
 * catalog to prove the rule holds through both the `labelFont` path and the
 * bespoke fitters (sparkline, sparkbar), without a fixture per chart — the
 * source-level halves above are what guarantee catalog-wide coverage.
 */
/**
 * Rendered cases. Imported by name rather than resolved from a glob — the
 * source-level halves above are what guarantee catalog-wide coverage, and these
 * exist to exercise every SHAPE of label sizing the catalog has: the shared
 * `labelFont` path, the two bespoke endpoint fitters (Sparkline, SparkBar), a
 * row-label stack, a fixed-size numeral, and a label seated on a solid mark.
 */
const RENDERED: [string, ComponentType<Record<string, unknown>>, Record<string, unknown>][] = [
  ["sparkline", Sparkline as never, { data: SERIES, label: "last", width: 80, height: 20 }],
  ["sparkbar", SparkBar as never, { data: SERIES, label: "last", width: 80, height: 20 }],
  [
    "mini-bar",
    MiniBar as never,
    {
      data: [
        { label: "A", value: 4 },
        { label: "B", value: 9 },
      ],
      label: "max",
      width: 120,
      height: 24,
    },
  ],
  ["progress", Progress as never, { value: 0.62, label: "percent" }],
  ["bullet", Bullet as never, { value: 62, target: 80, label: "value" }],
  [
    "waterfall",
    Waterfall as never,
    {
      data: [
        { label: "A", value: 10 },
        { label: "B", value: -3 },
        { label: "C", value: 5 },
      ],
      label: "delta",
      width: 160,
      height: 34,
    },
  ],
  ["trend-arrow", TrendArrow as never, { value: 12.5, showValue: true }],
  ["thermometer", Thermometer as never, { value: 21, domain: [0, 40], label: "value" }],
  ["heat-cell", HeatCell as never, { value: 4, domain: [0, 5], label: "value" }],
  ["tally-marks", TallyMarks as never, { value: 31 }],
  ["micro-donut", MicroDonut as never, { data: [4, 3, 2], label: "total" }],
  [
    "segmented-bar",
    SegmentedBar as never,
    {
      data: [
        { label: "A", value: 50 },
        { label: "B", value: 30 },
        { label: "C", value: 20 },
      ],
      label: "percent",
      width: 160,
    },
  ],
  [
    "funnel",
    Funnel as never,
    { data: [{ value: 100 }, { value: 60 }, { value: 20 }], label: "value" },
  ],
  [
    "dot-plot",
    DotPlot as never,
    {
      data: [
        { label: "NORTH", value: 120 },
        { label: "SOUTH", value: 90 },
      ],
      label: "value",
    },
  ],
];

describe("a raised labelSize is honored, and still contained", () => {
  for (const [name, Chart, props] of RENDERED) {
    it(`${name}: paints at or above the floor, or drops the label`, () => {
      const base = renderToStaticMarkup(createElement(Chart, { ...props, title: name }));
      const raised = renderToStaticMarkup(
        createElement(Chart, { ...props, title: name, labelSize: RAISED }),
      );
      // Non-vacuity: the fixture must paint something at the default, or the
      // raised case proves nothing.
      expect(texts(base).length, `${name}: fixture paints no label to raise`).toBeGreaterThan(0);

      // The one answer the prop forbids is shrinking back under the floor.
      for (const t of texts(raised)) {
        expect(
          t.size,
          `${name}: painted a label at ${t.size} under a labelSize of ${RAISED} — ` +
            `a floor the box cannot seat must DROP the label, never shrink it`,
        ).toBeGreaterThanOrEqual(RAISED);
      }
    });

    it(`${name}: keeps its text inside the viewBox at the raised floor`, () => {
      const html = renderToStaticMarkup(
        createElement(Chart, { ...props, title: name, labelSize: RAISED }),
      );
      const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(html);
      expect(vb, `${name}: no viewBox`).toBeTruthy();
      const w = Number(vb![1]);
      const h = Number(vb![2]);

      for (const t of texts(html)) {
        expect(
          t.left,
          `${name}: text starts at ${t.left}, left of the viewBox`,
        ).toBeGreaterThanOrEqual(-0.5);
        expect(
          t.right,
          `${name}: text runs to ${t.right} past a ${w}-unit viewBox`,
        ).toBeLessThanOrEqual(w + 0.5);
        expect(t.bottom, `${name}: text drops past a ${h}-unit viewBox`).toBeLessThanOrEqual(
          h + 0.5,
        );
        expect(t.top, `${name}: text ascends past the top of the viewBox`).toBeGreaterThanOrEqual(
          -0.5,
        );
      }
    });
  }
});

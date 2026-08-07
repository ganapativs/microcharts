// A magnitude that is small but real has to paint something.
//
// The bug this gate exists for: several charts floor a magnitude-encoding rect
// at 0.5 viewBox units so a tiny-but-real value stays visible — sparkbar's bar
// height (geometry.ts:201), funnel's stage height, event-timeline's span width,
// streak-spark's run width, net-flow's and rate-volume's column width — and
// every one of those rects also carried `shapeRendering="crispEdges"`. The hint
// snaps each edge to the DEVICE pixel grid, and a word-sized chart renders at
// about one viewBox unit per pixel, so the two cancelled out: a 0.5-unit rect
// flush to the box bottom rounds to 20..20 and paints zero pixels. Measured in
// Chromium at 1u = 1px, a 30x0.5 rect: `crispEdges` 0 ink, `auto` 7.1 ink, and
// a true zero 0 ink under either. A bin holding 4 events painted exactly what a
// bin holding 0 painted, which is a lie factor above 1.
//
// So this suite measures PAINT, not attributes. jsdom has no rasterizer and the
// node project loads no stylesheet, while the fix IS a stylesheet rule
// (`rect[width^="0."], rect[height^="0."] { shape-rendering: auto }`) that a
// markup assertion cannot see at all. Each case renders one chart twice — once
// with the small magnitude, once with that magnitude at zero — and reads the
// ink inside the box that ONE mark occupies. Whole-chart ink is not enough:
// four of the six charts first tried here moved a neighbour when the magnitude
// changed (funnel's stage connector, volume-profile's value-area band), and a
// whole-frame reading passed on that movement while the mark itself painted
// nothing. The box is the assertion.
//
// The control underneath it is the other half of the contract: a TRUE zero
// still paints nothing. Zero and no-data part company deliberately here — a
// null emits no rect, a zero emits an empty one — and a fix that made zero
// visible would trade one dishonesty for another.
import { beforeAll, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import type { ReactElement } from "react";

// The load-bearing import: without the stylesheet the rule under test is absent
// and every case below fails.
import "../../styles.css";

import { EventTimeline } from "../charts/event-timeline/index.js";
import { Funnel } from "../charts/funnel/index.js";
import { HistogramStrip } from "../charts/histogram-strip/index.js";
import { SparkBar } from "../charts/sparkbar/index.js";

/** Decode a base64 PNG into pixels. */
async function decode(b64: string): Promise<ImageData> {
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = `data:image/png;base64,${b64}`;
  });
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, c.width, c.height);
}

/** A rectangle in viewBox units: the patch of chart one mark occupies. */
type Box = { x0: number; y0: number; x1: number; y1: number };

/**
 * Ink inside `box`: darkness against the white host, alpha-weighted, summed, and
 * scaled back into viewBox units² so one unit² of full-strength mark reads about
 * 1 on every chart.
 *
 * The chart renders at one CSS pixel per viewBox unit — the size these charts
 * are FOR (a sentence, a table cell, a KPI card), and the scale at which the
 * snap bites. A case measured at 2x would prove nothing about the default.
 */
async function inkIn(el: ReactElement, w: number, box: Box, nudge: number): Promise<number> {
  const screen = await render(
    // The 4px gutter is load-bearing: a screenshot clips to the host's box, and
    // an `inline-block` SVG sits on a text baseline, so a chart flush to the
    // host edge loses its bottom row to the clip — which is where a zero-anchored
    // bar's whole mark lives. Measured: funnel read 0.00 ink for a bar that was
    // painting perfectly well, one pixel outside the frame.
    //
    // `nudge` moves the chart by a fraction of a pixel — see OFFSETS below. It
    // has to be a transform: Chrome pixel-snaps a block's paint offset, so a
    // 4.25px padding moves the layout box and leaves the marks on the same
    // device rows, and a padding-based sweep read four identical numbers on a
    // build where the mark was vanishing at two of the four offsets.
    <div
      style={{
        background: "#fff",
        width: `${w + 8}px`,
        padding: "4px",
        transform: `translate(${nudge}px, ${nudge}px)`,
        lineHeight: 0,
      }}
    >
      {el}
    </div>,
  );
  const host = screen.container.firstElementChild as HTMLElement;
  const svg = host.querySelector("svg.mc-root")!;
  const shot = (await page.screenshot({
    element: host as never,
    base64: true,
    save: false,
  })) as unknown as string | { base64: string };
  const px = await decode(typeof shot === "string" ? shot : shot.base64);

  // viewBox units → screenshot pixels, through the SVG's OWN painted rect
  // rather than through the host's. Nothing here assumes the chart fills the
  // host or renders at its nominal size.
  const hb = host.getBoundingClientRect();
  const sb = svg.getBoundingClientRect();
  const shotScale = px.width / hb.width;
  const [, , vbW = w, vbH = w] = (svg.getAttribute("viewBox") ?? "").split(/[\s,]+/).map(Number);
  const ux = (sb.width / vbW) * shotScale;
  const uy = (sb.height / vbH) * shotScale;
  const toX = (u: number): number => (sb.left - hb.left) * shotScale + u * ux;
  const toY = (u: number): number => (sb.top - hb.top) * shotScale + u * uy;

  const a = Math.max(0, Math.floor(toX(box.x0)));
  const b = Math.min(px.width, Math.ceil(toX(box.x1)));
  const c = Math.max(0, Math.floor(toY(box.y0)));
  const d = Math.min(px.height, Math.ceil(toY(box.y1)));

  let ink = 0;
  for (let y = c; y < d; y++) {
    for (let x = a; x < b; x++) {
      const i = (y * px.width + x) * 4;
      const lum = (0.2126 * px.data[i]! + 0.7152 * px.data[i + 1]! + 0.0722 * px.data[i + 2]!) / 255;
      ink += (1 - lum) * (px.data[i + 3]! / 255);
    }
  }
  // Back into viewBox units², so a reading means the same thing on every chart.
  return ink / (ux * uy);
}

/**
 * Each case renders one chart twice, differing ONLY in the magnitude under
 * test, and reads the box that magnitude's own mark occupies. The small value
 * is a fraction of a percent of the series maximum, which is the shape of real
 * data (a long tail, a near-empty bin, a two-minute incident in a fifty-hour
 * window), not a contrived one.
 *
 * `box` is copied off the rendered markup, tight around the mark and clear of
 * every neighbour. It is stated rather than derived from the DOM on purpose: a
 * box computed from the mark's own bounding rect would follow the mark if the
 * geometry moved, and would keep passing while the chart drew the value
 * somewhere it does not belong.
 */
const CASES: Record<
  string,
  { small: () => ReactElement; zero: () => ReactElement; w: number; box: Box }
> = {
  // The reported case. `4` against a 1000-scale domain wants 0.076 units and
  // takes the 0.5-unit floor; `0` is a true zero and keeps `height: 0`.
  // Middle bar: x 30.25 + 19.5 wide, y 19.5, h 0.5.
  sparkbar: {
    small: () => <SparkBar data={[1000, 4, 0]} title="Bars" />,
    zero: () => <SparkBar data={[1000, 0, 0]} title="Bars" />,
    w: 80,
    box: { x0: 30, y0: 19, x1: 50, y1: 20 },
  },
  // Stage heights are `value / max`, floored at 0.5 units for any nonzero ratio
  // (funnel/geometry.ts:100). Second stage: x 30.75, w 29.25, y 17.5, h 0.5. The
  // box starts at 31 to clear the tapered connector, which also moves when the
  // stage height does — the reason a whole-frame reading passed this case while
  // the bar itself painted nothing.
  funnel: {
    small: () => (
      <Funnel
        data={[
          { label: "A", value: 1000 },
          { label: "B", value: 4 },
        ]}
        label="none"
        title="Funnel"
      />
    ),
    zero: () => (
      <Funnel
        data={[
          { label: "A", value: 1000 },
          { label: "B", value: 0 },
        ]}
        label="none"
        title="Funnel"
      />
    ),
    w: 60,
    box: { x0: 31, y0: 17, x1: 60, y1: 18 },
  },
  // The WIDTH half of the stylesheet selector: a two-minute incident in a
  // fifty-hour window is 0.03 units wide and takes the same 0.5 floor
  // (event-timeline/index.tsx:214). Span: x 27.33, w 0.5, y 3, h 6, well clear of
  // the healthy span that ends at 3.52 — the box grows by up to a screenshot
  // pixel when it snaps to the grid, so a neighbour a unit away would leak into
  // the reading. Dropping the item is the honest zero twin: a span's lane
  // placement does not depend on how many items there are, so nothing else in
  // the frame moves.
  "event-timeline": {
    small: () => (
      <EventTimeline
        data={[
          { start: 0, end: 60, kind: "positive" },
          { start: 1000, end: 1002, kind: "negative" },
        ]}
        domain={[0, 3000]}
        label="none"
        title="Timeline"
      />
    ),
    zero: () => (
      <EventTimeline
        data={[{ start: 0, end: 60, kind: "positive" }]}
        domain={[0, 3000]}
        label="none"
        title="Timeline"
      />
    ),
    w: 80,
    box: { x0: 27, y0: 3, x1: 28.2, y1: 9 },
  },
  // The literal wording of the report: a bin holding 4 observations beside one
  // holding 400. An explicit `domain` and `bins` pin the bin edges, and the twin
  // moves those 4 observations into the modal bin rather than deleting them, so
  // both renders bin the same 404 values and only the tail differs. Tail bin:
  // x 55.46, w 4.54, y 15.5, h 0.5.
  "histogram-strip": {
    small: () => (
      <HistogramStrip
        data={[...Array<number>(400).fill(5), 95, 95, 95, 95]}
        domain={[0, 100]}
        bins={12}
        title="Dist"
      />
    ),
    zero: () => (
      <HistogramStrip data={Array<number>(404).fill(5)} domain={[0, 100]} bins={12} title="Dist" />
    ),
    w: 60,
    box: { x0: 55, y0: 15, x1: 60, y1: 16 },
  },
};

/**
 * Every case is measured at each of these sub-pixel offsets, on both axes, and
 * has to clear the bar at the WORST of them.
 *
 * This is the half of the defect a single measurement misses. `crispEdges`
 * rounds each edge to the nearest device pixel, so whether a sub-unit mark
 * survives depends on where its edges happen to fall, not on how big it is.
 * Measured on the broken build, sparkbar's 0.5-unit bar across these four
 * offsets: 0.00, 0.00, 16.78, 17.66. The same value, the same chart, the same
 * size — painted as nothing at half the offsets and at TWICE its honest weight
 * (8.6) at the other half. Every case behaves that way; event-timeline's span
 * reads 2.49, 0.00, 0.00, 2.44 against an honest 1.23.
 *
 * A page picks that offset, not the library: a chart in a table cell lands
 * wherever the row height puts it. So the requirement is ink at EVERY offset —
 * which anti-aliasing gives (the four readings land within 2% of each other)
 * and the snap cannot.
 */
const OFFSETS = [0, 0.25, 0.5, 0.75];

/**
 * One viewBox unit² of full-strength mark scores about 1. With the fix, the
 * quietest case here is event-timeline's 0.5x6 span at 0.7 fill-opacity, which
 * reads 1.23 at its worst offset; the rest run 2.0 to 12.8. Without it, every
 * case reads exactly 0.00 at its worst offset. Half a unit² sits clear of both,
 * and the failure is not a near miss.
 */
const MIN_INK = 0.5;

describe("a small magnitude paints (real browser, real stylesheet)", () => {
  // The runner sizes its test iframe to the configured viewport and SCALES it to
  // fit the window, so a screenshot arrives resampled — measured at 0.81x, which
  // is enough to lose a half-pixel row of 50% alpha and read a painting mark as
  // blank. A viewport that fits without scaling makes the screenshot 1:1 with
  // the page, which is the only scale at which this suite means anything.
  beforeAll(async () => {
    await page.viewport(300, 300);
  });

  for (const [name, c] of Object.entries(CASES)) {
    it(`${name} — a tiny value inks the box a zero leaves empty, at every offset`, async () => {
      const readings: string[] = [];
      let worst = Infinity;
      for (const nudge of OFFSETS) {
        const withValue = await inkIn(c.small(), c.w, c.box, nudge);
        const withZero = await inkIn(c.zero(), c.w, c.box, nudge);
        readings.push(`+${nudge}px ${(withValue - withZero).toFixed(2)}`);
        worst = Math.min(worst, withValue - withZero);
      }
      expect(
        worst,
        `${name}: the small magnitude left ${worst.toFixed(2)} ink in its own box at its worst ` +
          `sub-pixel offset (${readings.join(", ")}). At 0 the mark is snapped off the device ` +
          `pixel grid and the chart draws a real value as nothing.`,
      ).toBeGreaterThan(MIN_INK);
    });
  }

  // The stylesheet rule, read back off real marks. Its whole job is to lose to
  // nothing and to beat the presentation attribute, and it beats the
  // `.mc-trace, .mc-partition` rule above it by SOURCE ORDER alone — both
  // selectors are `:where()`. Reordering styles.css would restore the bug and
  // every measurement above would fail without saying why. This says why.
  it("the stylesheet relaxes the hint below one unit and keeps it at or above", async () => {
    const screen = await render(<SparkBar data={[1000, 4, 0]} title="Contract" />);
    const rects = [...screen.container.querySelectorAll("svg.mc-root rect")];
    const by = (pred: (h: number) => boolean) =>
      rects.find((r) => pred(Number(r.getAttribute("height"))));

    const sliver = by((h) => h > 0 && h < 1);
    const full = by((h) => h >= 1);
    expect(sliver, "fixture must render a sub-unit bar").toBeTruthy();
    expect(full, "fixture must render a full-size bar").toBeTruthy();

    expect(getComputedStyle(sliver!).getPropertyValue("shape-rendering")).toBe("auto");
    // The normal case is untouched: a mark that survives the snap keeps the
    // crisp edges it was given, so this costs the catalog no sharpness.
    expect(getComputedStyle(full!).getPropertyValue("shape-rendering")).toBe("crispedges");
  });

  // The other direction. A zero is a measurement and it means "none": the chart
  // holds its slot on the pitch and paints nothing there. A null means "not
  // measured" and emits no rect at all. Nothing above may be bought by painting
  // a floor under a true zero.
  it("a true zero still paints nothing", async () => {
    const screen = await render(<SparkBar data={[1000, 0, 0]} title="Zero" />);
    const zeros = [...screen.container.querySelectorAll("svg.mc-root rect")].filter(
      (r) => Number(r.getAttribute("height")) === 0,
    );
    expect(zeros.length, "two exact zeros in the series").toBe(2);
    // `height="0"` does not start with "0.", so the rule cannot reach it — and
    // an empty rect paints nothing under either hint.
    for (const z of zeros)
      expect(getComputedStyle(z).getPropertyValue("shape-rendering")).toBe("crispedges");
  });
});

/**
 * The catalog-wide half, and the reason this is one stylesheet rule rather than
 * 46 local edits: the rule reaches every `<rect>` in the library at once, for
 * zero bundled bytes, and asks nothing of a chart author. What it CANNOT reach
 * is a batch of bars drawn as a single `<path>` — CSS selects elements, not the
 * subpaths inside a `d` string, and `shape-rendering` on a path applies to the
 * whole path or to none of it. VolumeProfile's rows and CalibrationStrip's
 * support lane are exactly that, and both dropped the hint. A new one that
 * keeps it has to say why here.
 */
const CRISP_PATHS: Record<string, string> = {
  waterfall:
    "connector rules are STROKED (fill=none) at a non-scaling stroke width, so no " +
    "fill extent can round away",
  "city-skyline":
    "lit windows are discrete grid units rather than a magnitude — the count is the " +
    "channel, and a box too small for a window is below the chart's readable floor",
  "depth-wedge":
    "each wedge is one cumulative staircase anchored on the baseline, so its extent is " +
    "a running total and never goes sub-unit while the chart has data",
};

describe("no crispEdges on a path that batches magnitude marks", () => {
  const sources = import.meta.glob("../charts/*/*.tsx", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;

  it("covers the whole catalog", () => {
    // Guards the guard: a broken glob would assert nothing at all.
    expect(Object.keys(sources).length).toBeGreaterThan(150);
  });

  for (const [file, src] of Object.entries(sources)) {
    const parts = file.split("/");
    const slug = parts[parts.length - 2]!;
    // Split on `<` rather than matching an opening tag with a regex: a `d` built
    // by `.map((b) => …)` carries a `>` of its own, so `<path[^>]*>` stops at
    // the arrow and never reaches the attribute two lines below. Both path
    // batches this gate exists for are built that way, and the regex form waved
    // them through. A `<path>` has no children, so everything from its `<` to
    // the next `<` IS the element.
    const crisp = src
      .split("<")
      .filter((chunk) => /^path[\s>]/.test(chunk) && chunk.includes('shapeRendering="crispEdges"'));
    if (crisp.length === 0) continue;

    it(`${slug}/${parts[parts.length - 1]} — documented, or drops the hint`, () => {
      expect(
        CRISP_PATHS[slug],
        `${slug}: a <path> carries shapeRendering="crispEdges". If it batches ` +
          `magnitude marks, drop the hint — the stylesheet's per-rect rescue cannot ` +
          `reach inside a d string, and a sub-unit subpath snaps to nothing. If the ` +
          `mark genuinely cannot go sub-unit, add it to CRISP_PATHS with the reason.`,
      ).toBeTruthy();
    });
  }
});

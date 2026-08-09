import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CHARTS } from "../catalog";

// `maxWidth`/`maxHeight` are the authored maximum box a chart is drawn and
// reviewed at, and `catalog.json` ships them so an agent sizing a chart has a
// number to stay inside. The field only means something if the library itself
// stays inside it: the DevOps field report that prompted these fields rendered
// an <EventTimeline> at 823×658, where the geometry caps hold the span bar at 6
// units and the rest of the box is whitespace.
//
// So this file gates the floor. Every size the registry's own previews,
// playgrounds, recipes and four-contexts render at must fit inside the chart's
// stated maximum. Raise a demo past the box and this test names the chart.
const DIR = resolve(process.cwd(), "src/lib/charts");

/** Every `width={n}` / `height={n}` / `size={n}` literal in a registry module. */
function authoredSizes(slug: string): { widths: number[]; heights: number[] } {
  const src = readdirSync(DIR)
    .filter((f) => f === `${slug}.tsx` || f === `${slug}.live.tsx`)
    .map((f) => readFileSync(resolve(DIR, f), "utf8"))
    .join("\n");
  const nums = (re: RegExp) => [...src.matchAll(re)].map((m) => Number(m[1]));
  // `size` sets both sides on the square glyph charts, so it counts as each.
  const sizes = nums(/\bsize=\{(\d+)\}/g);
  return {
    widths: [...nums(/\bwidth=\{(\d+)\}/g), ...sizes],
    heights: [...nums(/\bheight=\{(\d+)\}/g), ...sizes],
  };
}

const sized = CHARTS.filter((c) => c.maxWidth !== undefined);

describe("authored maximum box", () => {
  it("covers the charts sized by width/height, and only those", () => {
    // A lone side would read as "this axis is capped, the other is free".
    for (const c of CHARTS) {
      expect(c.maxWidth === undefined).toBe(c.maxHeight === undefined);
    }
    expect(sized.length).toBeGreaterThan(80);
  });

  it("every chart without one explains its sizing knob in gotchas", () => {
    for (const c of CHARTS.filter((x) => x.maxWidth === undefined)) {
      expect(
        c.gotchas?.length,
        `${c.name} has no authored box and no gotcha saying why`,
      ).toBeTruthy();
      const said = (c.gotchas ?? []).join(" ");
      expect(
        /`cell`|`size`|CSS|Width is derived|inline HTML/.test(said),
        `${c.name}: ${said}`,
      ).toBe(true);
    }
  });

  it.each(sized)("$name is never rendered past its own maximum", (chart) => {
    const { widths, heights } = authoredSizes(chart.slug);
    if (widths.length) expect(Math.max(...widths)).toBeLessThanOrEqual(chart.maxWidth!);
    if (heights.length) expect(Math.max(...heights)).toBeLessThanOrEqual(chart.maxHeight!);
  });

  it.each(sized)("$name states a box a word-sized chart could hold", (chart) => {
    // Whole viewBox units, and inside the range the catalog is drawn in. The
    // upper bound is four times the widest intrinsic default (140) — a chart
    // that wants more than that is a full chart library's job.
    expect(Number.isInteger(chart.maxWidth)).toBe(true);
    expect(Number.isInteger(chart.maxHeight)).toBe(true);
    expect(chart.maxWidth).toBeGreaterThanOrEqual(40);
    expect(chart.maxWidth).toBeLessThanOrEqual(560);
    expect(chart.maxHeight).toBeGreaterThanOrEqual(40);
    expect(chart.maxHeight).toBeLessThanOrEqual(560);
  });
});

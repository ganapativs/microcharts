import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CHARTS } from "./catalog";
import { SHARED_PROPS } from "./charts/shared-props";

// The library package.json (repo root) is the source of truth for exports.
// Tests run with cwd = apps/docs (the workspace package).
const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "../../package.json"), "utf8")) as {
  name: string;
  exports: Record<string, unknown>;
};

// exports keys look like "./sparkline"; map catalog imports "@microcharts/react/sparkline"
// back to that subpath key.
function toSubpath(importPath: string): string {
  return importPath.replace(pkg.name, ".");
}

describe("catalog ↔ package exports", () => {
  it("is the microcharts package", () => {
    expect(pkg.name).toBe("@microcharts/react");
  });

  it.each(CHARTS)("$name static import is a real export", (chart) => {
    expect(pkg.exports).toHaveProperty(toSubpath(chart.staticImport));
  });

  it.each(CHARTS.filter((c) => c.interactiveImport))(
    "$name interactive import is a real export",
    (chart) => {
      expect(pkg.exports).toHaveProperty(toSubpath(chart.interactiveImport!));
    },
  );

  it("every stable export subpath appears in the catalog", () => {
    const catalogSubpaths = new Set(
      CHARTS.flatMap((c) =>
        [c.staticImport, c.interactiveImport].filter(Boolean).map((i) => toSubpath(i!)),
      ),
    );
    // every chart subpath in exports is catalogued; non-chart shared layers
    // (annotations, the motion engine, stylesheet entries) are documented as
    // guides, not catalog rows
    const chartSubpaths = Object.keys(pkg.exports).filter(
      (k) =>
        k !== "." &&
        k !== "./package.json" &&
        k !== "./annotations" &&
        k !== "./motion" &&
        k !== "./theme" &&
        !k.startsWith("./styles"),
    );
    for (const sub of chartSubpaths) {
      expect(catalogSubpaths.has(sub)).toBe(true);
    }
  });
});

// catalog.json is a complete reference: a top-level sharedProps block plus
// per-chart props. These guard the shape the route emits.
const owns = (slug: string, prop: string) =>
  CHARTS.find((c) => c.slug === slug)?.props.some((p) => p.name === prop && p.interactive);

describe("catalog shared + interactive props", () => {
  it("sharedProps covers the grammar and the shared interactive props", () => {
    const names = new Set(SHARED_PROPS.map((p) => p.name));
    for (const n of ["data", "domain", "color", "title", "summary", "format", "positive"]) {
      expect(names.has(n), `sharedProps missing grammar prop ${n}`).toBe(true);
    }
    // shared interactive grammar lives here (documented once), flagged interactive
    for (const n of [
      "animate",
      "live",
      "onActive",
      "onSelect",
      "selectedIndex",
      "defaultSelectedIndex",
    ]) {
      const p = SHARED_PROPS.find((x) => x.name === n);
      expect(p?.interactive, `sharedProps ${n} must be flagged interactive`).toBe(true);
    }
    // every shared prop carries a description — the reference must be readable
    expect(SHARED_PROPS.every((p) => p.description.length > 0)).toBe(true);
  });

  it("interactive-only props are documented on the charts that own them", () => {
    expect(owns("calendar-strip", "dateFormat")).toBe(true);
    expect(owns("event-timeline", "dateFormat")).toBe(true);
    // minimap-strip is the deliberate exception to the picker contract — a
    // range/slider primitive, so it keeps its own window callback.
    expect(owns("minimap-strip", "onWindowChange")).toBe(true);
    expect(owns("eta-bar", "announceEvery")).toBe(true);
    expect(owns("tape-gauge", "announceEvery")).toBe(true);
  });

  it("catalog.json emits per-chart sharedInteractive without agents guessing", async () => {
    const { buildCatalog } = await import("./catalog-json");
    const catalog = buildCatalog();
    expect(catalog.howToRead.length).toBeGreaterThan(40);
    expect(catalog.sharedProps.map((p) => p.name)).toEqual(
      expect.arrayContaining([
        "data",
        "onActive",
        "onSelect",
        "animate",
        "live",
        "selectedIndex",
        "defaultSelectedIndex",
      ]),
    );

    const spark = catalog.charts.find((c) => c.slug === "sparkline")!;
    expect(spark.interactiveImport).toBeTruthy();
    expect(spark.picker).toBe(true);
    expect(spark.animates).toBe(true);
    expect(spark.sharedInteractive).toEqual([
      "animate",
      "onActive",
      "onSelect",
      "selectedIndex",
      "defaultSelectedIndex",
      "readout",
    ]);

    const delta = catalog.charts.find((c) => c.slug === "delta")!;
    expect(delta.picker).toBe(false);
    expect(delta.sharedInteractive).toEqual(["animate", "live", "onActive", "onSelect"]);

    // No picker (it is a slider), but it does paint a chip — the window range.
    const minimap = catalog.charts.find((c) => c.slug === "minimap-strip")!;
    expect(minimap.picker).toBe(false);
    expect(minimap.sharedInteractive).toEqual(["animate", "readout"]);
    expect(minimap.props.some((p) => p.name === "onWindowChange" && p.interactive)).toBe(true);

    // Real focus moves into the text, so no shared picker props — but hovering
    // a flagged token floats its tier + confidence, so `readout` applies.
    const token = catalog.charts.find((c) => c.slug === "token-confidence")!;
    expect(token.picker).toBe(false);
    expect(token.animates).toBe(false);
    expect(token.sharedInteractive).toEqual(["readout"]);

    // WindBarb is a one-glyph scalar: it has an interactive twin, but nothing to
    // pick between, so it takes the lean whole-chart callbacks and no index props.
    const wind = catalog.charts.find((c) => c.slug === "wind-barb")!;
    expect(wind.interactiveImport).toBe("@microcharts/react/wind-barb/interactive");
    expect(wind.sharedInteractive).toEqual(["animate", "live", "onActive", "onSelect", "readout"]);
  });

  // `readout` in `sharedInteractive` used to be derived by regexing the client
  // source for the chip class. The registry's `readout: false` flag is the
  // authority (and the flag the playground already reads), so the catalog reads
  // it directly — these are the six entries that paint no chip.
  it("derives readout from the registry flag, not the client source", async () => {
    const { buildCatalog } = await import("./catalog-json");
    const catalog = buildCatalog();
    const noChip = ["delta", "dice-pips", "fat-digits", "status-dot", "tally-marks", "trend-arrow"];
    for (const slug of noChip) {
      const c = catalog.charts.find((x) => x.slug === slug)!;
      expect(c.sharedInteractive, `${slug} must not advertise readout`).not.toContain("readout");
      expect(CHARTS.find((x) => x.slug === slug)?.readout).toBe(false);
    }
    // Chip-carrying scalars have no picker but do take `readout`.
    for (const slug of ["bullet", "thermometer", "progress", "token-confidence"]) {
      const c = catalog.charts.find((x) => x.slug === slug)!;
      expect(c.picker, `${slug} is a lean scalar`).toBe(false);
      expect(c.sharedInteractive, `${slug} paints a chip`).toContain("readout");
    }
    // …and so does a plain multi-unit picker.
    expect(catalog.charts.find((x) => x.slug === "sparkbar")!.sharedInteractive).toContain(
      "readout",
    );
  });
});

// The catalog is the machine reference: an agent that can't see the docs page
// still needs the honest-encoding facts (channel + precision rating, per
// CLAUDE.md non-negotiable #7) and the browsing metadata.
describe("catalog per-chart metadata is complete", () => {
  it("every chart carries collection, tagline, precision and a node budget", async () => {
    const { buildCatalog } = await import("./catalog-json");
    const catalog = buildCatalog();
    expect(catalog.charts.length).toBe(CHARTS.length);
    for (const c of catalog.charts) {
      expect(c.collection, `${c.slug} collection`).toBeTruthy();
      expect(c.tagline.length, `${c.slug} tagline`).toBeGreaterThan(0);
      expect(c.primaryEncoding.length, `${c.slug} primaryEncoding`).toBeGreaterThan(0);
      expect(c.precision.length, `${c.slug} precision`).toBeGreaterThan(0);
      expect(c.nodeBudget.length, `${c.slug} nodeBudget`).toBeGreaterThan(0);
    }
    const bubble = catalog.charts.find((c) => c.slug === "bubble-row")!;
    // The catalog's worked example of an honest low-precision admission.
    expect(bubble.precision).toContain("low");
    expect(bubble.precision).toContain("MiniBar");
  });
});

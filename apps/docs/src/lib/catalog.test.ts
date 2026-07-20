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
});

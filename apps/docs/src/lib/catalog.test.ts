import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CHARTS } from "./catalog";

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

describe("catalog ↔ package exports (plan/20 §5.3)", () => {
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
    // every chart subpath in exports (excluding root, package.json, styles) is catalogued
    const chartSubpaths = Object.keys(pkg.exports).filter(
      (k) => k !== "." && k !== "./package.json" && k !== "./styles.css",
    );
    for (const sub of chartSubpaths) {
      expect(catalogSubpaths.has(sub)).toBe(true);
    }
  });
});

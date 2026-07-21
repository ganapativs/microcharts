import { describe, expect, it } from "vitest";
import { CHART_JS, REACT_SPARKLINES_LEGACY, RECHARTS } from "./competitor-facts";

describe("competitor-facts", () => {
  it("pins Recharts with version, sizes, and dep count", () => {
    expect(RECHARTS.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(RECHARTS.packageGzipKb).toBeGreaterThan(100);
    expect(RECHARTS.oneChartGzipKb).toBeGreaterThan(50);
    expect(RECHARTS.oneChartGzipKb).toBeLessThan(RECHARTS.packageGzipKb);
    expect(RECHARTS.runtimeDeps).toBe(11);
  });

  it("pins legacy react-sparklines last publish and weekly downloads", () => {
    expect(REACT_SPARKLINES_LEGACY.version).toBe("1.7.0");
    expect(REACT_SPARKLINES_LEGACY.lastPublish).toBe("2017-07-27");
    expect(REACT_SPARKLINES_LEGACY.downloadsLastWeek).toBeGreaterThan(200_000);
    expect(REACT_SPARKLINES_LEGACY.runtimeDeps).toContain("prop-types");
  });

  it("pins Chart.js package gzip from bundlephobia", () => {
    expect(CHART_JS.version).toMatch(/^4\./);
    expect(CHART_JS.packageGzipKb).toBeGreaterThan(50);
    expect(CHART_JS.wrapperGzipKb).toBeLessThan(5);
  });
});

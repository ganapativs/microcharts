import { describe, expect, it } from "vitest";
import {
  CHART_JS,
  MUI_X_CHARTS,
  REACT_SPARKLINES_LEGACY,
  RECHARTS,
  VISX,
} from "./competitor-facts";

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

  it("pins legacy react-sparklines measured gzip", () => {
    expect(REACT_SPARKLINES_LEGACY.packageGzipKb).toBeGreaterThan(5);
    expect(REACT_SPARKLINES_LEGACY.packageGzipKb).toBeLessThan(15);
    expect(REACT_SPARKLINES_LEGACY.measuredAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("pins MUI X SparkLineChart with both measurement scenarios", () => {
    expect(MUI_X_CHARTS.version).toMatch(/^\d+\.\d+\.\d+$/);
    // standalone must cost more than the peers-external MUI-app scenario
    expect(MUI_X_CHARTS.sparklineStandaloneGzipKb).toBeGreaterThan(
      MUI_X_CHARTS.sparklineInMuiAppGzipKb,
    );
    expect(MUI_X_CHARTS.sparklineInMuiAppGzipKb).toBeGreaterThan(50);
    expect(MUI_X_CHARTS.runtimeDeps).toBe(10);
    expect(MUI_X_CHARTS.requiredPeers).toContain("@mui/material");
    expect(MUI_X_CHARTS.license).toBe("MIT");
  });

  it("pins the visx minimal-sparkline measurement", () => {
    expect(VISX.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(VISX.minimalSparklineGzipKb).toBeGreaterThan(5);
    expect(VISX.minimalSparklineGzipKb).toBeLessThan(50);
    expect(VISX.shapeRuntimeDeps).toBe(5);
  });
});

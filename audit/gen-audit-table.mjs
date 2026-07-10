// Generates audit/AUDIT-TABLE.md from baseline artifacts. Re-runnable.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";

const FAM = {
  band: ["folded-day-band", "forecast-cone", "horizon", "stacked-area"],
  bar: [
    "error-budget",
    "eta-bar",
    "histogram-strip",
    "mini-bar",
    "net-flow",
    "paired-bars",
    "progress",
    "rate-volume",
    "segmented-bar",
    "shift-histogram",
    "sparkbar",
  ],
  connector: ["balance-beam", "data-diff", "dumbbell"],
  dot: [
    "bubble-row",
    "comet-trail",
    "constellation",
    "dot-plot",
    "icon-array",
    "micro-scatter",
    "pictogram-row",
    "quadrant-dot",
    "quantile-dots",
    "rug-strip",
    "sprout-row",
  ],
  glyph: [
    "breathing-dot",
    "dice-pips",
    "heartbeat-blip",
    "hourglass",
    "station-glyph",
    "status-dot",
    "tally-marks",
    "thermometer",
    "trend-arrow",
    "wind-barb",
  ],
  grid: [
    "activity-grid",
    "calendar-strip",
    "confusion-grid",
    "event-raster",
    "garden-grid",
    "heat-cell",
    "honeycomb",
  ],
  line: [
    "bump-strip",
    "burn-chart",
    "change-point",
    "cycle-plot",
    "dual-sparkline",
    "ensemble-ghosts",
    "hypnogram",
    "music-staff",
    "phase-trace",
    "retention-curve",
    "slope",
    "sparkline",
    "waveform",
  ],
  profile: [
    "bullet",
    "city-skyline",
    "depth-wedge",
    "funnel",
    "micro-box",
    "ohlc",
    "pareto-strip",
    "volume-profile",
    "waterfall",
  ],
  radial: [
    "micro-donut",
    "moon-phase",
    "orbit-status",
    "polar-clock",
    "progress-ring",
    "spiral-year",
    "star-spoke",
    "tree-rings",
  ],
  span: ["event-timeline", "partition-strip", "trace-fold"],
  strip: [
    "ab-strips",
    "benchmark-strip",
    "calibration-strip",
    "control-strip",
    "coverage-strip",
    "dual-window-meter",
    "graded-band",
    "heat-strip",
    "likert-strip",
    "minimap-strip",
    "percentile-ladder",
    "rubric-strip",
    "seismogram",
    "tape-gauge",
    "time-in-range",
  ],
  text: ["delta", "fat-digits", "fill-word", "token-confidence"],
};
const famOf = {};
for (const [f, list] of Object.entries(FAM)) for (const c of list) famOf[c] = f;

const BENCH_RED = new Set([
  "trace-fold",
  "calibration-strip",
  "partition-strip",
  "minimap-strip",
  "confusion-grid",
  "dual-window-meter",
  "tape-gauge",
  "volume-profile",
  "star-spoke",
  "depth-wedge",
  "phase-trace",
]);
const NO_VSPEC = new Set(
  readdirSync("src/charts").filter((c) => famOf[c] && !existsSync(`tests/visual/${c}.spec.ts`)),
);
// original five covered by catalog/annotations specs
for (const c of ["activity-grid", "bullet", "delta", "sparkbar"]) NO_VSPEC.delete(c);
const TRUNCATED_PAGE = new Set([
  "benchmark-strip",
  "coverage-strip",
  "icon-array",
  "percentile-ladder",
]);
const NO_WHY = new Set(["activity-grid", "bullet", "delta", "sparkbar", "sparkline"]);
const SNIPPET_PLACEHOLDER = new Set([
  "activity-grid",
  "benchmark-strip",
  "confusion-grid",
  "horizon",
  "funnel",
  "music-staff",
  "dumbbell",
  "coverage-strip",
  "percentile-ladder",
  "garden-grid",
  "sparkline",
  "minimap-strip",
  "tree-rings",
  "waterfall",
  "token-confidence",
]);
const PROP_FLAG = new Set([
  "wind-barb",
  "histogram-strip",
  "rug-strip",
  "quantile-dots",
  "volume-profile",
  "icon-array",
  "honeycomb",
  "pictogram-row",
  "tree-rings",
  "progress",
  "tally-marks",
  "percentile-ladder",
  "star-spoke",
  "garden-grid",
  "calendar-strip",
  "depth-wedge",
  "benchmark-strip",
  "music-staff",
  "dual-window-meter",
  "event-raster",
  "hypnogram",
  "minimap-strip",
  "rubric-strip",
  "waveform",
  "phase-trace",
  "thermometer",
  "tape-gauge",
  "cycle-plot",
  "polar-clock",
  "spiral-year",
]);
// FourContexts missing (from docs agent)
const NO_4CTX = new Set([
  "balance-beam",
  "benchmark-strip",
  "breathing-dot",
  "bubble-row",
  "calibration-strip",
  "city-skyline",
  "comet-trail",
  "confusion-grid",
  "constellation",
  "coverage-strip",
  "depth-wedge",
  "dual-window-meter",
  "event-raster",
  "fat-digits",
  "fill-word",
  "folded-day-band",
  "garden-grid",
  "heartbeat-blip",
  "honeycomb",
  "hourglass",
  "icon-array",
  "minimap-strip",
  "moon-phase",
  "music-staff",
  "orbit-status",
  "partition-strip",
  "percentile-ladder",
  "phase-trace",
  "polar-clock",
  "rubric-strip",
  "spiral-year",
  "sprout-row",
  "star-spoke",
  "station-glyph",
  "tape-gauge",
  "thermometer",
  "token-confidence",
  "trace-fold",
  "tree-rings",
  "volume-profile",
  "waveform",
]);

// sizes: "  @microcharts/react/<name> (static) | 3 kB | 2.67 kB" style lines
const sizes = {};
for (const line of readFileSync("audit/baseline-size-table.txt", "utf8").split("\n")) {
  const m = line.match(
    /@microcharts\/react\/([a-z-]+)(\/interactive)?\s*\|\s*([\d.]+ kB)\s*\|\s*([\d.]+ k?B)/,
  );
  if (!m) continue;
  const key = m[1];
  (sizes[key] ??= {})[m[2] ? "i" : "s"] = `${m[4]}/${m[3]}`;
}

const rows = [];
for (const fam of Object.keys(FAM)) {
  for (const c of FAM[fam]) {
    const flags = [];
    if (BENCH_RED.has(c)) flags.push("BENCH-RED");
    if (NO_VSPEC.has(c)) flags.push("no-vspec");
    if (PROP_FLAG.has(c)) flags.push("prop");
    const pflags = [];
    if (TRUNCATED_PAGE.has(c)) pflags.push("TRUNCATED");
    if (NO_4CTX.has(c)) pflags.push("no-4ctx");
    if (NO_WHY.has(c)) pflags.push("no-why");
    if (SNIPPET_PLACEHOLDER.has(c)) pflags.push("snippet");
    const chartScore = BENCH_RED.has(c) ? 55 : flags.length ? 75 : 85;
    const pageScore = TRUNCATED_PAGE.has(c)
      ? 40
      : pflags.length >= 2
        ? 65
        : pflags.length
          ? 75
          : 88;
    const verdict =
      BENCH_RED.has(c) || TRUNCATED_PAGE.has(c)
        ? "REWORK"
        : flags.length + pflags.length
          ? "POLISH"
          : "VERIFY";
    const sz = sizes[c] ?? {};
    rows.push(
      `| ${c} | ${fam} | ${sz.s ?? "?"} | ${sz.i ?? "?"} | ${chartScore} | ${pageScore} | ${verdict} | ${[...flags, ...pflags].join(" ") || "—"} |`,
    );
  }
}
const out = `# Audit table — initial (2026-07-10, baseline 431f6b3)

Render tech: SVG static + 'use client' interactive everywhere (delta = inline HTML). Bytes = actual/budget gz.
Initial scores are PROVISIONAL from objective signals (bench, visual-spec coverage, prop audit, page audit); per-chart visual taste scoring happens family-by-family in Phase 2. 100 = done bar.
Flags: BENCH-RED below SSR floor · no-vspec missing visual spec · prop contract deviation · TRUNCATED page cut mid-template · no-4ctx missing FourContexts · no-why missing "Why this default" · snippet placeholder identifiers.

| Component | Family | Static | Interactive | Chart | Page | Verdict | Flags |
|---|---|---|---|---|---|---|---|
${rows.join("\n")}

${rows.length} charts. Family processing order (Phase 2, worst first): strip → span → profile → radial → glyph → grid → line → dot → bar → band → text → connector.
`;
writeFileSync("audit/AUDIT-TABLE.md", out);
console.log(`${rows.length} rows written`);

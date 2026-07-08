// Ad-hoc visual harness (NOT a CI gate): SSR-renders chart variants to a static
// HTML on a light grid, so a real browser screenshot shows exact pixels — text
// overlap, voids, alignment, band contrast. Rebuild the lib first, then:
//   node scripts/visual-check.mjs && open the docs server at /vcheck.html
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const styles = readFileSync(fileURLToPath(new URL("../styles.css", import.meta.url)), "utf8");
const D = (p) => import(`../dist/charts/${p}/index.js`);

const { CoverageStrip } = await D("coverage-strip");
const { BenchmarkStrip } = await D("benchmark-strip");
const { PercentileLadder } = await D("percentile-ladder");
const { GradedBand } = await D("graded-band");
const { IconArray } = await D("icon-array");

const svg = (C, props) => renderToStaticMarkup(h(C, props));

const PEERS = Array.from(
  { length: 42 },
  (_, i) => 180 + Math.round(220 * Math.sin(i / 5) ** 2) + (i % 7) * 12,
);
const LATENCY = Array.from({ length: 200 }, (_, i) =>
  i < 130
    ? 90 + (i % 50)
    : i < 180
      ? 150 + ((i * 7) % 320)
      : i < 196
        ? 480 + ((i * 11) % 900)
        : 1500 + ((i * 13) % 800),
);
const DRAWS = Array.from(
  { length: 160 },
  (_, i) => 21 + Math.round(9 * Math.sin(i) + 6 * Math.sin(i * 2.3)),
);
const COVERAGE = [3, 4, null, 5, 0, null, null, 6, 8, 7, null, 9, 11, 10];

function row(title, ...cells) {
  return `<div class="row"><div class="t">${title}</div>${cells.map((c) => `<div class="c">${c}</div>`).join("")}</div>`;
}

const body = [
  `<h2>CoverageStrip</h2>`,
  row("default 80×10", svg(CoverageStrip, { data: COVERAGE, width: 80, height: 10 })),
  row(
    "percent, expected 18",
    svg(CoverageStrip, { data: COVERAGE, expected: 18, label: "percent", width: 240, height: 16 }),
  ),
  row(
    "percent small",
    svg(CoverageStrip, { data: COVERAGE, expected: 18, label: "percent", width: 130, height: 12 }),
  ),
  row(
    "intensity",
    svg(CoverageStrip, {
      data: COVERAGE,
      mode: "intensity",
      domain: [0, 12],
      width: 240,
      height: 16,
    }),
  ),
  row("round", svg(CoverageStrip, { data: COVERAGE, shape: "round", width: 240, height: 16 })),
  row(
    "trailing gap",
    svg(CoverageStrip, { data: [1, 1, 1], expected: 8, label: "percent", width: 150, height: 12 }),
  ),

  `<h2>BenchmarkStrip</h2>`,
  row("default 80×12", svg(BenchmarkStrip, { data: PEERS, value: 312, width: 80, height: 12 })),
  row("percentile", svg(BenchmarkStrip, { data: PEERS, value: 312, width: 280, height: 16 })),
  row(
    "value label",
    svg(BenchmarkStrip, { data: PEERS, value: 312, label: "value", width: 280, height: 16 }),
  ),
  row(
    "polarity down",
    svg(BenchmarkStrip, { data: PEERS, value: 230, positive: "down", width: 200, height: 14 }),
  ),
  row(
    "small n minmax",
    svg(BenchmarkStrip, { data: [210, 260, 300, 340, 410], value: 300, width: 200, height: 14 }),
  ),

  `<h2>PercentileLadder</h2>`,
  row("default 80×12", svg(PercentileLadder, { data: LATENCY, width: 80, height: 12 })),
  row("ps 240×18", svg(PercentileLadder, { data: LATENCY, width: 240, height: 18 })),
  row("log", svg(PercentileLadder, { data: LATENCY, scale: "log", width: 240, height: 18 })),
  row("values", svg(PercentileLadder, { data: LATENCY, label: "values", width: 240, height: 20 })),
  row("both", svg(PercentileLadder, { data: LATENCY, label: "both", width: 280, height: 20 })),

  `<h2>GradedBand</h2>`,
  row("default 80×12", svg(GradedBand, { data: DRAWS, width: 80, height: 12 })),
  row("median label", svg(GradedBand, { data: DRAWS, label: "median", width: 240, height: 16 })),
  row("value dot", svg(GradedBand, { data: DRAWS, value: 28, width: 240, height: 16 })),
  row("soft edge", svg(GradedBand, { data: DRAWS, softEdge: true, width: 240, height: 16 })),
  row("50/90", svg(GradedBand, { data: DRAWS, levels: [50, 90], width: 240, height: 16 })),

  `<h2>IconArray</h2>`,
  row("3 in 20", svg(IconArray, { value: 0.15, of: 20, width: 140, height: 30 })),
  row("1 in 10", svg(IconArray, { value: 0.1, of: 10, width: 130, height: 28 })),
  row("percent", svg(IconArray, { value: 0.15, of: 20, label: "percent", width: 140, height: 30 })),
  row("round", svg(IconArray, { value: 0.6, of: 10, shape: "round", width: 140, height: 30 })),
  row("of 100", svg(IconArray, { value: 0.37, of: 100, width: 130, height: 70 })),
  row(
    "polarity",
    svg(IconArray, { value: 0.15, of: 20, positive: "down", width: 150, height: 30 }),
  ),
].join("\n");

const html = `<!doctype html><html><head><meta charset="utf8"><style>${styles}
  body{margin:0;padding:24px 32px;background:#fbfbfc;color:#1a1a1a;font:14px system-ui;
    background-image:linear-gradient(#e6e8ee 1px,transparent 1px),linear-gradient(90deg,#e6e8ee 1px,transparent 1px);
    background-size:44px 44px}
  h2{font:600 13px ui-monospace,monospace;color:#555;margin:26px 0 6px}
  .row{display:flex;align-items:center;gap:16px;padding:8px 0;border-bottom:1px solid #eef0f4}
  .t{width:150px;font:11px ui-monospace,monospace;color:#888;flex:none}
  .c{display:flex;align-items:center}
  svg{outline:1px dashed #ccd; outline-offset:1px}
</style></head><body>${body}</body></html>`;

mkdirSync(fileURLToPath(new URL("../apps/docs/public", import.meta.url)), { recursive: true });
writeFileSync(fileURLToPath(new URL("../apps/docs/public/vcheck.html", import.meta.url)), html);
console.log("wrote apps/docs/public/vcheck.html");

import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TraceFold } from "../../dist/charts/trace-fold/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(TraceFold as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/trace-fold.tsx TRACE).
const TRACE = [
  { label: "request", start: 0, duration: 214, depth: 0 },
  { label: "db.query", start: 10, duration: 86, depth: 1, parent: 0 },
  { label: "auth", start: 0, duration: 8, depth: 1, parent: 0 },
  { label: "render", start: 96, duration: 60, depth: 1, parent: 0 },
  { label: "serialize", start: 156, duration: 40, depth: 1, parent: 0 },
  { label: "index-scan", start: 12, duration: 70, depth: 2, parent: 1 },
  { label: "decode", start: 82, duration: 12, depth: 2, parent: 1 },
  { label: "log", start: 200, duration: 14, depth: 1, parent: 0 },
  { label: "gc", start: 90, duration: 5, depth: 2, parent: 1 },
];

function gallery(): string {
  const sentence = `The p95 request folds to ${svg({ data: TRACE, width: 120, height: 24, summary: false })} — db.query bounds it.`;
  const cell = `<table><tbody>
    <tr><td>GET /feed</td><td>${svg({ data: TRACE, width: 140, height: 24, summary: false })}</td></tr>
    <tr><td>POST /save</td><td>${svg({ data: TRACE.slice(0, 5), width: 140, height: 24, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">p95 trace</div><div class="value">214 ms</div>
    ${svg({ data: TRACE, width: 200, height: 48, title: "p95 trace" })}</div>`;
  const tab = `<div class="tab"><span>p95</span> ${svg({ data: TRACE, width: 56, height: 12, labels: false, summary: false })}</div>`;
  const variants = [
    svg({ data: TRACE, width: 200, height: 48, title: "default (critical accented)" }),
    svg({ data: TRACE, emphasis: "none", width: 200, height: 48, title: "uniform" }),
    svg({ data: TRACE, labels: false, width: 120, height: 24, title: "no labels" }),
    svg({
      data: [{ label: "task", start: 0, duration: 50, depth: 0 }],
      width: 120,
      height: 24,
      title: "single span",
    }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: TRACE, width: 160, height: 40, summary: false })}</span>`,
    )
    .join(" ");
  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 20px; }
    table { border-collapse: collapse; } td { padding: 4px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; } .card .value { font-size: 22px; font-weight: 600; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variants { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants" class="variants">${variants}</section>
  <section id="presets">${presets}</section>`;
}

test("trace-fold — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "trace-fold-gallery");
});

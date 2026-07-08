import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HistogramStrip } from "../../dist/charts/histogram-strip/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(HistogramStrip as never, props));

const TIMES = Array.from({ length: 120 }, (_, i) =>
  i % 3 === 0 ? 40 + (i % 10) : 20 + ((i * 7) % 60),
);

function gallery(): string {
  const sentence = `Response times cluster ${svg({ data: TIMES, width: 70, height: 16, summary: false })} around 45 ms.`;
  const cell = `<table><tbody>
    <tr><td>API</td><td>${svg({ data: TIMES, summary: false })}</td></tr>
    <tr><td>Batch</td><td>${svg({ data: TIMES.map((v) => v * 1.6), summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Latency distribution</div><div class="value">45 ms modal</div>
    ${svg({ data: TIMES, width: 150, height: 32, highlight: 45, title: "Latency" })}</div>`;
  const tab = `<div class="tab"><span>Dist</span> ${svg({ data: TIMES, width: 40, height: 12, summary: false })}</div>`;
  const variants = [
    svg({ data: TIMES, title: "auto bins" }),
    svg({ data: TIMES, bins: 6, title: "6 bins" }),
    svg({ data: TIMES, highlight: 45, title: "highlight" }),
    svg({ data: [4, 4, 4, 4], title: "all equal" }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: TIMES, highlight: 45, summary: false })}</span>`,
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

test("histogram-strip — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "histogram-strip-gallery");
});

import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MicroBox } from "../../dist/charts/micro-box/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(MicroBox as never, props));

const RAW = [12, 30, 35, 38, 42, 45, 48, 51, 60, 96];
const OUT = [...Array.from({ length: 20 }, (_, i) => 40 + i), 400, 500];

function gallery(): string {
  const sentence = `p95 latency sits ${svg({ data: RAW, width: 60, height: 12, summary: false })} well inside range.`;
  const cell = `<table><tbody>
    <tr><td>p50</td><td>${svg({ stats: { min: 12, q1: 35, median: 42, q3: 51, max: 96 }, summary: false })}</td></tr>
    <tr><td>p95</td><td>${svg({ stats: { min: 40, q1: 80, median: 110, q3: 160, max: 300 }, domain: [0, 300], summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Latency spread</div><div class="value">42 median</div>
    ${svg({ data: RAW, width: 150, height: 20, title: "Latency spread" })}</div>`;
  const tab = `<div class="tab"><span>Spread</span> ${svg({ data: RAW, width: 36, height: 10, summary: false })}</div>`;
  const variants = [
    svg({ data: RAW, title: "minmax" }),
    svg({ data: OUT, whiskers: "tukey", title: "tukey outliers" }),
    svg({ data: [3, 7, 9], title: "too few (dots)" }),
    svg({ data: [5, 5, 5, 5, 5, 1, 9], title: "degenerate IQR" }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: RAW, summary: false })}</span>`,
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

test("micro-box — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "micro-box-gallery");
});

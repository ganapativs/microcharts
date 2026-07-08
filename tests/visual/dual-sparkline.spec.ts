import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DualSparkline } from "../../dist/charts/dual-sparkline/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(DualSparkline as never, props));

const US = [12, 13, 12.4, 14, 15.2, 14.8, 16, 17.5, 17, 18.4, 19, 21];
const BENCH = [12, 12.4, 12.8, 13.1, 13.6, 14, 14.2, 14.8, 15, 15.4, 15.8, 16];

function gallery(): string {
  const sentence = `Conversion ran ahead of benchmark ${svg({ data: US, compare: BENCH, width: 80, summary: false })} all quarter.`;
  const cell = `<table><tbody>
    <tr><td>Search</td><td>${svg({ data: US, compare: BENCH, summary: false })}</td></tr>
    <tr><td>Social</td><td>${svg({ data: BENCH, compare: US, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Conversion vs market</div><div class="value">21%</div>
    ${svg({ data: US, compare: BENCH, width: 150, height: 26, label: "last", title: "Conversion vs market" })}</div>`;
  const tab = `<div class="tab"><span>vs mkt</span> ${svg({ data: US, compare: BENCH, width: 44, height: 10, summary: false })}</div>`;
  const variants = [
    svg({ data: US, compare: BENCH, width: 90, title: "default" }),
    svg({ data: US, compare: BENCH, width: 90, label: "last", title: "last label" }),
    svg({ data: US, compare: BENCH, width: 90, band: [13, 16], title: "with band" }),
    svg({ data: US, compare: US, width: 90, title: "coincident ends" }),
    svg({ data: US, compare: BENCH.slice(0, 7), width: 90, title: "shorter benchmark" }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: US, compare: BENCH, width: 80, summary: false })}</span>`,
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

test("dual-sparkline — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "dual-sparkline-gallery");
});

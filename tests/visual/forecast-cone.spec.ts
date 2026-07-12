import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ForecastCone } from "../../dist/charts/forecast-cone/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(ForecastCone as never, props));

const HIST = [30, 32, 31, 34, 36, 35, 38];
const FORE = {
  mid: [39, 40, 41, 42],
  p80: [
    [36, 42],
    [35, 45],
    [34, 50],
    [33, 55],
  ],
  p50: [
    [37, 41],
    [37, 43],
    [36, 46],
    [35, 49],
  ],
};

function gallery(): string {
  const sentence = `Q4 ${svg({ data: HIST, forecast: FORE, width: 100, height: 20, title: "Q4" })} could still miss.`;

  const cell = `<table><tbody>
    <tr><td>Revenue</td><td>${svg({ data: HIST, forecast: FORE, target: 45, summary: false })}</td></tr>
    <tr><td>Signups</td><td>${svg({ data: HIST.map((v) => v - 5), forecast: FORE, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Q4 revenue</div>
    <div class="value">≈ 42</div>
    ${svg({ data: HIST, forecast: FORE, target: 45, width: 160, height: 26, label: "landing", title: "Q4 revenue" })}
  </div>`;

  const tab = `<div class="tab"><span>Q4 ⌐</span> ${svg({ data: HIST, forecast: FORE, width: 64, height: 16, label: "none", summary: false })}</div>`;

  const variants = [
    svg({ data: HIST, forecast: FORE, title: "two bands" }),
    svg({ data: HIST, forecast: { mid: FORE.mid, p80: FORE.p80 }, title: "single band" }),
    svg({ data: HIST, forecast: FORE, target: 45, title: "target" }),
    svg({ data: [], forecast: FORE, title: "cone only" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: HIST, forecast: FORE, summary: false })}</span>`,
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

test("forecast-cone — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "forecast-cone-gallery");
});

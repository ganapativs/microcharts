import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Horizon } from "../../dist/charts/horizon/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(Horizon as never, props));

const LOAD = [
  2, 5, 9, 14, 22, 31, 26, 18, 12, 24, 38, 45, 41, 30, 19, 11, 6, 3, 8, 16, 27, 35, 29, 20,
];

function gallery(): string {
  const sentence = `CPU load folded tight ${svg({ data: LOAD, width: 80, summary: false })} into the row.`;
  const cell = `<table><tbody>
    <tr><td>web-1</td><td>${svg({ data: LOAD, summary: false })}</td></tr>
    <tr><td>web-2</td><td>${svg({ data: LOAD.map((v) => 45 - v), summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Cluster load</div><div class="value">45 peak</div>
    ${svg({ data: LOAD, width: 150, height: 20, title: "Cluster load" })}</div>`;
  const tab = `<div class="tab"><span>Load</span> ${svg({ data: LOAD, width: 44, height: 8, summary: false })}</div>`;
  const variants = [
    svg({ data: LOAD, width: 90, title: "2 folds (default)" }),
    svg({ data: LOAD, width: 90, folds: 3, title: "3 folds" }),
    svg({ data: LOAD.map((v, i) => v - 20 + (i % 3)), width: 90, title: "diverging around 0" }),
    svg({ data: LOAD, baseline: 20, width: 90, title: "baseline 20" }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: LOAD, width: 80, summary: false })}</span>`,
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

test("horizon — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "horizon-gallery");
});

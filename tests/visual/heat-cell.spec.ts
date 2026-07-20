import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HeatCell } from "../../dist/charts/heat-cell/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(HeatCell as never, props));

const D = [0, 100] as const;

function gallery(): string {
  const sentence = `Peak load today hit ${svg({ value: 86, domain: D, title: "Peak load" })} on the shared scale.`;

  // table-cell matrix — the hero context: shared domain per grid
  const row = (name: string, values: number[]) =>
    `<tr><td>${name}</td>${values
      .map((v) => `<td>${svg({ value: v, domain: D, summary: false })}</td>`)
      .join("")}</tr>`;
  const cell = `<table><tbody>
    ${row("us-east", [12, 40, 62, 88, 74, 51])}
    ${row("eu-west", [8, 22, 35, 70, 92, 60])}
    ${row("ap-south", [4, 15, 28, 44, 66, 83])}
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Cache pressure ${svg({ value: 71, domain: D, title: "Cache pressure" })}</div>
    <div class="value">71 / 100</div>
  </div>`;

  const tab = `<div class="tab"><span>Load</span> ${svg({ value: 88, domain: D, summary: false })}</div>`;

  const variants = [
    svg({ value: 5, domain: D, title: "step 1" }),
    svg({ value: 30, domain: D, title: "step 2" }),
    svg({ value: 50, domain: D, title: "step 3" }),
    svg({ value: 70, domain: D, title: "step 4" }),
    svg({ value: 95, domain: D, title: "step 5" }),
    svg({ value: 70, domain: D, shape: "round", title: "round" }),
    svg({ value: 70, domain: D, shape: "dot", title: "dot" }),
    svg({ value: 70, domain: D, steps: 3, title: "3 steps" }),
    svg({ value: 8, domain: [0, 9], label: "value", title: "label" }),
    svg({ value: Number.NaN, title: "no data" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${[20, 50, 90]
          .map((v) => svg({ value: v, domain: D, summary: false }))
          .join(" ")}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 20px; }
    table { border-collapse: collapse; } td { padding: 3px 6px; }
    td:first-child { font-size: 12px; padding-right: 10px; }
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

test("heat-cell — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "heat-cell-gallery");
});

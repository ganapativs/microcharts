import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GardenGrid } from "../../dist/charts/garden-grid/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(GardenGrid as never, props));
const WEEKS = [12, 20, 8, 0, 15, 28, 34, 5, 0, 22, 18, 9, 3, 0, 24, 30, 11, 6, 19, 0, 26];

function gallery(): string {
  const sentence = `Team rhythm: ${svg({ data: WEEKS.slice(0, 14), rows: 1, summary: false, cell: 8 })}.`;

  const cell = `<table><tbody>
    <tr><td>web</td><td>${svg({ data: WEEKS.slice(0, 12), rows: 1, summary: false, cell: 7 })}</td></tr>
    <tr><td>api</td><td>${svg({ data: WEEKS.slice(4, 16), rows: 1, summary: false, cell: 7 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">This quarter</div>
    <div class="value">${svg({ data: WEEKS, unit: "weeks", summary: false, cell: 11 })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ data: WEEKS.slice(0, 7), rows: 1, summary: false, cell: 7 })} <span>Activity</span></div>`;

  const variants = [
    svg({ data: WEEKS, unit: "weeks", cell: 10 }),
    svg({ data: WEEKS, steps: 3, cell: 10 }),
    svg({ data: WEEKS.map((v, i) => (i % 3 === 0 ? 0 : v)), empty: "blank", cell: 10 }),
    svg({ data: [0, 0, 0, 0, 0, 0, 0], cell: 10 }),
  ]
    .map((s) => `<span style="display:inline-block">${s}</span>`)
    .join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: WEEKS.slice(0, 14), summary: false, cell: 8 })}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 22px; }
    table { border-collapse: collapse; } td { padding: 6px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variants { display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; display: inline-flex; align-items: center; gap: 6px; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants" class="variants">${variants}</section>
  <section id="presets">${presets}</section>`;
}

test("garden-grid — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "garden-grid-gallery");
});

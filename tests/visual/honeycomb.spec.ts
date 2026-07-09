import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Honeycomb } from "../../dist/charts/honeycomb/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(Honeycomb as never, props));

function gallery(): string {
  const sentence = `The room is ${svg({ value: 34, total: 40, unit: "seats", cellR: 4 })} full.`;

  const cell = `<table><tbody>
    <tr><td>A</td><td>${svg({ value: 7, total: 10, rows: 1, summary: false, cellR: 4 })}</td></tr>
    <tr><td>B</td><td>${svg({ value: 4, total: 10, rows: 1, summary: false, cellR: 4 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Seats</div>
    <div class="value">${svg({ value: 34, total: 40, unit: "seats", summary: false, cellR: 6 })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ value: 6, total: 8, rows: 1, summary: false, cellR: 4 })} <span>Licenses</span></div>`;

  const variants = [
    svg({ value: 34, total: 40, unit: "seats", title: "outline" }),
    svg({ value: 28, total: 40, empty: "dim", title: "dim" }),
    svg({ value: 7, total: 10, rows: 1, title: "strip" }),
    svg({ value: 45, total: 40, title: "over-cap" }),
  ]
    .map((s) => `<div>${s}</div>`)
    .join("");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ value: 28, total: 40, summary: false, cellR: 4 })}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 22px; }
    table { border-collapse: collapse; } td { padding: 6px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variants { display: flex; gap: 28px; flex-wrap: wrap; align-items: center; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; display: inline-flex; align-items: center; gap: 6px; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants" class="variants">${variants}</section>
  <section id="presets">${presets}</section>`;
}

test("honeycomb — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "honeycomb-gallery");
});

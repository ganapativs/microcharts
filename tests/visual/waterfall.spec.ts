import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Waterfall } from "../../dist/charts/waterfall/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(Waterfall as never, props));

const PL = [
  { label: "Product", value: 42 },
  { label: "Services", value: 18 },
  { label: "Refunds", value: -12 },
  { label: "Opex", value: -26 },
  { label: "FX", value: 5 },
];

function gallery(): string {
  const sentence = `Q2 profit bridged ${svg({ data: PL, start: 60, width: 80, summary: false })} from opening to close.`;
  const cell = `<table><tbody>
    <tr><td>Q1</td><td>${svg({ data: PL, start: 60, summary: false })}</td></tr>
    <tr><td>Q2</td><td>${svg({ data: PL.map((d) => ({ label: d.label, value: -d.value })), start: 60, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Net income bridge</div><div class="value">$87k</div>
    ${svg({ data: PL, start: 60, width: 150, height: 24, title: "Net income bridge" })}</div>`;
  const tab = `<div class="tab"><span>P&amp;L</span> ${svg({ data: PL, start: 60, width: 44, height: 10, summary: false })}</div>`;
  const variants = [
    svg({ data: PL, start: 60, width: 90, title: "with total" }),
    svg({ data: PL, start: 60, total: false, width: 90, title: "no total" }),
    svg({ data: PL, start: 60, positive: "down", width: 90, title: "costs: down is good" }),
    svg({ data: [{ label: "One", value: 12 }], start: 0, width: 90, title: "single step" }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: PL, start: 60, width: 80, summary: false })}</span>`,
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

test("waterfall — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "waterfall-gallery");
});

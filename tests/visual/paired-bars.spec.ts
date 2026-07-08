import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PairedBars } from "../../dist/charts/paired-bars/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(PairedBars as never, props));

const BUDGET = [
  { label: "East", value: 940, ref: 1200 },
  { label: "West", value: 410, ref: 400 },
  { label: "South", value: 620, ref: 600 },
  { label: "North", value: 120, ref: 300 },
];

function gallery(): string {
  const sentence = `Actuals vs budget ${svg({ data: BUDGET, width: 48, height: 14, title: "Budget" })} still lag in the East.`;

  // table cell — the hero context (budget vs actual per region)
  const cell = `<table><tbody>
    <tr><td>Q1</td><td>${svg({ data: BUDGET, summary: false })}</td></tr>
    <tr><td>Q2</td><td>${svg({ data: BUDGET.map((d) => ({ ...d, value: (d.value * 1.3) % 1200 })), summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Actual vs plan</div>
    <div class="value">−22%</div>
    ${svg({ data: BUDGET, width: 130, height: 40, positive: "up", title: "Actual vs plan" })}
  </div>`;

  const tab = `<div class="tab"><span>Plan</span> ${svg({ data: BUDGET.slice(0, 2), width: 30, height: 12, summary: false })}</div>`;

  const variants = [
    svg({ data: BUDGET, title: "grouped" }),
    svg({ data: BUDGET, mode: "overlay", title: "overlay" }),
    svg({ data: BUDGET, positive: "up", title: "valence" }),
    svg({ data: BUDGET, orientation: "horizontal", width: 50, height: 34, title: "horizontal" }),
    svg({
      data: [
        { label: "a", value: 5, ref: null },
        { label: "b", value: 4, ref: 6 },
      ],
      title: "missing ref",
    }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: BUDGET.slice(0, 3), summary: false })}</span>`,
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

test("paired-bars — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "paired-bars-gallery");
});

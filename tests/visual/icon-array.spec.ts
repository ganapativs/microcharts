import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IconArray } from "../../dist/charts/icon-array/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(IconArray as never, props));

function gallery(): string {
  const sentence = `Adverse events ${svg({ value: 0.15, of: 20, width: 90, height: 22, title: "Adverse events" })} in this cohort.`;

  const cell = `<table><tbody>
    <tr><td>arm A</td><td>${svg({ value: 0.15, of: 20, summary: false })}</td></tr>
    <tr><td>arm B</td><td>${svg({ value: 0.4, of: 20, summary: false })}</td></tr>
    <tr><td>arm C</td><td>${svg({ value: 0.05, of: 20, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Adverse events</div>
    <div class="value">3 in 20</div>
    ${svg({ value: 0.15, of: 20, width: 130, height: 30, title: "Adverse events" })}
  </div>`;

  const tab = `<div class="tab"><span>Risk</span> ${svg({ value: 0.1, of: 10, label: "none", width: 40, height: 16, summary: false })}</div>`;

  const variants = [
    svg({ value: 0.15, of: 20, title: "3 in 20" }),
    svg({ value: 0.1, of: 10, title: "1 in 10" }),
    svg({ value: 0.15, of: 20, label: "percent", title: "percent" }),
    svg({ value: 0.6, of: 10, shape: "round", title: "round" }),
    svg({ value: 0.15, of: 20, positive: "down", title: "risk polarity" }),
    svg({ value: 0.37, of: 100, width: 90, height: 44, label: "none", title: "of 100" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ value: 0.15, of: 20, summary: false })}</span>`,
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

test("icon-array — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "icon-array-gallery");
});

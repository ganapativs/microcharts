import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ErrorBudget } from "../../dist/charts/error-budget/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(ErrorBudget as never, props));

const DEMO = [1, 0.96, 0.93, 0.9, 0.86, 0.83, 0.79, 0.75, 0.71, 0.67, 0.64, 0.62];
const BURNED = [1, 0.82, 0.6, 0.38, 0.18, 0.04, 0];

function gallery(): string {
  const sentence = `Budget ${svg({ data: DEMO, window: 30, width: 90, height: 20, title: "Budget" })} is on pace.`;

  const cell = `<table><tbody>
    <tr><td>Checkout</td><td>${svg({ data: DEMO, window: 30, label: "remaining", summary: false })}</td></tr>
    <tr><td>Search</td><td>${svg({ data: BURNED, window: 20, label: "remaining", summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Checkout SLO</div>
    <div class="value">62%</div>
    ${svg({ data: DEMO, window: 30, width: 150, height: 28, label: "remaining", title: "Checkout SLO" })}
  </div>`;

  const tab = `<div class="tab"><span>SLO ⌐</span> ${svg({ data: DEMO, window: 30, width: 56, height: 16, label: "none", summary: false })}</div>`;

  const variants = [
    svg({ data: DEMO, window: 30, title: "on pace" }),
    svg({ data: BURNED, window: 20, title: "fast-burn" }),
    svg({ data: DEMO, window: 30, rates: [1], title: "diagonal only" }),
    svg({ data: [1, 0.5, 0.2, 0.05, 0], window: 12, title: "exhausted" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: DEMO, window: 30, summary: false })}</span>`,
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

test("error-budget — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "error-budget-gallery");
});

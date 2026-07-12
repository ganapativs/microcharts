import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BurnChart } from "../../dist/charts/burn-chart/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(BurnChart as never, props));

const PLAN = [40, 36, 32, 28, 24, 20, 16, 12, 8, 4, 0];
const ACTUAL = [40, 35, 31, 27, 24, 21];
const UPPLAN = PLAN.map((v) => 40 - v);
const UPACT = ACTUAL.map((v) => 40 - v);

function gallery(): string {
  const sentence = `Sprint ${svg({ data: { plan: PLAN, actual: ACTUAL }, width: 90, height: 20, title: "Sprint" })} is running late.`;

  const cell = `<table><tbody>
    <tr><td>S11</td><td>${svg({ data: { plan: PLAN, actual: [40, 36, 33, 29, 25, 21] }, label: "gap", summary: false })}</td></tr>
    <tr><td>S12</td><td>${svg({ data: { plan: PLAN, actual: ACTUAL }, label: "gap", summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Sprint 12</div>
    <div class="value">+2 d</div>
    ${svg({ data: { plan: PLAN, actual: ACTUAL }, width: 150, height: 28, label: "gap", title: "Sprint 12" })}
  </div>`;

  const tab = `<div class="tab"><span>S12 ⌐</span> ${svg({ data: { plan: PLAN, actual: ACTUAL }, width: 56, height: 16, label: "none", summary: false })}</div>`;

  const variants = [
    svg({ data: { plan: PLAN, actual: ACTUAL }, title: "behind" }),
    svg({ data: { plan: PLAN, actual: [40, 34, 28, 22, 16, 10] }, title: "ahead" }),
    svg({ data: { plan: UPPLAN, actual: UPACT }, mode: "up", title: "burn-up" }),
    svg({ data: { plan: PLAN, actual: ACTUAL }, projection: false, title: "no projection" }),
    svg({ data: { plan: PLAN, actual: [40, 38, 37, 36, 36, 36] }, title: "flatlined" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: { plan: PLAN, actual: ACTUAL }, summary: false })}</span>`,
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

test("burn-chart — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "burn-chart-gallery");
});

import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CyclePlot } from "../../dist/charts/cycle-plot/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(CyclePlot as never, props));

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKS: number[] = [];
for (let w = 0; w < 6; w++) WEEKS.push(38, 40 + w * 2, 45, 48, 52, 61, 44);

function gallery(): string {
  const sentence = `The week has a shape ${svg({ data: WEEKS, period: 7, slots: DAYS, cycleUnit: "weeks", width: 120, height: 24, title: "Weekly shape" })} worth reading.`;

  const cell = `<table><tbody>
    <tr><td>Traffic</td><td>${svg({ data: WEEKS, period: 7, summary: false, width: 90, height: 20 })}</td></tr>
    <tr><td>Load</td><td>${svg({ data: WEEKS.slice(0, 28), period: 7, summary: false, width: 90, height: 20 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Weekly shape</div>
    <div class="value">Fri peaks</div>
    ${svg({ data: WEEKS, period: 7, slots: DAYS, cycleUnit: "weeks", width: 200, height: 40, title: "Weekly shape" })}
  </div>`;

  const tab = `<div class="tab"><span>Cycle</span> ${svg({ data: WEEKS, period: 7, width: 72, height: 18, summary: false })}</div>`;

  const variants = [
    svg({ data: WEEKS, period: 7, title: "default" }),
    svg({ data: WEEKS, period: 7, center: "median", title: "median" }),
    svg({ data: WEEKS, period: 7, trend: false, title: "spine only" }),
    svg({ data: WEEKS, period: 7, spine: false, title: "drift only" }),
    svg({ data: [5, 6, 7], period: 7, title: "period ≥ n" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: WEEKS, period: 7, summary: false, width: 100, height: 24 })}</span>`,
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

test("cycle-plot — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "cycle-plot-gallery");
});

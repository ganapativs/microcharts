import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RetentionCurve } from "../../dist/charts/retention-curve/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(RetentionCurve as never, props));

const DATA = [1, 0.72, 0.55, 0.47, 0.42, 0.4, 0.39, 0.385, 0.382, 0.38, 0.379, 0.378];
const BENCH = [1, 0.6, 0.44, 0.37, 0.33, 0.3, 0.29, 0.285, 0.282, 0.28, 0.279, 0.278];

function gallery(): string {
  const sentence = `Cohort ${svg({ data: DATA, width: 90, height: 20, unit: "week", title: "Cohort" })} settled at 38%.`;

  const cell = `<table><tbody>
    <tr><td>Jan</td><td>${svg({ data: DATA, label: "last", summary: false })}</td></tr>
    <tr><td>Feb</td><td>${svg({ data: DATA.map((v) => Math.min(1, v + 0.06)), label: "last", summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">W12 retention</div>
    <div class="value">38%</div>
    ${svg({ data: DATA, benchmark: BENCH, width: 150, height: 28, unit: "week", label: "last", title: "W12 retention" })}
  </div>`;

  const tab = `<div class="tab"><span>W12 ⌐</span> ${svg({ data: DATA, width: 56, height: 16, label: "none", summary: false })}</div>`;

  const variants = [
    svg({ data: DATA, title: "step" }),
    svg({ data: DATA, benchmark: BENCH, title: "benchmark" }),
    svg({ data: DATA, curve: "smooth", title: "smooth" }),
    svg({ data: DATA, plateau: false, title: "no plateau" }),
    svg({ data: [1, 0.8, 0.6, 0.45, 0.32, 0.22], title: "still leaking" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: DATA, summary: false })}</span>`,
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

test("retention-curve — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "retention-curve-gallery");
});

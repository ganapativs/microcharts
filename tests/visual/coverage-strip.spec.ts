import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CoverageStrip } from "../../dist/charts/coverage-strip/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(CoverageStrip as never, props));

const COVERAGE = [3, 4, null, 5, 0, null, null, 6, 8, 7, null, 9, 11, 10];

function gallery(): string {
  const sentence = `Uptime this window ${svg({ data: COVERAGE, expected: 18, width: 90, height: 10, title: "Uptime" })} has one long gap.`;

  const cell = `<table><tbody>
    <tr><td>sensor-a</td><td>${svg({ data: COVERAGE, expected: 18, label: "percent", summary: false })}</td></tr>
    <tr><td>sensor-b</td><td>${svg({ data: [1, 1, 1], expected: 18, label: "percent", summary: false })}</td></tr>
    <tr><td>sensor-c</td><td>${svg({ data: [3, 0, null, 5, 6, null, 8], expected: 12, label: "percent", summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Coverage (24 h)</div>
    <div class="value">75%</div>
    ${svg({ data: COVERAGE, expected: 18, width: 150, height: 12, title: "Coverage" })}
  </div>`;

  const tab = `<div class="tab"><span>Coverage</span> ${svg({ data: COVERAGE.slice(0, 10), width: 44, height: 8, summary: false })}</div>`;

  const variants = [
    svg({ data: COVERAGE, title: "binary" }),
    svg({ data: COVERAGE, mode: "intensity", domain: [0, 12], title: "intensity" }),
    svg({ data: COVERAGE, shape: "round", title: "round" }),
    svg({ data: COVERAGE, expected: 18, label: "percent", title: "percent" }),
    svg({ data: [null, null, null, null], title: "all missing" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: COVERAGE, expected: 18, label: "percent", summary: false })}</span>`,
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

test("coverage-strip — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "coverage-strip-gallery");
});

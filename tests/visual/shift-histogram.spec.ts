import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ShiftHistogram } from "../../dist/charts/shift-histogram/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(ShiftHistogram as never, props));

const BEFORE = Array.from({ length: 100 }, (_, i) => 120 + (i % 40) - 20);
const AFTER = Array.from({ length: 100 }, (_, i) => 96 + (i % 40) - 20);
const MS = (n: number) => `${Math.round(n)} ms`;

function gallery(): string {
  const sentence = `The fix ${svg({ data: { before: BEFORE, after: AFTER }, format: MS, width: 110, height: 22, title: "Fix" })} moved the whole curve.`;

  const cell = `<table><tbody>
    <tr><td>Latency</td><td>${svg({ data: { before: BEFORE, after: AFTER }, format: MS, summary: false })}</td></tr>
    <tr><td>Errors</td><td>${svg({ data: { before: BEFORE, after: BEFORE }, format: MS, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">The fix</div>
    <div class="value">−24 ms</div>
    ${svg({ data: { before: BEFORE, after: AFTER }, format: MS, width: 170, height: 28, title: "The fix" })}
  </div>`;

  const tab = `<div class="tab"><span>Fix</span> ${svg({ data: { before: BEFORE, after: AFTER }, format: MS, width: 72, height: 18, label: "none", summary: false })}</div>`;

  const variants = [
    svg({ data: { before: BEFORE, after: AFTER }, format: MS, title: "mirror" }),
    svg({ data: { before: BEFORE, after: AFTER }, format: MS, mode: "overlay", title: "overlay" }),
    svg({ data: { before: BEFORE, after: AFTER }, format: MS, bins: 6, title: "6 bins" }),
    svg({ data: { before: BEFORE, after: BEFORE }, format: MS, title: "no shift" }),
    svg({ data: { before: BEFORE, after: [] }, format: MS, title: "one side" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: { before: BEFORE, after: AFTER }, summary: false })}</span>`,
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

test("shift-histogram — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "shift-histogram-gallery");
});

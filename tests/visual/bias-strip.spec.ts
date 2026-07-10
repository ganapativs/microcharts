import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BiasStrip } from "../../dist/charts/bias-strip/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(BiasStrip as never, props));

// a ~+2 bias with noise and two pairs beyond the limits of agreement
const DIFFS = [
  1.8, 2.4, 1.5, 2.9, 2.1, 1.2, 2.6, 3.0, 1.9, 2.3, 6.5, 2.0, 1.7, 2.8, 2.2, -1.5, 2.5, 1.6, 2.7,
  2.0,
];
const MEASURED = DIFFS.map((d, i) => ({ a: i + d, b: i }));
// near-perfect agreement (band collapses to a hair)
const TIGHT = Array.from({ length: 12 }, (_, i) => ({ a: 20 + i, b: 20 + i }));

function gallery(): string {
  const sentence = `Device and reference ${svg({ data: MEASURED, width: 60, height: 32, title: "Device vs reference" })} agree, +2 bias.`;

  const cell = `<table><tbody>
    <tr><td>Cuff A</td><td>${svg({ data: MEASURED, summary: false })}</td><td>+2.2</td></tr>
    <tr><td>Cuff B</td><td>${svg({ data: TIGHT, summary: false })}</td><td>0.0</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Manual vs auto</div>
    <div class="value">+2.2 bias</div>
    ${svg({ data: MEASURED, width: 150, height: 80, title: "Manual vs auto" })}
  </div>`;

  const tab = `<div class="tab"><span>Agreement</span> ${svg({ data: MEASURED, width: 40, height: 22, summary: false })}</div>`;

  const variants = [
    svg({ data: MEASURED, title: "measured" }),
    svg({ data: MEASURED, limits: 2.58, title: "99% limits" }),
    svg({ data: MEASURED, label: "none", title: "no caption" }),
    svg({ data: TIGHT, title: "perfect agreement" }),
    svg({ data: MEASURED.slice(0, 4), title: "n < 5, dots only" }),
    svg({ data: MEASURED, r: 2.5, title: "bigger dots" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: MEASURED, width: 80, height: 34, summary: false })}</span>`,
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

test("bias-strip — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "bias-strip-gallery");
});

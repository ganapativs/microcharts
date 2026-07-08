import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QuantileDots } from "../../dist/charts/quantile-dots/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(QuantileDots as never, props));

const WAITS = Array.from({ length: 200 }, (_, i) =>
  Math.round(4 + (i % 30) * 0.35 + ((i * 7) % 13) * 1.1 + (i % 50 === 0 ? 20 : 0)),
);
const MIN = (n: number) => `${n} min`;

function gallery(): string {
  const sentence = `Miss the SLA ${svg({ data: WAITS, threshold: 15, format: MIN, width: 100, height: 22, title: "SLA" })} — count them.`;

  const cell = `<table><tbody>
    <tr><td>Route 12</td><td>${svg({ data: WAITS, threshold: 15, format: MIN, summary: false })}</td></tr>
    <tr><td>Route 40</td><td>${svg({ data: WAITS.map((v) => v - 3), threshold: 15, format: MIN, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Wait &gt; 15 min</div>
    <div class="value">10 in 20</div>
    ${svg({ data: WAITS, threshold: 15, format: MIN, width: 160, height: 30, title: "Wait > 15 min" })}
  </div>`;

  const tab = `<div class="tab"><span>Wait ⣿</span> ${svg({ data: WAITS, threshold: 15, format: MIN, width: 72, height: 18, label: "none", summary: false })}</div>`;

  const variants = [
    svg({ data: WAITS, threshold: 15, format: MIN, title: "20 dots" }),
    svg({ data: WAITS, count: 15, threshold: 15, format: MIN, title: "15 dots" }),
    svg({ data: WAITS, threshold: 10, side: "below", format: MIN, title: "below" }),
    svg({ data: WAITS, title: "no threshold" }),
    svg({ data: [7, 7, 7, 7, 7], title: "certainty" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: WAITS, threshold: 15, summary: false })}</span>`,
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

test("quantile-dots — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "quantile-dots-gallery");
});

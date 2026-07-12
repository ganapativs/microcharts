import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
// The BUILT artifact — visual baseline doubles as a dist smoke test (plan/09).
import { TrendArrow } from "../../dist/charts/trend-arrow/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(TrendArrow as never, props));

function gallery(): string {
  const sentence = `Checkout latency ${svg({ value: -0.08, positive: "down", title: "Latency" })} improved again this week.`;

  // table direction column — the hero context (plan/22 #1)
  const cell = `<table><tbody>
    <tr><td>API p95</td><td>${svg({ value: -0.12, positive: "down", summary: false })}</td><td>184 ms</td></tr>
    <tr><td>Error rate</td><td>${svg({ value: 0.4, positive: "down", summary: false })}</td><td>0.42%</td></tr>
    <tr><td>Throughput</td><td>${svg({ value: 0.03, flatBand: 0.05, summary: false })}</td><td>2.1k rps</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Weekly active users</div>
    <div class="value">48,210 ${svg({ value: 0.12, showValue: true, format: { style: "percent", maximumFractionDigits: 0 }, title: "WAU change" })}</div>
  </div>`;

  const tab = `<div class="tab"><span>Traffic</span> ${svg({ value: 0.07, glyph: "chevron", summary: false })}</div>`;

  const variants = [
    svg({ value: 1, title: "arrow up" }),
    svg({ value: -1, title: "arrow down" }),
    svg({ value: 0, title: "flat" }),
    svg({ value: 1, glyph: "triangle", title: "triangle" }),
    svg({ value: 1, glyph: "chevron", title: "chevron" }),
    svg({ value: 1, positive: "down", title: "positive=down" }),
    svg({
      value: 0.12,
      showValue: true,
      format: { style: "percent", maximumFractionDigits: 0 },
      title: "showValue",
    }),
    svg({ value: Number.NaN, title: "no data" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ value: 0.3, summary: false })} ${svg({ value: -0.3, summary: false })}</span>`,
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

test("trend-arrow — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "trend-arrow-gallery");
});

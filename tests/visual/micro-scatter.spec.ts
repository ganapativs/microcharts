import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MicroScatter } from "../../dist/charts/micro-scatter/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(MicroScatter as never, props));

const CLOUD = Array.from({ length: 24 }, (_, i) => ({
  x: i,
  y: i * 3 + ((i * 7) % 5) * 6,
}));
const LOOSE = Array.from({ length: 24 }, (_, i) => ({
  x: i,
  y: ((i * 13) % 24) * 3,
}));

function gallery(): string {
  // sentence — the hero context
  const sentence = `Latency and error rate ${svg({ data: CLOUD, width: 44, height: 26, title: "Latency vs error rate" })} correlate strongly.`;

  const cell = `<table><tbody>
    <tr><td>API</td><td>${svg({ data: CLOUD, summary: false })}</td><td>r 0.9+</td></tr>
    <tr><td>Batch</td><td>${svg({ data: LOOSE, summary: false })}</td><td>r ~0</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Spend vs conversions</div>
    <div class="value">r 0.92</div>
    ${svg({ data: CLOUD, trend: true, width: 130, height: 72, title: "Spend vs conversions" })}
  </div>`;

  const tab = `<div class="tab"><span>Corr</span> ${svg({ data: CLOUD.slice(0, 12), width: 30, height: 18, summary: false })}</div>`;

  const variants = [
    svg({ data: CLOUD, title: "cloud" }),
    svg({ data: CLOUD, trend: true, title: "trend" }),
    svg({ data: CLOUD, focal: 12, title: "focal" }),
    svg({ data: LOOSE, title: "no relationship" }),
    svg({ data: CLOUD, r: 2.5, title: "bigger dots" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: CLOUD.slice(0, 16), trend: true, summary: false })}</span>`,
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

test("micro-scatter — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "micro-scatter-gallery");
});

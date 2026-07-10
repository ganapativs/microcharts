import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EventRaster } from "../../dist/charts/event-raster/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(EventRaster as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/event-raster.tsx RASTER).
const RASTER = [
  { label: "api", events: [2, 5, 6, 14, 20, 21, 33, 40, 41, 48, 55] },
  { label: "db", events: [3, 6, 15, 21, 34, 41, 55] },
  { label: "cache", events: [6, 21, 41, 55] },
  { label: "queue", events: [10, 30, 50] },
];

function gallery(): string {
  const sentence = `Services fired ${svg({ data: RASTER, width: 120, height: 24, labels: false, summary: false })} through the window.`;
  const cell = `<table><tbody>
    <tr><td>fleet A</td><td>${svg({ data: RASTER, width: 140, height: 24, labels: false, summary: false })}</td></tr>
    <tr><td>fleet B</td><td>${svg({ data: RASTER.slice(0, 2), width: 140, height: 16, labels: false, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Service events</div><div class="value">25</div>
    ${svg({ data: RASTER, width: 200, height: 56, title: "Service events" })}</div>`;
  const tab = `<div class="tab"><span>sync</span> ${svg({ data: RASTER.slice(0, 3), width: 56, height: 16, labels: false, summary: false })}</div>`;
  const variants = [
    svg({ data: RASTER, width: 220, height: 56, title: "default (labeled)" }),
    svg({ data: RASTER, emphasis: "api", width: 220, height: 56, title: "emphasis" }),
    svg({ data: RASTER, labels: false, width: 160, height: 40, title: "no labels" }),
    svg({
      data: [{ label: "requests", events: Array.from({ length: 200 }, (_, i) => i * 0.3) }],
      overflow: "bin",
      width: 200,
      height: 20,
      title: "aliasing lane, binned",
    }),
    svg({ data: [{ label: "boot", events: [0] }], width: 100, height: 16, title: "single event" }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: RASTER, width: 160, height: 40, summary: false })}</span>`,
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

test("event-raster — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "event-raster-gallery");
});

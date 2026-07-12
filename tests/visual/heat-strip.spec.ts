import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HeatStrip } from "../../dist/charts/heat-strip/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(HeatStrip as never, props));

const LOAD = Array.from({ length: 30 }, (_, i) => Math.round(Math.sin(i / 4) * 40 + 50));
const D = [0, 100] as const;

function gallery(): string {
  const sentence = `Load over the day ${svg({ data: LOAD, domain: D, width: 80, height: 10, title: "Load" })} peaks mid-shift.`;

  // table cell — the hero context (per-tenant load, shared domain)
  const cell = `<table><tbody>
    <tr><td>tenant-a</td><td>${svg({ data: LOAD, domain: D, summary: false })}</td></tr>
    <tr><td>tenant-b</td><td>${svg({ data: LOAD.map((v) => Math.round(v * 0.4)), domain: D, summary: false })}</td></tr>
    <tr><td>tenant-c</td><td>${svg({ data: LOAD.map((v, i) => (i % 7 === 0 ? null : Math.round(v * 0.8))), domain: D, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">CPU pressure (30 min)</div>
    <div class="value">peaks 90</div>
    ${svg({ data: LOAD, domain: D, width: 150, height: 12, title: "CPU pressure" })}
  </div>`;

  const tab = `<div class="tab"><span>Load</span> ${svg({ data: LOAD.slice(0, 15), domain: D, width: 44, height: 8, summary: false })}</div>`;

  const variants = [
    svg({ data: LOAD, domain: D, title: "square" }),
    svg({ data: LOAD, domain: D, shape: "round", title: "round" }),
    svg({ data: LOAD, domain: D, shape: "dot", title: "dot" }),
    svg({ data: LOAD, domain: D, steps: 3, title: "3 steps" }),
    svg({ data: [50, 51, 50, 52, 51], domain: [0, 500], title: "low variance" }),
    svg({ data: [3, null, 8, null, 5], title: "null slots" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: LOAD.slice(0, 15), domain: D, summary: false })}</span>`,
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

test("heat-strip — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "heat-strip-gallery");
});

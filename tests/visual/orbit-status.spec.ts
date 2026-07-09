import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OrbitStatus } from "../../dist/charts/orbit-status/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(OrbitStatus as never, props));

const D = { latencyDomain: [0, 500], rateDomain: [0, 20] };

function gallery(): string {
  const sentence = `Payments is ${svg({ latency: 240, rate: 12, ...D, size: 20, summary: false })} healthy.`;

  const cell = `<table><tbody>
    <tr><td>auth</td><td>${svg({ latency: 90, rate: 18, ...D, size: 18, summary: false })}</td></tr>
    <tr><td>payments</td><td>${svg({ latency: 240, rate: 12, ...D, size: 18, summary: false })}</td></tr>
    <tr><td>search</td><td>${svg({ latency: 350, rate: 5, ...D, alert: 300, size: 18, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Payments API</div>
    <div class="value">${svg({ latency: 240, rate: 12, ...D, label: "latency", size: 44, summary: false })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ latency: 240, rate: 12, ...D, size: 18, summary: false })} <span>Deps</span></div>`;

  const variants = [
    svg({ latency: 240, rate: 12, ...D, title: "healthy", size: 44 }),
    svg({ latency: 350, rate: 5, ...D, alert: 300, title: "alerting", size: 44 }),
    svg({ latency: 100, rate: 0, ...D, title: "idle", size: 44 }),
    svg({ latency: NaN, rate: 5, title: "unknown", size: 44 }),
  ]
    .map((s) => `<div>${s}</div>`)
    .join("");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ latency: 240, rate: 12, ...D, size: 28, summary: false })}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 22px; }
    table { border-collapse: collapse; } td { padding: 6px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variants { display: flex; gap: 28px; flex-wrap: wrap; align-items: center; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; display: inline-flex; align-items: center; gap: 6px; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants" class="variants">${variants}</section>
  <section id="presets">${presets}</section>`;
}

test("orbit-status — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "orbit-status-gallery");
});

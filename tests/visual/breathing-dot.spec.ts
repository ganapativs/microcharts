import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BreathingDot } from "../../dist/charts/breathing-dot/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(BreathingDot as never, props));

function gallery(): string {
  const sentence = `The cluster is ${svg({ value: 0.42, size: 18, summary: false })} loaded.`;

  const cell = `<table><tbody>
    <tr><td>web-1</td><td>${svg({ value: 0.2, size: 16, summary: false })}</td></tr>
    <tr><td>web-2</td><td>${svg({ value: 0.65, size: 16, summary: false })}</td></tr>
    <tr><td>db-1</td><td>${svg({ value: 0.92, size: 16, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Load</div>
    <div class="value">${svg({ value: 0.42, label: "value", size: 28, summary: false })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ value: 0.65, size: 16, summary: false })} <span>Load</span></div>`;

  const variants = [
    svg({ value: 0.2, title: "calm", size: 28 }),
    svg({ value: 0.65, title: "elevated", size: 28 }),
    svg({ value: 0.92, title: "strained", size: 28 }),
    svg({ value: null, title: "unknown", size: 28 }),
  ]
    .map((s) => `<div>${s}</div>`)
    .join("");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ value: 0.65, size: 24, summary: false })}</span>`,
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

test("breathing-dot — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "breathing-dot-gallery");
});

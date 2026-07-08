import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProgressRing } from "../../dist/charts/progress-ring/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(ProgressRing as never, props));

function gallery(): string {
  const sentence = `The sync is ${svg({ value: 0.68, size: 16, summary: false })} nearly done.`;
  const cell = `<table><tbody>
    <tr><td>tenant-a</td><td>${svg({ value: 0.92, summary: false })}</td></tr>
    <tr><td>tenant-b</td><td>${svg({ value: 0.44, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Backup</div><div class="value">68%</div>
    ${svg({ value: 0.68, size: 48, label: "percent", title: "Backup" })}</div>`;
  const tab = `<div class="tab"><span>Sync</span> ${svg({ value: 0.68, size: 14, summary: false })}</div>`;
  const variants = [
    svg({ value: 0.25, title: "25" }),
    svg({ value: 0.68, title: "68" }),
    svg({ value: 1, title: "full" }),
    svg({ value: 0.68, sweep: true, title: "sweep (countdown)" }),
    svg({ value: 0.68, weight: 6, title: "weight" }),
    svg({ value: 0.68, size: 40, label: "percent", title: "labeled" }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ value: 0.68, summary: false })}</span>`,
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

test("progress-ring — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "progress-ring-gallery");
});

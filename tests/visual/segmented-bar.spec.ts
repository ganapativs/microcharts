import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SegmentedBar } from "../../dist/charts/segmented-bar/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(SegmentedBar as never, props));

const MIX = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 90 },
  { label: "Edge", value: 30 },
  { label: "Arc", value: 12 },
  { label: "Brave", value: 8 },
];

function gallery(): string {
  const sentence = `Traffic mix ${svg({ data: MIX, width: 60, height: 8, summary: false })} still leans Chrome.`;
  const cell = `<table><tbody>
    <tr><td>Web</td><td>${svg({ data: MIX, summary: false })}</td></tr>
    <tr><td>Mobile</td><td>${svg({ data: MIX.slice(1), summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Browser share</div><div class="value">62% Chrome</div>
    ${svg({ data: MIX, width: 150, height: 14, label: "percent", title: "Browser share" })}</div>`;
  const tab = `<div class="tab"><span>Mix</span> ${svg({ data: MIX.slice(0, 3), width: 40, height: 8, summary: false })}</div>`;
  const variants = [
    svg({ data: MIX, title: "rollup" }),
    svg({ data: MIX, order: "desc", title: "ranked" }),
    svg({ data: MIX.slice(0, 3), width: 120, height: 12, label: "percent", title: "percents" }),
    svg({ data: MIX, maxSegments: 3, title: "maxSegments 3" }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: MIX.slice(0, 4), summary: false })}</span>`,
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

test("segmented-bar — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "segmented-bar-gallery");
});

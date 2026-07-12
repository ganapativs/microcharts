import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StackedArea } from "../../dist/charts/stacked-area/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(StackedArea as never, props));

const MIX = [
  { label: "Mobile", values: [30, 34, 36, 40, 44, 47, 52, 56, 58, 60, 63, 66] },
  { label: "Web", values: [50, 48, 47, 45, 42, 41, 38, 36, 35, 33, 32, 30] },
  { label: "API", values: [20, 18, 17, 15, 14, 12, 10, 8, 7, 7, 5, 4] },
];

function gallery(): string {
  const sentence = `Mobile keeps taking share ${svg({ data: MIX, width: 80, summary: false })} of total traffic.`;
  const cell = `<table><tbody>
    <tr><td>Traffic</td><td>${svg({ data: MIX, summary: false })}</td></tr>
    <tr><td>Revenue</td><td>${svg({ data: [...MIX].reverse(), summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Traffic mix</div><div class="value">66% mobile</div>
    ${svg({ data: MIX, width: 150, height: 26, title: "Traffic mix" })}</div>`;
  const tab = `<div class="tab"><span>Mix</span> ${svg({ data: MIX, width: 44, height: 10, summary: false })}</div>`;
  const variants = [
    svg({ data: MIX, width: 90, title: "stacked" }),
    svg({ data: MIX, width: 90, variant: "ridge", title: "ridge" }),
    svg({ data: MIX, width: 90, curve: "smooth", title: "smooth" }),
    svg({ data: MIX.slice(0, 2), width: 90, title: "two series" }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: MIX, width: 80, summary: false })}</span>`,
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

test("stacked-area — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "stacked-area-gallery");
});

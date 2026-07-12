import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BubbleRow } from "../../dist/charts/bubble-row/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(BubbleRow as never, props));
const REGIONS = [
  { label: "EMEA", value: 1240 },
  { label: "AMER", value: 890 },
  { label: "APAC", value: 560 },
  { label: "LATAM", value: 210 },
];

function gallery(): string {
  const sentence = `By region: ${svg({ data: REGIONS, title: "Market size", height: 30 })}.`;

  const cell = `<table><tbody>
    <tr><td>Q1</td><td>${svg({ data: REGIONS, label: "none", summary: false, height: 22 })}</td></tr>
    <tr><td>Q2</td><td>${svg({ data: REGIONS.map((d) => ({ ...d, value: d.value * 0.8 })), label: "none", summary: false, height: 22 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Segments</div>
    <div class="value">${svg({ data: REGIONS, summary: false, height: 40 })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ data: REGIONS.slice(0, 3), label: "none", summary: false, height: 20 })} <span>Size</span></div>`;

  const variants = [
    svg({ data: REGIONS, title: "values" }),
    svg({ data: REGIONS, align: "baseline", title: "baseline" }),
    svg({ data: REGIONS, label: "both", title: "both" }),
    svg({
      data: [
        { label: "A", value: 100 },
        { label: "B", value: 0 },
        { label: "C", value: 40 },
      ],
      title: "with zero",
    }),
  ]
    .map((s) => `<div>${s}</div>`)
    .join("");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: REGIONS, label: "none", summary: false, height: 26 })}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 22px; }
    table { border-collapse: collapse; } td { padding: 6px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variants { display: flex; gap: 28px; flex-wrap: wrap; align-items: flex-end; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; display: inline-flex; align-items: center; gap: 6px; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants" class="variants">${variants}</section>
  <section id="presets">${presets}</section>`;
}

test("bubble-row — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "bubble-row-gallery");
});

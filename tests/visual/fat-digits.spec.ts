import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FatDigits } from "../../dist/charts/fat-digits/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(FatDigits as never, props));
const D: [number, number] = [0, 2100];

function gallery(): string {
  const sentence = `Revenue reached ${svg({ value: 1204, domain: D, title: "Revenue", fontSize: 15 })} this quarter.`;

  const column = [1204, 318, 76, 942, 2100, 55]
    .map(
      (v) =>
        `<tr><td style="text-align:right">${svg({ value: v, domain: D, summary: false, fontSize: 15 })}</td></tr>`,
    )
    .join("");
  const cell = `<table><tbody>${column}</tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Peak load</div>
    <div class="value">${svg({ value: 2100, domain: D, summary: false, fontSize: 26 })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ value: 42, domain: D, summary: false, fontSize: 14 })} <span>Errors</span></div>`;

  const variants = [
    svg({ value: 76, domain: D, title: "tier 1" }),
    svg({ value: 800, domain: D, title: "tier 3" }),
    svg({ value: 2100, domain: D, title: "tier 5" }),
    svg({ value: 1902, encode: "digit", title: "digit mode" }),
    svg({ value: 1204, domain: D, tiers: 3, title: "3 tiers" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ value: 1204, domain: D, summary: false, fontSize: 16 })}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 20px; }
    table { border-collapse: collapse; } td { padding: 2px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; } .card .value { font-size: 22px; font-weight: 600; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variants { display: flex; gap: 18px; flex-wrap: wrap; align-items: center; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants" class="variants">${variants}</section>
  <section id="presets">${presets}</section>`;
}

test("fat-digits — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "fat-digits-gallery");
});

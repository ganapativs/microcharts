import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TallyMarks } from "../../dist/charts/tally-marks/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(TallyMarks as never, props));

function gallery(): string {
  const sentence = `We have gathered ${svg({ value: 23, title: "Signatures", height: 18 })} signatures so far.`;

  const cell = `<table><tbody>
    <tr><td>bugs filed</td><td>${svg({ value: 7, summary: false, height: 16 })}</td></tr>
    <tr><td>reviews</td><td>${svg({ value: 12, summary: false, height: 16 })}</td></tr>
    <tr><td>deploys</td><td>${svg({ value: 30, max: 25, summary: false, height: 16 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Events this hour</div>
    <div class="value">${svg({ value: 18, summary: false, height: 26 })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ value: 4, summary: false, height: 16 })} <span>Flags</span></div>`;

  const variants = [
    svg({ value: 23, title: "ruled" }),
    svg({ value: 17, pen: "drawn", title: "drawn" }),
    svg({ value: 30, max: 25, title: "numeral overflow" }),
    svg({ value: 38, max: 20, overflow: "clamp", title: "clamp" }),
    svg({ value: 0, title: "zero" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ value: 13, summary: false, height: 18 })}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 20px; }
    table { border-collapse: collapse; } td { padding: 4px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; } .card .value { font-size: 22px; font-weight: 600; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variants { display: flex; gap: 20px; flex-wrap: wrap; align-items: center; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants" class="variants">${variants}</section>
  <section id="presets">${presets}</section>`;
}

test("tally-marks — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "tally-marks-gallery");
});

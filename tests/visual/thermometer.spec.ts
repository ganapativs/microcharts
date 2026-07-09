import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Thermometer } from "../../dist/charts/thermometer/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(Thermometer as never, props));

function gallery(): string {
  const sentence = `The drive is ${svg({ value: 72, target: 80, title: "Fundraiser", height: 40 })} of the way there.`;

  const cell = `<table><tbody>
    <tr><td>west</td><td>${svg({ value: 40, orientation: "horizontal", bulb: false, width: 90, summary: false })}</td></tr>
    <tr><td>east</td><td>${svg({ value: 72, orientation: "horizontal", bulb: false, width: 90, summary: false })}</td></tr>
    <tr><td>south</td><td>${svg({ value: 95, orientation: "horizontal", bulb: false, width: 90, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Goal</div>
    <div class="value" style="display:flex;align-items:flex-end;gap:8px">${svg({ value: 72, target: 80, summary: false, height: 56 })}<span>72%</span></div>
  </div>`;

  const tab = `<div class="tab">${svg({ value: 55, summary: false, height: 24 })} <span>Capacity</span></div>`;

  const variants = [
    svg({ value: 20, title: "20" }),
    svg({ value: 55, target: 80, title: "55 target 80" }),
    svg({ value: 95, title: "95" }),
    svg({ value: 140, target: 90, title: "over-cap" }),
    svg({ value: 72, label: "value", title: "labelled" }),
    svg({ value: 72, bulb: false, title: "no bulb" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ value: 72, target: 80, summary: false, height: 44 })}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 22px; }
    table { border-collapse: collapse; } td { padding: 6px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; } .card .value { font-size: 20px; font-weight: 600; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variants { display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-end; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; display: inline-flex; align-items: flex-end; gap: 6px; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants" class="variants">${variants}</section>
  <section id="presets">${presets}</section>`;
}

test("thermometer — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "thermometer-gallery");
});

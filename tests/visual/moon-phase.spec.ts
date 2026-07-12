import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MoonPhase } from "../../dist/charts/moon-phase/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(MoonPhase as never, props));

function gallery(): string {
  const sentence = `The sprint is ${svg({ value: 0.68, title: "Sprint", size: 18 })} of the way through.`;

  const cell = `<table><tbody>
    <tr><td>auth</td><td>${svg({ value: 0.9, summary: false, size: 16 })}</td></tr>
    <tr><td>billing</td><td>${svg({ value: 0.45, summary: false, size: 16 })}</td></tr>
    <tr><td>search</td><td>${svg({ value: 0.15, summary: false, size: 16 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Quota</div>
    <div class="value" style="display:flex;align-items:center;gap:8px">${svg({ value: 0.68, summary: false, size: 28 })}<span>68%</span></div>
  </div>`;

  const tab = `<div class="tab">${svg({ value: 0.5, summary: false, size: 16 })} <span>Cycle</span></div>`;

  const progress = [0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]
    .map((v) => svg({ value: v, title: `${Math.round(v * 100)}%`, size: 24 }))
    .join(" ");

  const cycle = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875]
    .map((v) => svg({ value: v, mode: "cycle", title: `cycle ${Math.round(v * 100)}%`, size: 24 }))
    .join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ value: 0.65, summary: false, size: 22 })}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 20px; }
    table { border-collapse: collapse; } td { padding: 4px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; } .card .value { font-size: 20px; font-weight: 600; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .row-marks { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; display: inline-flex; align-items: center; gap: 6px; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="progress" class="row-marks">${progress}</section>
  <section id="cycle" class="row-marks">${cycle}</section>
  <section id="presets">${presets}</section>`;
}

test("moon-phase — four contexts + phase sweeps", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "moon-phase-gallery");
});

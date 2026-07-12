import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GradedBand } from "../../dist/charts/graded-band/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(GradedBand as never, props));

const DRAWS = Array.from(
  { length: 160 },
  (_, i) => 21 + Math.round(9 * Math.sin(i) + 6 * Math.sin(i * 2.3)),
);

function gallery(): string {
  const sentence = `Forecast ${svg({ data: DRAWS, width: 90, height: 12, title: "Forecast" })} carries real spread.`;

  const cell = `<table><tbody>
    <tr><td>Q3</td><td>${svg({ data: DRAWS, label: "median", summary: false })}</td></tr>
    <tr><td>Q4</td><td>${svg({ data: DRAWS.map((v) => v + 6), label: "median", summary: false })}</td></tr>
    <tr><td>Q1</td><td>${svg({ data: DRAWS.map((v) => v - 4), label: "median", summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Forecast estimate</div>
    <div class="value">≈ 21</div>
    ${svg({ data: DRAWS, width: 150, height: 14, label: "median", title: "Forecast estimate" })}
  </div>`;

  const tab = `<div class="tab"><span>Est.</span> ${svg({ data: DRAWS, width: 48, height: 10, summary: false })}</div>`;

  const variants = [
    svg({ data: DRAWS, title: "50/80/95" }),
    svg({ data: DRAWS, levels: [50, 90], title: "50/90" }),
    svg({ data: DRAWS, value: 28, title: "value" }),
    svg({ data: DRAWS, softEdge: true, title: "soft edge" }),
    svg({ data: [5, 5, 5, 5], title: "point only" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: DRAWS, summary: false })}</span>`,
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

test("graded-band — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "graded-band-gallery");
});

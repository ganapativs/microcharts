import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentileTrace } from "../../dist/charts/percentile-trace/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(PercentileTrace as never, props));

// a standing that drifts up from the middle half into the top band
const DATA = [40, 46, 52, 58, 63, 68, 72, 76, 79, 81];
// a standing that slides the other way
const FALL = [78, 72, 64, 55, 47, 40, 34, 29, 26, 24];

function gallery(): string {
  const sentence = `Ranked ${svg({ data: DATA, width: 90, height: 20, title: "Percentile" })} by week 10.`;

  const cell = `<table><tbody>
    <tr><td>Ana</td><td>${svg({ data: DATA, label: "last", summary: false })}</td></tr>
    <tr><td>Ben</td><td>${svg({ data: FALL, label: "last", summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Standing</div>
    <div class="value">p81</div>
    ${svg({ data: DATA, width: 150, height: 28, unit: "week", label: "last", title: "Standing" })}
  </div>`;

  const tab = `<div class="tab"><span>Rank ⌐</span> ${svg({ data: DATA, width: 56, height: 16, label: "none", summary: false })}</div>`;

  const variants = [
    svg({ data: DATA, title: "rising" }),
    svg({ data: FALL, title: "falling" }),
    svg({ data: FALL, positive: "down", title: "falling is good" }),
    svg({ data: DATA, bands: false, title: "no bands" }),
    svg({ data: DATA, label: "none", title: "no label" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: DATA, summary: false })}</span>`,
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

test("percentile-trace — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "percentile-trace-gallery");
});

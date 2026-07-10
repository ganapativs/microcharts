import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConfusionGrid } from "../../dist/charts/confusion-grid/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(ConfusionGrid as never, props));

// The docs registry datasets (apps/docs/src/lib/charts/confusion-grid.tsx CATDOG/THREE).
const CATDOG = {
  labels: ["cat", "dog"],
  counts: [
    [88, 12],
    [10, 59],
  ],
};
const THREE = {
  labels: ["A", "B", "C"],
  counts: [
    [70, 8, 2],
    [6, 62, 12],
    [3, 9, 58],
  ],
};

function gallery(): string {
  const sentence = `The classifier reads ${svg({ data: CATDOG, size: 44, summary: false })} on holdout data.`;
  const cell = `<table><tbody>
    <tr><td>fold 1</td><td>${svg({ data: CATDOG, size: 40, summary: false })}</td></tr>
    <tr><td>fold 2</td><td>${svg({ data: THREE, size: 40, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Accuracy</div><div class="value">87%</div>
    ${svg({ data: CATDOG, size: 72, title: "Classifier" })}</div>`;
  const tab = `<div class="tab"><span>Model</span> ${svg({ data: CATDOG, size: 24, summary: false })}</div>`;
  const variants = [
    svg({ data: THREE, size: 90, title: "3×3 (default)" }),
    svg({ data: THREE, size: 90, accent: "errors", title: "worst-confusion accent" }),
    svg({ data: THREE, size: 90, label: "accuracy", title: "accuracy in the gutter" }),
    svg({ data: CATDOG, size: 70, shape: "round", title: "round cells" }),
    svg({
      data: {
        labels: ["cat", "dog"],
        counts: [
          [40, 10],
          [0, 0],
        ],
      },
      size: 70,
      title: "empty row",
    }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: THREE, size: 60, summary: false })}</span>`,
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

test("confusion-grid — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "confusion-grid-gallery");
});

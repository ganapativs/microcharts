import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CohortTriangle } from "../../dist/charts/cohort-triangle/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(CohortTriangle as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/cohort-triangle.tsx COHORTS).
const COHORTS = [
  { label: "Jan", values: [1, 0.62, 0.48, 0.41, 0.38, 0.37] },
  { label: "Feb", values: [1, 0.58, 0.44, 0.38, 0.35] },
  { label: "Mar", values: [1, 0.47, 0.36, 0.31] },
  { label: "Apr", values: [1, 0.55, 0.42] },
  { label: "May", values: [1, 0.52] },
];

function gallery(): string {
  const sentence = `New vintages leak faster — ${svg({ data: COHORTS, cell: 8, labels: false, summary: false })} — March retains worst at equal maturity.`;
  const cell = `<table><tbody>
    <tr><td>NA</td><td>${svg({ data: COHORTS, cell: 8, labels: false, summary: false })}</td></tr>
    <tr><td>EU</td><td>${svg({ data: COHORTS.slice(0, 3), cell: 8, labels: false, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Cohort retention</div><div class="value">37%</div>
    ${svg({ data: COHORTS, cell: 12, unit: "month", title: "Cohort retention" })}</div>`;
  const tab = `<div class="tab"><span>cohorts</span> ${svg({ data: COHORTS, cell: 6, labels: false, summary: false })}</div>`;
  const variants = [
    svg({ data: COHORTS, cell: 12, title: "default (row labels)" }),
    svg({ data: COHORTS, cell: 12, labels: false, title: "no labels" }),
    svg({ data: COHORTS, cell: 12, highlight: "Mar", title: "highlighted vintage" }),
    svg({
      data: [{ label: "Jan", values: [1, 0.6, 0.45, 0.4] }],
      cell: 12,
      title: "single cohort",
    }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: COHORTS, cell: 10, labels: false, summary: false })}</span>`,
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

test("cohort-triangle — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "cohort-triangle-gallery");
});

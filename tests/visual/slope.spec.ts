import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Slope } from "../../dist/charts/slope/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(Slope as never, props));

const RANKS = [
  { label: "East", from: 40, to: 47 },
  { label: "West", from: 55, to: 41 },
  { label: "South", from: 30, to: 33 },
  { label: "North", from: 50, to: 44 },
  { label: "Mid", from: 20, to: 35 },
];

function gallery(): string {
  const sentence = `The experiment ${svg({ data: RANKS.slice(0, 3), width: 36, height: 24, title: "Before vs after" })} reshuffled the order.`;

  const cell = `<table><tbody>
    <tr><td>Cohort A</td><td>${svg({ data: RANKS.slice(0, 4), summary: false })}</td></tr>
    <tr><td>Cohort B</td><td>${svg({ data: RANKS.slice(1, 5), summary: false })}</td></tr>
  </tbody></table>`;

  // KPI before/after — the hero context
  const kpi = `<div class="card">
    <div class="label">Before vs after</div>
    <div class="value">3 up · 2 down</div>
    ${svg({ data: RANKS, width: 120, height: 72, label: "both", title: "Experiment" })}
  </div>`;

  const tab = `<div class="tab"><span>Shift</span> ${svg({ data: RANKS.slice(0, 3), width: 26, height: 18, summary: false })}</div>`;

  const variants = [
    svg({ data: RANKS, title: "neutral" }),
    svg({ data: RANKS, positive: "up", title: "valence" }),
    svg({ data: RANKS, highlight: "West", title: "highlight" }),
    svg({ data: RANKS.slice(0, 3), width: 90, height: 44, label: "value", title: "values" }),
    svg({
      data: [
        { label: "a", from: Number.NaN, to: 5 },
        { label: "b", from: 3, to: 4 },
      ],
      title: "incomplete",
    }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: RANKS.slice(0, 3), positive: "up", summary: false })}</span>`,
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

test("slope — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "slope-gallery");
});

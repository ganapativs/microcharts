import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RubricStrip } from "../../dist/charts/rubric-strip/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(RubricStrip as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/rubric-strip.tsx RUBRIC).
const RUBRIC = [
  { label: "Correctness", score: 0.92, weight: 3 },
  { label: "Coverage", score: 0.78, weight: 2 },
  { label: "Clarity", score: 0.65, weight: 1 },
  { label: "Style", score: 0.41, weight: 1 },
];

function gallery(): string {
  const sentence = `The eval scored ${svg({ data: RUBRIC, labels: false, width: 90, height: 20, summary: false })} against the rubric.`;

  const cell = `<table><tbody>
    <tr><td>gpt-x</td><td>${svg({ data: RUBRIC, labels: false, width: 100, height: 24, summary: false })}</td></tr>
    <tr><td>gpt-y</td><td>${svg({ data: RUBRIC.map((d) => ({ ...d, score: 1 - d.score })), labels: false, width: 100, height: 24, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card"><div class="label">Model eval</div><div class="value">4 criteria</div>
    ${svg({ data: RUBRIC, target: 0.7, width: 220, height: 44, title: "Model eval" })}</div>`;

  const tab = `<div class="tab"><span>eval</span> ${svg({ data: RUBRIC, labels: false, width: 56, height: 14, summary: false })}</div>`;

  const variants = [
    svg({ data: RUBRIC, target: 0.7, width: 200, height: 44, title: "with target" }),
    svg({
      data: [
        { label: "Lint", score: 1 },
        { label: "Types", score: 1 },
        { label: "Tests", score: 0.8 },
        { label: "Docs", score: 0.5 },
      ],
      width: 200,
      height: 44,
      title: "unweighted",
    }),
    svg({ data: RUBRIC, labels: false, width: 120, height: 28, title: "no labels" }),
    svg({
      data: [{ label: "Bonus", score: 2, weight: 1 }],
      width: 160,
      height: 16,
      title: "clamped",
    }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: RUBRIC, width: 140, height: 36, summary: false })}</span>`,
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

test("rubric-strip — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "rubric-strip-gallery");
});

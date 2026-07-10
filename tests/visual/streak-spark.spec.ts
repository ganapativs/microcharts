import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StreakSpark } from "../../dist/charts/streak-spark/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(StreakSpark as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/streak-spark.tsx STREAK):
// runs 9 passing, 1 fail, 4 passing, 2 fail, 3 passing.
const STREAK = [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1];

function gallery(): string {
  const sentence = `The pipeline is on a ${svg({ data: STREAK, width: 120, height: 20, summary: false })} run — 3 green, short of the record 9.`;
  const cell = `<table><tbody>
    <tr><td>web</td><td>${svg({ data: STREAK, width: 150, height: 22, summary: false })}</td></tr>
    <tr><td>api</td><td>${svg({ data: [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1], width: 150, height: 22, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">deploy streak</div><div class="value">3 green</div>
    ${svg({ data: STREAK, width: 200, height: 48, label: "both", title: "Deploy streak" })}</div>`;
  const tab = `<div class="tab"><span>CI</span> ${svg({ data: STREAK, width: 60, height: 12, label: "none", summary: false })}</div>`;
  const variants = [
    svg({ data: STREAK, width: 220, height: 48, label: "both", title: "current + record" }),
    svg({ data: STREAK, width: 220, height: 48, label: "none", title: "no labels" }),
    svg({
      data: [0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0],
      positive: "down",
      width: 220,
      height: 48,
      title: "positive down (incident-free)",
    }),
    svg({ data: [1, 1, 1, 1, 1, 1], width: 120, height: 24, title: "all passing" }),
    svg({ data: [1], width: 120, height: 24, title: "single" }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: STREAK, width: 160, height: 40, summary: false })}</span>`,
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

test("streak-spark — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "streak-spark-gallery");
});

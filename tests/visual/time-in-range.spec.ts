import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TimeInRange } from "../../dist/charts/time-in-range/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(TimeInRange as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/time-in-range.tsx GLUCOSE + the
// example's simple three-zone shape).
const GLUCOSE = { severeBelow: 2, below: 7, in: 72, above: 15, severeAbove: 4 };
const SIMPLE = { below: 9, in: 72, above: 19 };

function gallery(): string {
  const sentence = `Time in range ${svg({ data: SIMPLE, width: 90, height: 14, summary: false })} stayed steady overnight.`;

  const cell = `<table><tbody>
    <tr><td>Patient A</td><td>${svg({ data: GLUCOSE, width: 60, height: 10, summary: false })}</td></tr>
    <tr><td>Patient B</td><td>${svg({ data: SIMPLE, width: 60, height: 10, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card"><div class="label">Time in range</div><div class="value">72%</div>
    ${svg({ data: GLUCOSE, width: 200, height: 22, title: "Time in range" })}</div>`;

  const tab = `<div class="tab"><span>TIR</span> ${svg({ data: SIMPLE, width: 48, height: 10, label: "none", summary: false })}</div>`;

  const variants = [
    svg({ data: SIMPLE, width: 200, height: 22, title: "in only" }),
    svg({ data: GLUCOSE, label: "all", width: 240, height: 24, title: "full audit" }),
    svg({
      data: GLUCOSE,
      orientation: "vertical",
      label: "all",
      width: 26,
      height: 110,
      title: "vertical",
    }),
    svg({ data: SIMPLE, label: "none", width: 120, height: 12, title: "no labels" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: GLUCOSE, width: 160, height: 18, summary: false })}</span>`,
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

test("time-in-range — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "time-in-range-gallery");
});

import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TapeGauge } from "../../dist/charts/tape-gauge/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(TapeGauge as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/tape-gauge.tsx ZONES).
const ZONES = [
  { from: 100, to: 130, tone: "pos" },
  { from: 130, to: 150, tone: "warn" },
  { from: 150, to: 200, tone: "neg" },
];

function gallery(): string {
  const sentence = `Airspeed ${svg({ value: 142, rate: 1, zones: ZONES, span: 60, width: 30, height: 44, summary: false })} is climbing into caution.`;

  const cell = `<table><tbody>
    <tr><td>Airspeed</td><td>${svg({ value: 142, rate: -1, zones: ZONES, span: 60, orientation: "horizontal", width: 140, height: 28, summary: false })}</td></tr>
    <tr><td>Altitude</td><td>${svg({ value: 118, rate: 2, zones: ZONES, span: 60, orientation: "horizontal", width: 140, height: 28, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card"><div class="label">Airspeed</div><div class="value">142</div>
    ${svg({ value: 142, rate: 1, zones: ZONES, span: 60, width: 46, height: 68, title: "Airspeed" })}</div>`;

  const tab = `<div class="tab"><span>Speed</span> ${svg({ value: 142, rate: 1, zones: ZONES, span: 60, label: "none", width: 20, height: 32, summary: false })}</div>`;

  const variants = [
    svg({ value: 142, rate: 1, zones: ZONES, span: 60, width: 46, height: 68, title: "vertical" }),
    svg({
      value: 142,
      rate: -2,
      zones: ZONES,
      span: 60,
      orientation: "horizontal",
      width: 160,
      height: 32,
      title: "horizontal",
    }),
    svg({ value: 142, zones: ZONES, span: 60, width: 46, height: 68, title: "no rate" }),
    svg({
      value: 142,
      rate: 1,
      zones: ZONES,
      span: 60,
      label: "none",
      width: 30,
      height: 44,
      title: "pointer-only",
    }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ value: 142, rate: 1, zones: ZONES, span: 60, width: 46, height: 68, summary: false })}</span>`,
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

test("tape-gauge — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "tape-gauge-gallery");
});

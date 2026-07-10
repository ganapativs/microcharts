import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CalibrationStrip } from "../../dist/charts/calibration-strip/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(CalibrationStrip as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/calibration-strip.tsx BINS).
const BINS = [
  { predicted: 0.05, observed: 0.05, count: 100 },
  { predicted: 0.15, observed: 0.16, count: 90 },
  { predicted: 0.25, observed: 0.24, count: 80 },
  { predicted: 0.35, observed: 0.36, count: 70 },
  { predicted: 0.45, observed: 0.44, count: 60 },
  { predicted: 0.55, observed: 0.56, count: 50 },
  { predicted: 0.65, observed: 0.63, count: 40 },
  { predicted: 0.7, observed: 0.52, count: 30 },
  { predicted: 0.85, observed: 0.83, count: 8 },
  { predicted: 0.95, observed: 0.9, count: 5 },
];

function gallery(): string {
  const sentence = `Model calibration ${svg({ data: BINS, width: 100, height: 24, summary: false })} tracks the diagonal.`;

  const cell = `<table><tbody>
    <tr><td>v1</td><td>${svg({ data: BINS, summary: false })}</td></tr>
    <tr><td>v2</td><td>${svg({ data: BINS.map((b) => ({ ...b, observed: b.predicted * 0.85 })), summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Reliability</div>
    <div class="value">10 bins</div>
    ${svg({ data: BINS, width: 200, height: 44, title: "Model calibration" })}
  </div>`;

  const tab = `<div class="tab"><span>Calib</span> ${svg({ data: BINS, width: 56, height: 14, summary: false })}</div>`;

  const variants = [
    svg({ data: BINS, title: "dots (default)" }),
    svg({ data: BINS, variant: "bars", title: "bars" }),
    svg({
      data: Array.from({ length: 800 }, (_, i) => ({
        p: ((i * 7) % 100) / 100,
        outcome: i % 3 === 0 ? 1 : 0,
      })),
      title: "raw pairs, binned",
    }),
    svg({ data: [{ predicted: 0.5, observed: 0.5, count: 4 }], title: "single low-support bin" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: BINS, width: 160, height: 36, summary: false })}</span>`,
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

test("calibration-strip — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "calibration-strip-gallery");
});

import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DualWindowMeter } from "../../dist/charts/dual-window-meter/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(DualWindowMeter as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/dual-window-meter.tsx LOUDNESS).
const LOUDNESS = Array.from(
  { length: 60 },
  (_, i) => -22 + Math.sin(i / 3) * 4 + Math.sin(i / 11) * 2 - (i > 40 ? 2 : 0),
);
const FMT = { maximumFractionDigits: 1 };

function gallery(): string {
  const sentence = `Loudness ${svg({ data: LOUDNESS, target: -23, format: FMT, width: 100, height: 24, summary: false })} sits under target.`;

  const cell = `<table><tbody>
    <tr><td>stream-a</td><td>${svg({ data: LOUDNESS, target: -23, format: FMT, summary: false })}</td></tr>
    <tr><td>stream-b</td><td>${svg({ data: LOUDNESS.map((v) => v + 3), target: -23, format: FMT, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Loudness (LUFS)</div>
    <div class="value">-23 target</div>
    ${svg({ data: LOUDNESS, target: -23, format: FMT, width: 200, height: 28, title: "Loudness" })}
  </div>`;

  const tab = `<div class="tab"><span>LUFS</span> ${svg({ data: LOUDNESS, target: -23, format: FMT, width: 56, height: 16, label: "none", summary: false })}</div>`;

  const variants = [
    svg({ data: LOUDNESS, target: -23, format: FMT, title: "default" }),
    svg({ data: LOUDNESS, target: -23, band: [-25, -21], format: FMT, title: "corridor" }),
    svg({ data: LOUDNESS, target: -23, format: FMT, windows: [5, 20], title: "custom windows" }),
    svg({ data: LOUDNESS, target: -23, format: FMT, label: "none", title: "no labels" }),
    svg({ data: [1, 2, 3], target: 2, title: "short series" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: LOUDNESS, target: -23, format: FMT, width: 160, height: 26, summary: false })}</span>`,
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

test("dual-window-meter — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "dual-window-meter-gallery");
});

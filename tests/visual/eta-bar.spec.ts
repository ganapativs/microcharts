import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EtaBar } from "../../dist/charts/eta-bar/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(EtaBar as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/eta-bar.tsx).
const min = (t: number) => `${Math.round(t)} min`;

function gallery(): string {
  const sentence = `Export is ${svg({ progress: 0.64, elapsed: 3.6, rate: 0.18, etaFormat: min, width: 100, height: 12, summary: false })} away.`;
  const cell = `<table><tbody>
    <tr><td>export.zip</td><td>${svg({ progress: 0.64, elapsed: 128, rate: 0.5, width: 60, height: 8, summary: false })}</td></tr>
    <tr><td>backup.tar</td><td>${svg({ progress: 0.3, elapsed: 40, rate: 0, width: 60, height: 8, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Export progress</div><div class="value">64%</div>
    ${svg({ progress: 0.64, elapsed: 3.6, rate: 0.18, etaFormat: min, width: 200, height: 16, title: "Export progress" })}</div>`;
  const tab = `<div class="tab"><span>export</span> ${svg({ progress: 0.64, elapsed: 3.6, rate: 0.18, label: "none", width: 56, height: 10, summary: false })}</div>`;
  const variants = [
    svg({
      progress: 0.64,
      elapsed: 3.6,
      rate: 0.18,
      etaFormat: min,
      width: 160,
      height: 16,
      title: "default (eta label)",
    }),
    svg({
      progress: 0.64,
      elapsed: 3.6,
      rate: 0.18,
      label: "percent",
      width: 160,
      height: 16,
      title: "percent label",
    }),
    svg({
      progress: 0.3,
      elapsed: 40,
      rate: 0,
      width: 160,
      height: 16,
      title: "stalled",
    }),
    svg({
      progress: 0.08,
      elapsed: 30,
      rate: 0.001,
      etaFormat: min,
      width: 160,
      height: 16,
      title: "overflow (remainder ≫ elapsed)",
    }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ progress: 0.64, elapsed: 3.6, rate: 0.18, etaFormat: min, width: 140, height: 14, summary: false })}</span>`,
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

test("eta-bar — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "eta-bar-gallery");
});

import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FoldedDayBand } from "../../dist/charts/folded-day-band/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(FoldedDayBand as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/folded-day-band.tsx DATA/TODAY).
const curve = (h: number) => 40 + 42 * Math.max(0, 1 - Math.abs(h - 14) / 10);
const DATA = Array.from({ length: 14 }, (_d, d) =>
  Array.from({ length: 24 }, (_h, h) => ({
    t: d * 24 + h,
    value: Math.round(curve(h) + Math.sin(d + h) * 8),
  })),
).flat();
const TODAY = Array.from({ length: 24 }, (_h, h) => ({
  t: h,
  value: Math.round(curve(h) + 14),
}));

function gallery(): string {
  const sentence = `Today's load sits ${svg({ data: DATA, today: TODAY, width: 120, height: 32, summary: false })} inside the usual band.`;
  const cell = `<table><tbody>
    <tr><td>web-1</td><td>${svg({ data: DATA, today: TODAY, width: 140, height: 32, summary: false })}</td></tr>
    <tr><td>web-2</td><td>${svg({ data: DATA, width: 140, height: 32, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Typical day</div><div class="value">peak ≈ 82</div>
    ${svg({ data: DATA, today: TODAY, width: 200, height: 40, title: "Typical day" })}</div>`;
  const tab = `<div class="tab"><span>Load</span> ${svg({ data: DATA, width: 56, height: 14, summary: false })}</div>`;
  const variants = [
    svg({
      data: DATA,
      today: TODAY,
      width: 200,
      height: 40,
      title: "default (25–75, 5–95 + today)",
    }),
    svg({ data: DATA, bands: [[25, 75]], width: 200, height: 40, title: "one band" }),
    svg({ data: DATA, width: 200, height: 40, title: "no today overlay" }),
    svg({
      data: [{ t: 3, value: 10 }],
      width: 120,
      height: 32,
      title: "single point",
    }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: DATA, today: TODAY, width: 160, height: 36, summary: false })}</span>`,
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

test("folded-day-band — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "folded-day-band-gallery");
});

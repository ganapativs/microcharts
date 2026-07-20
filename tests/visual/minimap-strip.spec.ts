import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MinimapStrip } from "../../dist/charts/minimap-strip/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(MinimapStrip as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/minimap-strip.tsx CONTENT/DATA).
const CONTENT = Array.from(
  { length: 1200 },
  (_, i) => Math.abs(Math.sin(i / 40)) + Math.abs(Math.sin(i / 150)) * 0.6,
);
const DATA = {
  content: CONTENT,
  window: [520, 660] as [number, number],
  marks: [100, 600, 1100],
  known: [[0, 1104]] as [number, number][],
};

function gallery(): string {
  const sentence = `You're at ${svg({ data: DATA, width: 90, height: 12, summary: false })} in the doc.`;
  const cell = `<table><tbody>
    <tr><td>doc.md</td><td>${svg({ data: DATA, width: 140, height: 16, summary: false })}</td></tr>
    <tr><td>notes.md</td><td>${svg({ data: { ...DATA, window: [40, 200] as [number, number] }, width: 140, height: 16, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Document position</div><div class="value">12%</div>
    ${svg({ data: DATA, width: 220, height: 22, title: "Document position" })}</div>`;
  const tab = `<div class="tab"><span>doc</span> ${svg({ data: DATA, width: 56, height: 10, markLane: false, summary: false })}</div>`;
  const variants = [
    svg({ data: DATA, width: 200, height: 20, title: "bars (default)" }),
    svg({ data: DATA, mode: "heat", width: 200, height: 20, title: "heat" }),
    svg({ data: DATA, markLane: false, width: 200, height: 20, title: "overlaid ticks" }),
    svg({
      data: { content: CONTENT.slice(0, 200), window: [40, 90], known: [[0, 200]] },
      width: 160,
      height: 16,
      title: "fully known",
    }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: DATA, width: 160, height: 18, summary: false })}</span>`,
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

test("minimap-strip — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "minimap-strip-gallery");
});

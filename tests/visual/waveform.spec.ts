import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Waveform } from "../../dist/charts/waveform/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(Waveform as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/waveform.tsx WAVE).
const WAVE = Array.from(
  { length: 200 },
  (_, i) =>
    (i === 126 ? 0.82 : Math.sin(i / 3) * 0.15 + Math.sin(i / 11) * 0.35) *
    (1 - Math.abs(i - 100) / 260),
);

function gallery(): string {
  const sentence = `The voice memo ${svg({ data: WAVE, width: 100, height: 20, summary: false })} peaks near the middle.`;
  const cell = `<table><tbody>
    <tr><td>memo-1</td><td>${svg({ data: WAVE, width: 140, height: 20, summary: false })}</td></tr>
    <tr><td>memo-2</td><td>${svg({ data: WAVE.slice(0, 80), width: 140, height: 20, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Voice memo</div><div class="value">0:42</div>
    ${svg({ data: WAVE, width: 220, height: 40, title: "Voice memo" })}</div>`;
  const tab = `<div class="tab"><span>Memo</span> ${svg({ data: WAVE, width: 60, height: 14, summary: false })}</div>`;
  const variants = [
    svg({ data: WAVE, width: 220, height: 32, title: "bars (default)" }),
    svg({ data: WAVE, variant: "envelope", width: 220, height: 32, title: "envelope" }),
    svg({ data: WAVE, progress: 0.63, width: 220, height: 32, title: "progress 63%" }),
    svg({ data: WAVE, mirror: false, width: 220, height: 32, title: "no mirror" }),
    svg({ data: [0.4], width: 80, height: 24, title: "single sample" }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: WAVE, width: 160, height: 28, summary: false })}</span>`,
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

test("waveform — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "waveform-gallery");
});

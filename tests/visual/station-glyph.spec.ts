import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
// The BUILT artifact — visual baseline doubles as a dist smoke test (plan/09).
import { StationGlyph } from "../../dist/charts/station-glyph/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(StationGlyph as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/station-glyph.tsx OBS).
const OBS = {
  cloud: 0.75,
  wind: { direction: 225, magnitude: 15 },
  temp: 16,
  dewpoint: 9,
  pressure: 1013,
  station: "KSFO",
};

function gallery(): string {
  const sentence = `${OBS.station} reports ${svg({ ...OBS, size: 32, summary: false })} this hour.`;

  // station-list table — the hero context (plan/25 §20)
  const cell = `<table><tbody>
    <tr><td>KSFO</td><td>${svg({ ...OBS, size: 26, summary: false })}</td></tr>
    <tr><td>KJFK</td><td>${svg({ cloud: 1, wind: { direction: 300, magnitude: 45 }, temp: 4, dewpoint: 2, pressure: 988, station: "KJFK", size: 26, summary: false })}</td></tr>
    <tr><td>STN</td><td>${svg({ cloud: 0, wind: { direction: 0, magnitude: 0 }, temp: 22, dewpoint: 8, station: "STN", size: 26, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Station</div>
    <div class="value">${svg({ ...OBS, size: 48, title: "KSFO observation" })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ ...OBS, size: 20, summary: false })} <span>Weather</span></div>`;

  const variants = [
    svg({ ...OBS, title: "typical", size: 44 }),
    svg({
      cloud: 1,
      wind: { direction: 300, magnitude: 45 },
      temp: 4,
      dewpoint: 2,
      pressure: 988,
      station: "KJFK",
      title: "overcast + gale",
      size: 44,
    }),
    svg({
      cloud: 0,
      wind: { direction: 0, magnitude: 0 },
      temp: 22,
      dewpoint: 8,
      station: "STN",
      title: "clear + calm",
      size: 44,
    }),
    svg({ cloud: 0.4, station: "N/A", title: "sky only (no wind, no numerals)", size: 44 }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ ...OBS, size: 36, summary: false })}</span>`,
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

test("station-glyph — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "station-glyph-gallery");
});

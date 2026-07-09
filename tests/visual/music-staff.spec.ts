import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MusicStaff } from "../../dist/charts/music-staff/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(MusicStaff as never, props));
const MELODY = [3, 5, 4, 8, 6, 9, 7, 11];

function gallery(): string {
  const sentence = `The sprint went ${svg({ data: MELODY, title: "Sprint melody", width: 100, height: 22 })}.`;

  const cell = `<table><tbody>
    <tr><td>web</td><td>${svg({ data: MELODY, summary: false, width: 90, height: 20 })}</td></tr>
    <tr><td>api</td><td>${svg({ data: [7, 6, 8, 5, 9, 4, 6, 3], summary: false, width: 90, height: 20 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">How the sprint went</div>
    <div class="value">${svg({ data: MELODY, label: "last", summary: false, width: 130, height: 30 })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ data: MELODY.slice(0, 5), summary: false, width: 70, height: 18 })} <span>Rhythm</span></div>`;

  const variants = [
    svg({ data: MELODY, title: "ledger" }),
    svg({ data: MELODY, range: "staff", title: "staff range" }),
    svg({ data: MELODY, label: "last", title: "last value" }),
    svg({ data: [3, 5, null, 8, null, 6], title: "with rests" }),
  ]
    .map((s) => `<div>${s}</div>`)
    .join("");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: MELODY, summary: false, width: 90, height: 22 })}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 22px; }
    table { border-collapse: collapse; } td { padding: 6px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variants { display: flex; gap: 22px; flex-wrap: wrap; align-items: center; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; display: inline-flex; align-items: center; gap: 6px; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants" class="variants">${variants}</section>
  <section id="presets">${presets}</section>`;
}

test("music-staff — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "music-staff-gallery");
});

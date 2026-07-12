import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Seismogram } from "../../dist/charts/seismogram/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(Seismogram as never, props));

const BURSTS = Array.from({ length: 60 }, (_, i) =>
  i % 9 === 0 ? (i % 27 === 0 ? 8 : 3) : i % 13 === 0 ? 1 : 0,
);
const SIGNED = Array.from({ length: 40 }, (_, i) => (i % 7 === 0 ? 5 : i % 11 === 0 ? -4 : 0));

function gallery(): string {
  const sentence = `Deploy incidents ${svg({ data: BURSTS, width: 90, height: 14, title: "Incidents" })} cluster around releases.`;

  // table cell — the hero context (error bursts per service)
  const cell = `<table><tbody>
    <tr><td>gateway</td><td>${svg({ data: BURSTS, summary: false })}</td></tr>
    <tr><td>billing</td><td>${svg({ data: BURSTS.map((v, i) => (i % 2 ? v : 0)), summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Error bursts (24 h)</div>
    <div class="value">14 events</div>
    ${svg({ data: BURSTS, width: 150, height: 18, title: "Error bursts" })}
  </div>`;

  const tab = `<div class="tab"><span>Alerts</span> ${svg({ data: BURSTS.slice(0, 30), width: 44, height: 10, summary: false })}</div>`;

  const variants = [
    svg({ data: BURSTS, title: "intensity" }),
    svg({ data: BURSTS, mode: "barcode", title: "barcode" }),
    svg({ data: SIGNED, title: "signed" }),
    svg({ data: SIGNED, positive: "up", title: "polarity" }),
    svg({ data: [0, 0, 0, 0, 0, 0], title: "quiet" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: BURSTS.slice(0, 30), summary: false })}</span>`,
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

test("seismogram — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "seismogram-gallery");
});

import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RugStrip } from "../../dist/charts/rug-strip/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(RugStrip as never, props));

// deterministic salary-band-like field with real clusters
const FIELD = Array.from({ length: 38 }, (_, i) => 40 + ((i * 13) % 45) + (i % 3 === 0 ? 8 : 0));

function gallery(): string {
  const sentence = `Your offer sits ${svg({ data: FIELD, markValue: 78, domain: [35, 95], width: 90, height: 12, title: "Pay band" })} inside the band.`;

  const cell = `<table><tbody>
    <tr><td>p50 latency</td><td>${svg({ data: FIELD, summary: false })}</td></tr>
    <tr><td>p95 latency</td><td>${svg({ data: FIELD.map((v) => v * 1.4), summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Response times (ms)</div>
    <div class="value">48 median</div>
    ${svg({ data: FIELD, markValue: 48, width: 140, height: 12, title: "Response times" })}
  </div>`;

  const tab = `<div class="tab"><span>Spread</span> ${svg({ data: FIELD.slice(0, 20), width: 44, height: 10, summary: false })}</div>`;

  const variants = [
    svg({ data: FIELD, title: "field" }),
    svg({ data: FIELD, markValue: 62, title: "markValue" }),
    svg({ data: [50, 50, 50, 50, 62, 71], title: "stacked duplicates" }),
    svg({ data: FIELD.slice(0, 12), orientation: "vertical", title: "vertical" }),
    svg({ data: [], title: "empty" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: FIELD.slice(0, 20), markValue: 60, summary: false })}</span>`,
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

test("rug-strip — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "rug-strip-gallery");
});

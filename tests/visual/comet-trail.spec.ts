import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CometTrail } from "../../dist/charts/comet-trail/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(CometTrail as never, props));

const RISING = [40, 45, 50, 55, 60, 65, 70, 72, 75, 78, 80, 84, 87];
const VOLATILE = [50, 80, 30, 70, 40, 90, 55, 62];

function gallery(): string {
  const sentence = `Price now ${svg({ data: RISING, width: 80, summary: false })} and climbing.`;

  const cell = `<table><tbody>
    <tr><td>BTC</td><td>${svg({ data: RISING, width: 70, label: "none", summary: false })}</td></tr>
    <tr><td>ETH</td><td>${svg({ data: VOLATILE, width: 70, label: "none", summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Latency (ms)</div>
    <div class="value">${svg({ data: RISING, width: 100, summary: false })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ data: RISING, width: 56, label: "none", summary: false })} <span>Live</span></div>`;

  const variants = [
    svg({ data: RISING, title: "rising", width: 100 }),
    svg({ data: VOLATILE, title: "volatile", width: 100 }),
    svg({ data: RISING, label: "none", title: "no label", width: 100 }),
    svg({ data: [42], title: "single", width: 100 }),
  ]
    .map((s) => `<div>${s}</div>`)
    .join("");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: RISING, width: 80, summary: false })}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 22px; }
    table { border-collapse: collapse; } td { padding: 6px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variants { display: flex; gap: 28px; flex-wrap: wrap; align-items: center; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; display: inline-flex; align-items: center; gap: 6px; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants" class="variants">${variants}</section>
  <section id="presets">${presets}</section>`;
}

test("comet-trail — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "comet-trail-gallery");
});

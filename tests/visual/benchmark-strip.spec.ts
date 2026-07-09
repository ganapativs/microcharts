import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BenchmarkStrip } from "../../dist/charts/benchmark-strip/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(BenchmarkStrip as never, props));

const PEERS = Array.from(
  { length: 42 },
  (_, i) => 180 + Math.round(220 * Math.sin(i / 5) ** 2) + (i % 7) * 12,
);

function gallery(): string {
  const sentence = `Our latency ${svg({ data: PEERS, value: 312, width: 90, height: 12, title: "Latency" })} sits mid-pack.`;

  const cell = `<table><tbody>
    <tr><td>/checkout</td><td>${svg({ data: PEERS, value: 312, summary: false })}</td></tr>
    <tr><td>/search</td><td>${svg({ data: PEERS, value: 210, positive: "down", summary: false })}</td></tr>
    <tr><td>/feed</td><td>${svg({ data: PEERS, value: 440, positive: "down", summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Latency vs peers</div>
    <div class="value">312 ms</div>
    ${svg({ data: PEERS, value: 312, width: 150, height: 14, title: "Latency vs peers" })}
  </div>`;

  const tab = `<div class="tab"><span>Peers</span> ${svg({ data: PEERS, value: 312, width: 48, height: 10, summary: false })}</div>`;

  const variants = [
    svg({ data: PEERS, value: 312, title: "percentile" }),
    svg({ data: PEERS, value: 312, label: "value", title: "value" }),
    svg({ data: [210, 260, 300, 340, 410], value: 300, title: "min–max (n<8)" }),
    svg({ data: PEERS, value: 230, positive: "down", title: "polarity" }),
    svg({ data: [7, 7, 7, 7, 7, 7, 7, 7], value: 7, title: "flat peers" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: PEERS, value: 312, summary: false })}</span>`,
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

test("benchmark-strip — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "benchmark-strip-gallery");
});

import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentileLadder } from "../../dist/charts/percentile-ladder/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(PercentileLadder as never, props));

const LATENCY = Array.from({ length: 200 }, (_, i) =>
  i < 130
    ? 90 + (i % 50)
    : i < 180
      ? 150 + ((i * 7) % 320)
      : i < 196
        ? 480 + ((i * 11) % 900)
        : 1500 + ((i * 13) % 800),
);

function gallery(): string {
  const sentence = `Tail latency ${svg({ data: LATENCY, width: 96, height: 14, title: "Latency" })} is dominated by p99.`;

  const cell = `<table><tbody>
    <tr><td>/checkout</td><td>${svg({ data: LATENCY, summary: false })}</td></tr>
    <tr><td>/search</td><td>${svg({ data: LATENCY.map((v) => Math.round(v * 0.6)), summary: false })}</td></tr>
    <tr><td>/feed</td><td>${svg({ data: LATENCY, scale: "log", summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Request latency</div>
    <div class="value">p99 2.1 s</div>
    ${svg({ data: LATENCY, width: 170, height: 18, title: "Request latency" })}
  </div>`;

  const tab = `<div class="tab"><span>Tail</span> ${svg({ data: LATENCY, label: "none", width: 52, height: 10, summary: false })}</div>`;

  const variants = [
    svg({ data: LATENCY, width: 120, title: "p50/90/99" }),
    svg({ data: LATENCY, scale: "log", width: 120, title: "log" }),
    svg({ data: LATENCY, ps: [50, 95, 99.9], label: "values", width: 140, title: "values" }),
    svg({ data: LATENCY, marks: "dot", width: 120, title: "dots" }),
    svg({ data: [7, 7, 7, 7], width: 120, title: "all equal" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: LATENCY, width: 120, summary: false })}</span>`,
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

test("percentile-ladder — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "percentile-ladder-gallery");
});

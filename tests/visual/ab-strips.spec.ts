import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ABStrips } from "../../dist/charts/ab-strips/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(ABStrips as never, props));

const A = Array.from({ length: 80 }, (_, i) => 130 + ((i * 13) % 44) - 22);
const B = Array.from({ length: 80 }, (_, i) => 116 + ((i * 13) % 44) - 22);
const MS = (n: number) => `${Math.round(n)} ms`;

function gallery(): string {
  const sentence = `Test ${svg({ data: { a: A, b: B }, format: MS, positive: "down", width: 110, height: 22, title: "Test" })} edged out control.`;

  const cell = `<table><tbody>
    <tr><td>Latency</td><td>${svg({ data: { a: A, b: B }, format: MS, positive: "down", summary: false })}</td></tr>
    <tr><td>Errors</td><td>${svg({ data: { a: A.map((v) => v - 40), b: B }, format: MS, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Latency A/B</div>
    <div class="value">−11%</div>
    ${svg({ data: { a: A, b: B }, format: MS, positive: "down", width: 170, height: 26, title: "Latency A/B" })}
  </div>`;

  const tab = `<div class="tab"><span>A/B</span> ${svg({ data: { a: A, b: B }, format: MS, width: 72, height: 18, label: "none", summary: false })}</div>`;

  const variants = [
    svg({ data: { a: A, b: B }, format: MS, positive: "down", title: "overlap" }),
    svg({
      data: { a: A.map((v) => v + 40), b: B },
      format: MS,
      positive: "down",
      title: "separated",
    }),
    svg({ data: { a: A, b: A }, format: MS, title: "identical" }),
    svg({ data: { a: [100, 130, 145], b: B }, format: MS, title: "small n" }),
    svg({ data: { a: A, b: B }, format: MS, labels: ["Ctrl", "Test"], title: "labels" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: { a: A, b: B }, summary: false })}</span>`,
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

test("ab-strips — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "ab-strips-gallery");
});

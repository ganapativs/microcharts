import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SpiralYear } from "../../dist/charts/spiral-year/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(SpiralYear as never, props));

const YEAR = Array.from({ length: 52 }, (_, i) => (i === 29 ? 480 : i === 5 ? 10 : 100 + i));
const DAYS = Array.from({ length: 200 }, (_, i) => (i * 37) % 100);

function gallery(): string {
  const sentence = `The year breathed: ${svg({ data: YEAR, size: 30, summary: false })}`;

  const cell = `<table><tbody>
    <tr><td>2023</td><td>${svg({ data: YEAR, size: 26, summary: false })}</td></tr>
    <tr><td>2024</td><td>${svg({ data: YEAR.map((v) => v * 0.7), size: 26, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Seasonality</div>
    <div class="value">${svg({ data: YEAR, size: 52, summary: false })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ data: YEAR, size: 22, summary: false })} <span>This year</span></div>`;

  const variants = [
    svg({ data: YEAR, title: "52 weeks", size: 48 }),
    svg({ data: YEAR, steps: 3, title: "steps 3", size: 48 }),
    svg({ data: YEAR, mark: "arc", title: "arc marks", size: 48 }),
    svg({ data: DAYS, monthTicks: false, title: "200 days, no ticks", size: 48 }),
  ]
    .map((s) => `<div>${s}</div>`)
    .join("");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: YEAR, size: 32, summary: false })}</span>`,
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

test("spiral-year — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "spiral-year-gallery");
});

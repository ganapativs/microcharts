import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PolarClock } from "../../dist/charts/polar-clock/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(PolarClock as never, props));

const DAY = Array.from({ length: 24 }, (_, hr) => (hr === 14 ? 312 : hr === 4 ? 20 : 80 + hr));
const WEEK = [120, 200, 180, 210, 260, 90, 60];

function gallery(): string {
  const sentence = `Busiest at 14:00 ${svg({ data: DAY, now: 14, size: 28, summary: false })}`;

  const cell = `<table><tbody>
    <tr><td>Mon</td><td>${svg({ data: WEEK, size: 24, summary: false })}</td></tr>
    <tr><td>Tue</td><td>${svg({ data: [90, 140, 110, 160, 130, 70, 40], size: 24, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Traffic by hour</div>
    <div class="value">${svg({ data: DAY, now: 14, label: "max", size: 44, summary: false })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ data: WEEK, size: 22, summary: false })} <span>This week</span></div>`;

  const variants = [
    svg({ data: DAY, now: 14, title: "length + now", size: 44 }),
    svg({ data: DAY, labels: true, label: "max", title: "cardinal ticks + peak", size: 44 }),
    svg({ data: WEEK, mode: "opacity", title: "opacity mode", size: 44 }),
    svg({ data: [10, null, 30, 0, 25], title: "null + zero", size: 44 }),
  ]
    .map((s) => `<div>${s}</div>`)
    .join("");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: DAY, now: 14, size: 32, summary: false })}</span>`,
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

test("polar-clock — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "polar-clock-gallery");
});

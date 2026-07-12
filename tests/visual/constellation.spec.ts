import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Constellation } from "../../dist/charts/constellation/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(Constellation as never, props));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const monthFmt = (x: number) => MONTHS[x] ?? String(x);

const INCIDENTS = [
  { x: 0, y: 40, m: 2 },
  { x: 2, y: 90, m: 7 },
  { x: 5, y: 30, m: 3 },
  { x: 8, y: 65, m: 5 },
];

function gallery(): string {
  const sentence = `Outages this half: ${svg({ data: INCIDENTS, xFormat: monthFmt, width: 90, height: 22 })}`;

  const cell = `<table><tbody>
    <tr><td>web</td><td>${svg({ data: INCIDENTS, summary: false, width: 80, height: 18 })}</td></tr>
    <tr><td>api</td><td>${svg({
      data: [
        { x: 1, y: 20, m: 1 },
        { x: 6, y: 55, m: 4 },
      ],
      summary: false,
      width: 80,
      height: 18,
    })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Milestones</div>
    <div class="value">${svg({ data: INCIDENTS, label: "max", summary: false, width: 110, height: 34 })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ data: INCIDENTS, summary: false, width: 70, height: 18 })} <span>Timeline</span></div>`;

  const variants = [
    svg({
      data: INCIDENTS,
      xFormat: monthFmt,
      title: "connected + magnitude",
      width: 90,
      height: 30,
    }),
    svg({ data: INCIDENTS, label: "max", title: "label max", width: 90, height: 30 }),
    svg({ data: INCIDENTS, connect: false, title: "scatter", width: 90, height: 30 }),
    svg({
      data: [{ x: 0 }, { x: 3 }, { x: 5 }, { x: 7 }, { x: 9 }],
      connect: false,
      title: "value-less (jittered)",
      width: 90,
      height: 30,
    }),
  ]
    .map((s) => `<div>${s}</div>`)
    .join("");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: INCIDENTS, summary: false, width: 90, height: 24 })}</span>`,
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

test("constellation — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "constellation-gallery");
});

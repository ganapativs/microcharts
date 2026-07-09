import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BalanceBeam } from "../../dist/charts/balance-beam/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(BalanceBeam as never, props));
const pair = (a: number, b: number) => [
  { label: "Inflow", value: a },
  { label: "Outflow", value: b },
];

function gallery(): string {
  const sentence = `This month, ${svg({ data: pair(620, 480), title: "Cash flow", width: 72, height: 28 })} inflow led.`;

  const cell = `<table><tbody>
    <tr><td>Q1</td><td>${svg({ data: pair(620, 480), summary: false, width: 70, height: 26 })}</td></tr>
    <tr><td>Q2</td><td>${svg({ data: pair(500, 500), summary: false, width: 70, height: 26 })}</td></tr>
    <tr><td>Q3</td><td>${svg({ data: pair(400, 700), summary: false, width: 70, height: 26 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Pros vs cons</div>
    <div class="value">${svg({
      data: [
        { label: "Pros", value: 7 },
        { label: "Cons", value: 3 },
      ],
      label: "values",
      summary: false,
      width: 96,
      height: 36,
    })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ data: pair(620, 480), summary: false, width: 56, height: 22 })} <span>Flow</span></div>`;

  const variants = [
    svg({ data: pair(620, 480), title: "left heavy" }),
    svg({ data: pair(500, 500), title: "balanced" }),
    svg({ data: pair(300, 800), title: "right heavy" }),
    svg({ data: pair(950, 50), title: "saturated" }),
    svg({ data: pair(620, 480), shape: "round", title: "round" }),
    svg({ data: pair(620, 480), label: "values", title: "labelled" }),
  ]
    .map((s) => `<span style="width:60px;height:26px;display:inline-block">${s}</span>`)
    .join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: pair(620, 480), summary: false, width: 60, height: 26 })}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 22px; }
    table { border-collapse: collapse; } td { padding: 6px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variants { display: flex; gap: 18px; flex-wrap: wrap; align-items: center; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; display: inline-flex; align-items: center; gap: 6px; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants" class="variants">${variants}</section>
  <section id="presets">${presets}</section>`;
}

test("balance-beam — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "balance-beam-gallery");
});

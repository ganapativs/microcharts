import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DepthWedge } from "../../dist/charts/depth-wedge/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(DepthWedge as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/depth-wedge.tsx BOOK).
const BOOK = {
  demand: [
    { level: 99.75, amount: 420 },
    { level: 99.5, amount: 360 },
    { level: 99.25, amount: 280 },
    { level: 99, amount: 200 },
    { level: 98.5, amount: 120 },
  ],
  supply: [
    { level: 100.25, amount: 300 },
    { level: 100.5, amount: 240 },
    { level: 100.75, amount: 160 },
    { level: 101, amount: 90 },
  ],
};

function gallery(): string {
  const sentence = `The book leans demand ${svg({ data: BOOK, width: 90, height: 20, summary: false })} into the spread.`;
  const cell = `<table><tbody>
    <tr><td>BTC-USD</td><td>${svg({ data: BOOK, width: 110, height: 22, summary: false })}</td></tr>
    <tr><td>ETH-USD</td><td>${svg({ data: { demand: BOOK.demand.slice(0, 3), supply: BOOK.supply.slice(0, 3) }, width: 110, height: 22, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Order book</div><div class="value">spread 0.20</div>
    ${svg({ data: BOOK, width: 200, height: 30, title: "Order book" })}</div>`;
  const tab = `<div class="tab"><span>Book</span> ${svg({ data: BOOK, width: 44, height: 12, label: "none", summary: false })}</div>`;
  const variants = [
    svg({ data: BOOK, width: 200, height: 30, title: "default" }),
    svg({ data: BOOK, normalize: true, width: 200, height: 30, title: "normalized" }),
    svg({ data: BOOK, label: "none", width: 200, height: 30, title: "no label" }),
    svg({
      data: { demand: [{ level: 99.5, amount: 100 }], supply: [{ level: 100.5, amount: 100 }] },
      width: 120,
      height: 24,
      title: "single level per side",
    }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: BOOK, width: 160, height: 26, summary: false })}</span>`,
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

test("depth-wedge — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "depth-wedge-gallery");
});

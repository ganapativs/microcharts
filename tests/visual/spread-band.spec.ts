import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SpreadBand } from "../../dist/charts/spread-band/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(SpreadBand as never, props));

const ORG = [8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24];
const PAID = [12, 12, 13, 13, 13, 14, 14, 14, 15, 15, 16, 16];
const PAIRS = ORG.map((a, i) => ({ a, b: PAID[i]! }));
const LABELS = ["Organic", "Paid"];

function gallery(): string {
  const sentence = `Organic pulled ahead of paid ${svg({ data: PAIRS, labels: LABELS, width: 90, summary: false })} midway through Q3.`;
  const cell = `<table><tbody>
    <tr><td>Signups</td><td>${svg({ data: PAIRS, labels: LABELS, summary: false })}</td></tr>
    <tr><td>Revenue</td><td>${svg({ data: PAIRS.map((p) => ({ a: p.b, b: p.a })), labels: LABELS, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Organic vs paid</div><div class="value">+8</div>
    ${svg({ data: PAIRS, labels: LABELS, width: 160, height: 30, label: "gap", title: "Organic vs paid" })}</div>`;
  const tab = `<div class="tab"><span>lead</span> ${svg({ data: PAIRS, labels: LABELS, width: 46, height: 12, summary: false })}</div>`;
  const variants = [
    svg({ data: PAIRS, labels: LABELS, width: 100, title: "default" }),
    svg({ data: PAIRS, labels: LABELS, width: 100, label: "none", title: "no label" }),
    svg({ data: PAIRS, labels: LABELS, width: 100, positive: "down", title: "down is good" }),
    svg({ data: ORG.map((v) => ({ a: v, b: v })), width: 100, title: "identical" }),
    svg({
      data: [
        { a: 10, b: 5 },
        { a: 12, b: 6 },
        { a: 14, b: 7 },
      ],
      labels: LABELS,
      width: 100,
      title: "never crosses",
    }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: PAIRS, labels: LABELS, width: 90, summary: false })}</span>`,
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

test("spread-band — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "spread-band-gallery");
});

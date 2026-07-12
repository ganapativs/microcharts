import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Ohlc } from "../../dist/charts/ohlc/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(Ohlc as never, props));

const PERIODS = Array.from({ length: 20 }, (_, i) => {
  const base = 140 + Math.sin(i / 3) * 8 + i * 0.6;
  return {
    open: Math.round(base * 10) / 10,
    high: Math.round((base + 3 + (i % 3)) * 10) / 10,
    low: Math.round((base - 3 - (i % 2)) * 10) / 10,
    close: Math.round((base + (i % 2 === 0 ? 2 : -1.5)) * 10) / 10,
  };
});

function gallery(): string {
  const sentence = `The stock ground higher ${svg({ data: PERIODS, width: 90, summary: false })} through earnings.`;
  const cell = `<table><tbody>
    <tr><td>ACME</td><td>${svg({ data: PERIODS, summary: false })}</td></tr>
    <tr><td>BOLT</td><td>${svg({ data: PERIODS.map((p) => ({ open: p.close, high: p.high, low: p.low, close: p.open })), summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">ACME 20d</div><div class="value">156.3</div>
    ${svg({ data: PERIODS, width: 160, height: 28, label: "last", title: "ACME 20 sessions" })}</div>`;
  const tab = `<div class="tab"><span>ACME</span> ${svg({ data: PERIODS, width: 48, height: 10, summary: false })}</div>`;
  const variants = [
    svg({ data: PERIODS, width: 100, title: "candle" }),
    svg({ data: PERIODS, width: 100, variant: "bars", title: "bars" }),
    svg({ data: PERIODS.slice(0, 5), width: 100, title: "few periods" }),
    svg({ data: PERIODS, maxPeriods: 10, width: 100, title: "maxPeriods 10" }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: PERIODS, width: 90, summary: false })}</span>`,
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

test("ohlc — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "ohlc-gallery");
});

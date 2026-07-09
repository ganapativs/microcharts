import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RateVolume } from "../../dist/charts/rate-volume/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(RateVolume as never, props));

// a conversion rate climbing as volume drains away — the reason this type exists
const DATA = [
  { rate: 2.3, volume: 220 },
  { rate: 2.5, volume: 190 },
  { rate: 2.9, volume: 150 },
  { rate: 3.1, volume: 120 },
  { rate: 3.6, volume: 70 },
  { rate: 4.1, volume: 38 },
];
const pct = { style: "percent", maximumFractionDigits: 1 } as const;
const frac = DATA.map((d) => ({ rate: d.rate / 100, volume: d.volume }));

function gallery(): string {
  const sentence = `Conversion ${svg({ data: frac, width: 90, height: 16, format: pct, title: "Conversion" })} rose as reach fell.`;

  const cell = `<table><tbody>
    <tr><td>Checkout</td><td>${svg({ data: frac, format: pct, minVolume: 0.5, label: "last", summary: false })}</td></tr>
    <tr><td>Signup</td><td>${svg({ data: frac.map((d) => ({ rate: d.rate * 0.6, volume: d.volume })), format: pct, label: "last", summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Conversion rate</div>
    <div class="value">4.1%</div>
    ${svg({ data: frac, format: pct, minVolume: 0.5, width: 150, height: 24, label: "last", title: "Conversion rate" })}
  </div>`;

  const tab = `<div class="tab"><span>Conv.</span> ${svg({ data: frac, format: pct, width: 56, height: 14, label: "none", summary: false })}</div>`;

  const variants = [
    svg({ data: DATA, title: "default" }),
    svg({ data: DATA, minVolume: 50, title: "minVolume" }),
    svg({ data: DATA, curve: "step", title: "step" }),
    svg({ data: DATA, dots: "none", label: "none", title: "bare" }),
    svg({
      data: [
        { rate: 2, volume: 100 },
        { rate: 9, volume: 0 },
        { rate: 3, volume: 80 },
      ],
      title: "zero volume",
    }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: DATA, minVolume: 50, summary: false })}</span>`,
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

test("rate-volume — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "rate-volume-gallery");
});

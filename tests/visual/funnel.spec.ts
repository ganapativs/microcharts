import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Funnel } from "../../dist/charts/funnel/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(Funnel as never, props));

const PIPE = [
  { label: "Visitors", value: 12400 },
  { label: "Signups", value: 5704 },
  { label: "Activated", value: 2730 },
  { label: "Paid", value: 1116 },
];

function gallery(): string {
  const sentence = `The pipeline converts ${svg({ data: PIPE, width: 56, height: 16, summary: false })} nine percent overall.`;
  const cell = `<table><tbody>
    <tr><td>Campaign A</td><td>${svg({ data: PIPE, summary: false })}</td></tr>
    <tr><td>Campaign B</td><td>${svg({ data: PIPE.map((d, i) => ({ ...d, value: Math.round(d.value * (1 - i * 0.15)) })), summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Signup funnel</div><div class="value">9% overall</div>
    ${svg({ data: PIPE, width: 150, height: 40, label: "percent", title: "Signup funnel" })}</div>`;
  const tab = `<div class="tab"><span>Funnel</span> ${svg({ data: PIPE, width: 36, height: 12, summary: false })}</div>`;
  const variants = [
    svg({ data: PIPE, title: "absolute" }),
    svg({ data: PIPE, mode: "rate", title: "rate (of first)" }),
    svg({ data: PIPE, connectors: false, title: "no slats" }),
    svg({ data: PIPE, highlight: "Activated", title: "the leak" }),
    svg({
      data: [
        { label: "a", value: 100 },
        { label: "b", value: 40 },
        { label: "c", value: 60 },
      ],
      title: "inversion",
    }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: PIPE, summary: false })}</span>`,
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

test("funnel — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "funnel-gallery");
});

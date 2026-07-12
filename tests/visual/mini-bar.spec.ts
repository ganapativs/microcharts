import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MiniBar } from "../../dist/charts/mini-bar/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(MiniBar as never, props));

const MIX = [
  { label: "East", value: 940 },
  { label: "West", value: 410 },
  { label: "South", value: 620 },
  { label: "North", value: 120 },
];
const SIGNED = [
  { label: "Mon", value: 4 },
  { label: "Tue", value: -2 },
  { label: "Wed", value: 6 },
  { label: "Thu", value: -1 },
  { label: "Fri", value: 3 },
];

function gallery(): string {
  const sentence = `Regional mix ${svg({ data: MIX, width: 40, height: 12, title: "Regional mix" })} still leans East.`;

  // table cell — the hero context (per-row category mix)
  const cell = `<table><tbody>
    <tr><td>Acme</td><td>${svg({ data: MIX, summary: false })}</td><td>$2.1M</td></tr>
    <tr><td>Globex</td><td>${svg({ data: MIX.map((d) => ({ ...d, value: (d.value * 7) % 800 })), summary: false })}</td><td>$1.4M</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Sales by region</div>
    <div class="value">$3.5M</div>
    ${svg({ data: MIX, width: 110, height: 30, highlight: "East", title: "Sales by region" })}
  </div>`;

  const tab = `<div class="tab"><span>Mix</span> ${svg({ data: MIX, width: 36, height: 12, summary: false })}</div>`;

  const variants = [
    svg({ data: MIX, title: "data order" }),
    svg({ data: MIX, sort: "desc", title: "ranked" }),
    svg({ data: MIX, highlight: "South", title: "highlight" }),
    svg({ data: MIX, orientation: "horizontal", width: 40, height: 24, title: "horizontal" }),
    svg({ data: SIGNED, positive: "up", title: "signed" }),
    svg({
      data: [
        { label: "a", value: 5 },
        { label: "b", value: null },
        { label: "c", value: 7 },
      ],
      title: "null gap",
    }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: MIX, highlight: "East", summary: false })}</span>`,
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

test("mini-bar — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "mini-bar-gallery");
});

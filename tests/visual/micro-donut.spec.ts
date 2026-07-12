import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MicroDonut } from "../../dist/charts/micro-donut/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(MicroDonut as never, props));

const MIX = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 90 },
  { label: "Edge", value: 30 },
  { label: "Arc", value: 20 },
];

function gallery(): string {
  const sentence = `Browser mix ${svg({ data: MIX, size: 16, summary: false })} beside its printed number.`;
  const cell = `<table><tbody>
    <tr><td>Web ${svg({ data: MIX, size: 14, decorative: true })}</td><td>62% Chrome</td></tr>
    <tr><td>Mobile ${svg({ data: MIX.slice(1), size: 14, decorative: true })}</td><td>63% Safari</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Traffic mix ${svg({ data: MIX, size: 20, decorative: true })}</div>
    <div class="value">62% Chrome</div></div>`;
  const tab = `<div class="tab"><span>Mix</span> ${svg({ data: MIX, size: 14, summary: false })}</div>`;
  const variants = [
    svg({ data: MIX, size: 32, title: "rollup" }),
    svg({ data: MIX.slice(0, 2), size: 32, title: "two wedges" }),
    svg({ data: [{ label: "All", value: 5 }], size: 32, title: "single (full)" }),
    svg({ data: MIX, size: 32, weight: 8, title: "weight" }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: MIX.slice(0, 3), size: 24, summary: false })}</span>`,
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

test("micro-donut — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "micro-donut-gallery");
});

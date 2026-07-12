import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EnsembleGhosts } from "../../dist/charts/ensemble-ghosts/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(EnsembleGhosts as never, props));

const FUT = Array.from({ length: 24 }, (_m, i) =>
  Array.from({ length: 10 }, (_, t) =>
    Math.round(40 + (i - 12) * 0.55 * t * 0.4 + 3 * Math.sin(i + t) + t * 0.5),
  ),
);

function gallery(): string {
  const sentence = `The futures fan out ${svg({ data: FUT, width: 110, height: 22, title: "Futures" })} not just the average.`;

  const cell = `<table><tbody>
    <tr><td>Q3</td><td>${svg({ data: FUT, summary: false, width: 90, height: 20 })}</td></tr>
    <tr><td>Q4</td><td>${svg({ data: FUT.slice(0, 12), summary: false, width: 90, height: 20 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Simulated futures</div>
    <div class="value">31–58</div>
    ${svg({ data: FUT, endpoints: true, width: 190, height: 40, title: "Simulated futures" })}
  </div>`;

  const tab = `<div class="tab"><span>Futures</span> ${svg({ data: FUT, width: 72, height: 18, summary: false })}</div>`;

  const variants = [
    svg({ data: FUT, title: "default" }),
    svg({ data: FUT, endpoints: true, title: "endpoints" }),
    svg({ data: FUT, emphasis: "median", title: "synthetic median" }),
    svg({ data: FUT, ghosts: 12, title: "12 ghosts" }),
    svg({ data: [[10, 20, 30]], title: "single" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: FUT, summary: false, width: 100, height: 24 })}</span>`,
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

test("ensemble-ghosts — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "ensemble-ghosts-gallery");
});

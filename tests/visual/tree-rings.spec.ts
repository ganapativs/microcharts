import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TreeRings } from "../../dist/charts/tree-rings/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(TreeRings as never, props));
const YEARS = [8, 12, 10, 18, 22, 15, 20, 14];

function gallery(): string {
  const sentence = `This account is ${svg({ data: YEARS, unit: "years", periodWord: "year", size: 26 })} old.`;

  const cell = `<table><tbody>
    <tr><td>Acme</td><td>${svg({ data: YEARS, summary: false, size: 22 })}</td></tr>
    <tr><td>Beta</td><td>${svg({ data: YEARS.slice(0, 5), summary: false, size: 22 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Company history</div>
    <div class="value">${svg({ data: YEARS, label: "last", unit: "years", periodWord: "year", summary: false, size: 40 })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ data: YEARS.slice(0, 6), summary: false, size: 20 })} <span>Age</span></div>`;

  const variants = [
    svg({ data: YEARS, title: "stroke" }),
    svg({ data: YEARS, rings: "fill", title: "fill" }),
    svg({ data: YEARS, total: 200, title: "cohort" }),
    svg({ data: [5, 0, 8, 3], title: "with a zero year" }),
  ]
    .map((s) => `<div>${s}</div>`)
    .join("");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: YEARS, summary: false, size: 30 })}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 22px; }
    table { border-collapse: collapse; } td { padding: 6px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variants { display: flex; gap: 24px; flex-wrap: wrap; align-items: center; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; display: inline-flex; align-items: center; gap: 6px; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants" class="variants">${variants}</section>
  <section id="presets">${presets}</section>`;
}

test("tree-rings — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "tree-rings-gallery");
});

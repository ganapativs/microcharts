import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QuadrantDot } from "../../dist/charts/quadrant-dot/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(QuadrantDot as never, props));

const FOCAL = { x: 3, y: 9 };
const FIELD = [
  { x: 2, y: 8 },
  { x: 8, y: 9 },
  { x: 3, y: 7 },
  { x: 9, y: 2 },
  { x: 7, y: 3 },
  { x: 1, y: 1 },
  { x: 5, y: 6 },
  { x: 6, y: 8 },
  { x: 4, y: 3 },
  { x: 8, y: 5 },
];
const AX = { xDomain: [0, 10], domain: [0, 10], xLabel: "effort", yLabel: "impact" };

function gallery(): string {
  const sentence = `This item sits ${svg({ data: FOCAL, field: FIELD, ...AX, width: 20, height: 20, title: "Effort vs impact" })} in the backlog.`;

  const cell = `<table><tbody>
    <tr><td>Login</td><td>${svg({ data: FOCAL, field: FIELD, ...AX, summary: false, width: 24, height: 24 })}</td></tr>
    <tr><td>Search</td><td>${svg({ data: { x: 8, y: 4 }, field: FIELD, ...AX, summary: false, width: 24, height: 24 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Effort vs impact</div>
    <div class="value">quick win</div>
    ${svg({ data: FOCAL, field: FIELD, ...AX, width: 80, height: 80, title: "Effort vs impact" })}
  </div>`;

  const tab = `<div class="tab"><span>Priority</span> ${svg({ data: FOCAL, field: FIELD, ...AX, width: 18, height: 18, summary: false })}</div>`;

  const variants = [
    svg({ data: FOCAL, field: FIELD, ...AX, width: 60, height: 60, title: "with field" }),
    svg({ data: FOCAL, ...AX, split: [5, 5], width: 60, height: 60, title: "lone glyph" }),
    svg({
      data: FOCAL,
      field: FIELD,
      ...AX,
      region: false,
      width: 60,
      height: 60,
      title: "no tint",
    }),
    svg({
      data: { x: 5, y: 8 },
      field: [{ x: 5, y: 2 }],
      domain: [0, 10],
      width: 60,
      height: 60,
      title: "degenerate x",
    }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: FOCAL, field: FIELD, ...AX, summary: false, width: 48, height: 48 })}</span>`,
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

test("quadrant-dot — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "quadrant-dot-gallery");
});

import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PictogramRow } from "../../dist/charts/pictogram-row/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(PictogramRow as never, props));

function gallery(): string {
  const sentence = `The coalition holds ${svg({ value: 5, total: 8, width: 70, height: 12, title: "Committee seats" })} of the committee seats.`;

  const cell = `<table><tbody>
    <tr><td>Backend</td><td>${svg({ value: 3, total: 5, shape: "square", summary: false })}</td><td>3/5 on-call</td></tr>
    <tr><td>Frontend</td><td>${svg({ value: 5, total: 5, shape: "square", summary: false })}</td><td>full</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Capacity used</div>
    <div class="value">6.5 of 8</div>
    ${svg({ value: 6.5, total: 8, width: 120, height: 14, title: "Capacity" })}
  </div>`;

  const tab = `<div class="tab"><span>Seats</span> ${svg({ value: 2, total: 4, width: 36, height: 10, summary: false })}</div>`;

  const variants = [
    svg({ value: 5, total: 8, title: "dots" }),
    svg({ value: 5, total: 8, shape: "square", title: "squares" }),
    svg({ value: 2.5, total: 4, title: "fractional clip" }),
    svg({ value: 2.5, total: 4, fractional: "round", title: "rounded" }),
    svg({ value: 0, total: 6, title: "empty" }),
    svg({ value: 6, total: 6, title: "full" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ value: 3.5, total: 6, summary: false })}</span>`,
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

test("pictogram-row — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "pictogram-row-gallery");
});

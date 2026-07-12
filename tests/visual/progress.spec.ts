import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Progress } from "../../dist/charts/progress/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(Progress as never, props));

function gallery(): string {
  const sentence = `The migration is ${svg({ value: 0.68, title: "Migration" })} through the backlog.`;

  // table cell + KPI card — the hero contexts (plan/22 #4)
  const cell = `<table><tbody>
    <tr><td>tenant-a</td><td>${svg({ value: 0.92, summary: false })}</td></tr>
    <tr><td>tenant-b</td><td>${svg({ value: 0.44, summary: false })}</td></tr>
    <tr><td>tenant-c</td><td>${svg({ value: 1.12, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Onboarding</div>
    <div class="value">3 of 5</div>
    ${svg({ value: 3, max: 5, segments: 5, label: "fraction", width: 120, height: 10, title: "Onboarding" })}
  </div>`;

  const tab = `<div class="tab"><span>Upload</span> ${svg({ value: 0.4, label: "none", width: 40, summary: false })}</div>`;

  const variants = [
    svg({ value: 0.68, title: "percent" }),
    svg({ value: 34, max: 50, label: "value", title: "value" }),
    svg({ value: 0.68, label: "none", title: "bare" }),
    svg({ value: 2.5, max: 5, segments: 5, title: "segments partial" }),
    svg({ value: 1.12, title: "overflow" }),
    svg({ value: 0, title: "zero" }),
    svg({ value: 5, max: 0, title: "no data" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ value: 0.68, summary: false })}</span>`,
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

test("progress — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "progress-gallery");
});

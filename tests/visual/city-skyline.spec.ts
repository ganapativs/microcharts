import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CitySkyline } from "../../dist/charts/city-skyline/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(CitySkyline as never, props));
const TEAMS = [
  { label: "Platform", value: 46, lit: 0.7 },
  { label: "Core", value: 32, lit: 0.5 },
  { label: "Web", value: 28, lit: 0.9 },
  { label: "API", value: 40, lit: 0.3 },
  { label: "Data", value: 18, lit: 0.6 },
];

function gallery(): string {
  const sentence = `Team sizes and activity: ${svg({ data: TEAMS, unit: "teams", bw: 12, gap: 4, height: 28 })}.`;

  const cell = `<table><tbody>
    <tr><td>Q1</td><td>${svg({ data: TEAMS, summary: false, bw: 9, gap: 3, height: 24 })}</td></tr>
    <tr><td>Q2</td><td>${svg({ data: TEAMS.map((t) => ({ ...t, value: t.value * 0.8 })), summary: false, bw: 9, gap: 3, height: 24 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Org load</div>
    <div class="value">${svg({ data: TEAMS, labels: true, unit: "teams", summary: false, bw: 16, gap: 6, height: 44 })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ data: TEAMS.slice(0, 3), summary: false, bw: 9, gap: 3, height: 22 })} <span>Teams</span></div>`;

  const variants = [
    svg({ data: TEAMS, title: "size + lit" }),
    svg({ data: TEAMS.map(({ label, value }) => ({ label, value })), title: "plain bars" }),
    svg({ data: TEAMS, label: "value", title: "values" }),
    svg({ data: TEAMS, labels: true, title: "labelled", bw: 14 }),
  ]
    .map((s) => `<div>${s}</div>`)
    .join("");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: TEAMS, summary: false, bw: 11, gap: 4, height: 28 })}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 22px; }
    table { border-collapse: collapse; } td { padding: 6px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variants { display: flex; gap: 26px; flex-wrap: wrap; align-items: flex-end; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; display: inline-flex; align-items: flex-end; gap: 6px; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants" class="variants">${variants}</section>
  <section id="presets">${presets}</section>`;
}

test("city-skyline — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "city-skyline-gallery");
});

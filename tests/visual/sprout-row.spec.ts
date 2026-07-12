import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SproutRow } from "../../dist/charts/sprout-row/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(SproutRow as never, props));
const ACCT = [
  { label: "Acme", value: 3 },
  { label: "Beta", value: 2 },
  { label: "Gamma", value: 3 },
  { label: "Delta", value: 1 },
  { label: "Echo", value: 0 },
  { label: "Foxtrot", value: 2 },
];

function gallery(): string {
  const sentence = `Account health this quarter: ${svg({ data: ACCT, title: "Account health", height: 22, step: 18 })}.`;

  const cell = `<table><tbody>
    <tr><td>North</td><td>${svg({ data: ACCT.slice(0, 4), summary: false, height: 20, step: 16 })}</td></tr>
    <tr><td>South</td><td>${svg({ data: ACCT.slice(1, 5), summary: false, height: 20, step: 16 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Portfolio maturity</div>
    <div class="value">${svg({ data: ACCT, labels: true, summary: false, height: 34, step: 26 })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ data: ACCT.slice(0, 3), summary: false, height: 20, step: 16 })} <span>Health</span></div>`;

  const stages = svg({
    data: [
      { label: "seed", value: 0 },
      { label: "sprout", value: 1 },
      { label: "leaf", value: 2 },
      { label: "bloom", value: 3 },
    ],
    labels: true,
    height: 34,
    step: 30,
  });

  const missing = svg({
    data: [
      { label: "A", value: 2 },
      { label: "B", value: null },
      { label: "C", value: 0 },
      { label: "D", value: 3 },
    ],
    label: "value",
    height: 26,
    step: 22,
  });

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: ACCT.slice(0, 4), summary: false, height: 22, step: 18 })}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 22px; }
    table { border-collapse: collapse; } td { padding: 6px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .row-marks { display: flex; gap: 24px; flex-wrap: wrap; align-items: center; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; display: inline-flex; align-items: center; gap: 6px; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="stages" class="row-marks">${stages} ${missing}</section>
  <section id="presets">${presets}</section>`;
}

test("sprout-row — four contexts + stages", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "sprout-row-gallery");
});

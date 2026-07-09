import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DicePips } from "../../dist/charts/dice-pips/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(DicePips as never, props));

function gallery(): string {
  const sentence = `Incident severity is ${svg({ value: 4, title: "Severity", size: 18 })} today.`;

  const cell = `<table><tbody>
    <tr><td>login</td><td>${svg({ value: 1, summary: false, size: 16 })}</td></tr>
    <tr><td>checkout</td><td>${svg({ value: 5, summary: false, size: 16 })}</td></tr>
    <tr><td>search</td><td>${svg({ value: 3, summary: false, size: 16 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Blockers</div>
    <div class="value">${svg({ value: 6, summary: false, size: 28 })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ value: 2, summary: false, size: 16 })} <span>Flags</span></div>`;

  const variants = [1, 2, 3, 4, 5, 6, 0, 9]
    .map((v) => svg({ value: v, title: String(v), size: 22 }))
    .join(" ");

  const pipsOnly = [3, 5]
    .map((v) => svg({ value: v, face: false, title: `${v} pips-only`, size: 22 }))
    .join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ value: 5, summary: false, size: 20 })}</span>`,
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
  <section id="pips-only" class="variants">${pipsOnly}</section>
  <section id="presets">${presets}</section>`;
}

test("dice-pips — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "dice-pips-gallery");
});

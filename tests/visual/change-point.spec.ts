import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChangePoint } from "../../dist/charts/change-point/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(ChangePoint as never, props));

const STEP = [...Array(14).fill(30), ...Array(20).fill(48)];
const TWO = [...Array(10).fill(10), ...Array(10).fill(50), ...Array(10).fill(22)];
const RAMP = Array.from({ length: 30 }, (_, i) => 20 + i * 1.2);

function gallery(): string {
  const sentence = `Errors stepped up ${svg({ data: STEP, label: "delta", width: 110, height: 18, title: "Error rate" })} on the 14th.`;

  const cell = `<table><tbody>
    <tr><td>API</td><td>${svg({ data: STEP, summary: false, width: 90, height: 16 })}</td></tr>
    <tr><td>Web</td><td>${svg({ data: TWO, summary: false, width: 90, height: 16 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Error rate</div>
    <div class="value">+60%</div>
    ${svg({ data: STEP, label: "delta", width: 190, height: 28, title: "Error rate" })}
  </div>`;

  const tab = `<div class="tab"><span>Regime</span> ${svg({ data: STEP, width: 72, height: 16, summary: false })}</div>`;

  const variants = [
    svg({ data: STEP, title: "clean step" }),
    svg({ data: TWO, title: "two breaks" }),
    svg({ data: RAMP, title: "ramp (no break)" }),
    svg({ data: STEP, means: false, title: "no means" }),
    svg({ data: STEP, breaks: [14], label: "delta", title: "explicit" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: STEP, summary: false, width: 100, height: 18 })}</span>`,
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

test("change-point — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "change-point-gallery");
});

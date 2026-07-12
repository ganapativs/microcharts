import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ControlStrip } from "../../dist/charts/control-strip/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(ControlStrip as never, props));

const DEMO = [
  74, 73, 75, 74, 76, 73, 74, 75, 74, 73, 82, 74, 75, 73, 74, 76, 74, 73, 75, 74, 66, 74, 75, 74,
  73, 76, 74, 75, 74, 73,
];

function gallery(): string {
  const sentence = `Line 3 ${svg({ data: DEMO, width: 90, height: 20, title: "Line 3" })} left the band twice.`;

  const cell = `<table><tbody>
    <tr><td>Line 3</td><td>${svg({ data: DEMO, summary: false })}</td></tr>
    <tr><td>Line 4</td><td>${svg({ data: DEMO.map((v) => v + 1), summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Fill weight</div>
    <div class="value">74 g</div>
    ${svg({ data: DEMO, width: 150, height: 24, title: "Fill weight" })}
  </div>`;

  const tab = `<div class="tab"><span>SPC ⌐</span> ${svg({ data: DEMO, width: 56, height: 14, summary: false })}</div>`;

  const variants = [
    svg({ data: DEMO, title: "sigma" }),
    svg({ data: DEMO, rules: "we", title: "WE rules" }),
    svg({ data: DEMO, dots: "all", title: "all dots" }),
    svg({ data: DEMO.slice(0, 6), title: "provisional" }),
    svg({ data: [7, 7, 7, 7, 7], title: "zero variance" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: DEMO, summary: false })}</span>`,
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

test("control-strip — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "control-strip-gallery");
});

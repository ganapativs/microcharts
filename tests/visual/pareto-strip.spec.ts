import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ParetoStrip } from "../../dist/charts/pareto-strip/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(ParetoStrip as never, props));

const CAUSES = [
  { label: "Timeouts", value: 38 },
  { label: "OOM", value: 24 },
  { label: "Deploy", value: 15 },
  { label: "Config", value: 9 },
  { label: "Network", value: 7 },
  { label: "Auth", value: 4 },
  { label: "Disk", value: 3 },
  { label: "DNS", value: 3 },
  { label: "Other bug", value: 2 },
];

function gallery(): string {
  const sentence = `Fix these ${svg({ data: CAUSES, unit: "causes", metric: "incidents", width: 110, height: 22, title: "Causes" })} first.`;

  const cell = `<table><tbody>
    <tr><td>API</td><td>${svg({ data: CAUSES, summary: false })}</td></tr>
    <tr><td>Web</td><td>${svg({ data: CAUSES.slice(1), summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Incident causes</div>
    <div class="value">3 → 77%</div>
    ${svg({ data: CAUSES, unit: "causes", metric: "incidents", width: 170, height: 28, title: "Incident causes" })}
  </div>`;

  const tab = `<div class="tab"><span>Causes</span> ${svg({ data: CAUSES, width: 72, height: 18, label: "none", summary: false })}</div>`;

  const variants = [
    svg({ data: CAUSES, title: "default 80%" }),
    svg({ data: CAUSES, threshold: 60, title: "60%" }),
    svg({ data: CAUSES, maxItems: 3, title: "rollup" }),
    svg({ data: CAUSES, threshold: false, title: "no threshold" }),
    svg({ data: [{ label: "a", value: 0 }], title: "empty" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: CAUSES, summary: false })}</span>`,
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

test("pareto-strip — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "pareto-strip-gallery");
});

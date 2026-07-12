import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
// The BUILT artifact — this doubles as a smoke test that dist renders (plan/09).
import { Sparkline } from "../../dist/charts/sparkline/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");

const D = [4, 6, 5, 9, 7, 8, 11, 9, 13, 12, 15, 14];
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(Sparkline as never, props));

// The product thesis, shown in its four canonical contexts (plan/04 §6) plus a
// variant strip. This markup is the visual baseline target and the seed for the
// Phase-3 doc page's "4 contexts" section — one compiled source of truth.
function gallery(): string {
  const sentence = `Weekly revenue ${svg({ data: D, title: "Weekly revenue" })} is trending up.`;

  const cell = `<table><tbody>
    <tr><td>Acme</td><td>${svg({ data: D, summary: false })}</td><td>$4.2k</td></tr>
    <tr><td>Globex</td><td>${svg({ data: [9, 7, 8, 6, 7, 5, 6, 4, 5, 3], summary: false, color: "var(--mc-negative)" })}</td><td>$1.1k</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">MRR</div>
    <div class="value">$48,210</div>
    ${svg({ data: D, curve: "smooth", fill: true, width: 120, height: 32, title: "MRR" })}
  </div>`;

  const tab = `<div class="tab"><span>Traffic</span> ${svg({ data: D, dots: "none", width: 48, height: 14, summary: false })}</div>`;

  const variants = [
    svg({ data: D, title: "linear" }),
    svg({ data: D, curve: "smooth", title: "smooth" }),
    svg({ data: D, curve: "step", title: "step" }),
    svg({ data: D, fill: true, title: "area" }),
    svg({ data: D, band: [6, 12], title: "band" }),
    svg({ data: D, dots: "minmax", title: "minmax" }),
    svg({ data: D, label: "last", width: 100, title: "label" }),
  ].join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 20px; }
    table { border-collapse: collapse; } td { padding: 4px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; } .card .value { font-size: 22px; font-weight: 600; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variants { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants" class="variants">${variants}</section>`;
}

test("sparkline — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "sparkline-gallery");
});

import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BumpStrip } from "../../dist/charts/bump-strip/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(BumpStrip as never, props));

const RANKS = [5, 5, 4, 4, 4, 3, 2, 2, 3, 2, 1, 1];

function gallery(): string {
  const sentence = `We climbed the category ${svg({ data: RANKS, width: 80, label: "none", summary: false })} over the season.`;
  const cell = `<table><tbody>
    <tr><td>Alpha</td><td>${svg({ data: RANKS, summary: false })}</td></tr>
    <tr><td>Beta</td><td>${svg({ data: [...RANKS].reverse(), summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Category rank</div><div class="value">#1</div>
    ${svg({ data: RANKS, width: 150, height: 22, title: "Category rank" })}</div>`;
  const tab = `<div class="tab"><span>Rank</span> ${svg({ data: RANKS, width: 44, height: 10, label: "none", summary: false })}</div>`;
  const variants = [
    svg({ data: RANKS, width: 90, title: "ends labels" }),
    svg({ data: RANKS, width: 90, label: "last", title: "last only" }),
    svg({ data: RANKS, width: 90, dots: "none", label: "none", title: "bare" }),
    svg({ data: [2, null, null, 3, 1, 1], width: 90, title: "unranked gaps" }),
    svg({ data: RANKS, maxRank: 10, width: 90, title: "fixed maxRank 10" }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: RANKS, width: 80, label: "none", summary: false })}</span>`,
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

test("bump-strip — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "bump-strip-gallery");
});

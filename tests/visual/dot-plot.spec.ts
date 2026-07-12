import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DotPlot } from "../../dist/charts/dot-plot/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(DotPlot as never, props));

const TEAM = [
  { label: "Ada", value: 96 },
  { label: "Kim", value: 41 },
  { label: "Sam", value: 88 },
  { label: "Noor", value: 73 },
  { label: "Lee", value: 60 },
];

function gallery(): string {
  const sentence = `Review scores ${svg({ data: TEAM.slice(0, 3), width: 60, height: 22, title: "Scores" })} spread widely this cycle.`;

  const cell = `<table><tbody>
    <tr><td>Team A</td><td>${svg({ data: TEAM.slice(0, 4), summary: false })}</td></tr>
    <tr><td>Team B</td><td>${svg({ data: TEAM.slice(1, 5), summary: false })}</td></tr>
  </tbody></table>`;

  // KPI leaderboard — the hero context
  const kpi = `<div class="card">
    <div class="label">Team leaderboard</div>
    <div class="value">96 top</div>
    ${svg({ data: TEAM, width: 140, height: 56, highlight: "Ada", label: "value", title: "Leaderboard" })}
  </div>`;

  const tab = `<div class="tab"><span>Scores</span> ${svg({ data: TEAM.slice(0, 3), width: 40, height: 18, summary: false })}</div>`;

  const variants = [
    svg({ data: TEAM, title: "positions" }),
    svg({ data: TEAM, stem: true, title: "stems (zero-anchored)" }),
    svg({ data: TEAM, highlight: "Sam", title: "highlight" }),
    svg({ data: TEAM, label: "value", height: 48, title: "values" }),
    svg({
      data: [
        { label: "a", value: 50 },
        { label: "b", value: 50 },
      ],
      title: "coincident",
    }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: TEAM.slice(0, 3), highlight: "Ada", summary: false })}</span>`,
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

test("dot-plot — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "dot-plot-gallery");
});

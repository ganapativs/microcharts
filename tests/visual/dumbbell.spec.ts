import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Dumbbell } from "../../dist/charts/dumbbell/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(Dumbbell as never, props));

const BANDS = [
  { label: "Paris", from: 52, to: 61 },
  { label: "Berlin", from: 48, to: 68 },
  { label: "Oslo", from: 66, to: 60 },
  { label: "Rome", from: 44, to: 50 },
];

function gallery(): string {
  const sentence = `Salaries moved ${svg({ data: [{ from: 62, to: 84 }], width: 60, height: 12, title: "Band move" })} over the review cycle.`;

  // table cell — the hero context (salary bands per row)
  const cell = `<table><tbody>
    ${BANDS.map(
      (b) => `<tr><td>${b.label}</td><td>${svg({ data: [b], summary: false })}</td></tr>`,
    ).join("")}
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Band moves (YoY)</div>
    <div class="value">4 cities</div>
    ${svg({ data: BANDS, width: 140, height: 52, title: "Band moves" })}
  </div>`;

  const tab = `<div class="tab"><span>Bands</span> ${svg({ data: [{ from: 40, to: 60 }], width: 40, height: 10, summary: false })}</div>`;

  const variants = [
    svg({ data: [{ from: 40, to: 70 }], title: "rise" }),
    svg({ data: [{ from: 70, to: 40 }], title: "fall" }),
    svg({ data: [{ from: 40, to: 70 }], positive: "up", title: "valence" }),
    svg({ data: [{ from: 55, to: 55 }], title: "no change" }),
    svg({
      data: [{ from: 40, to: 60 }],
      width: 120,
      label: "value",
      domain: [0, 100],
      title: "values",
    }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: [{ from: 40, to: 70 }], positive: "up", summary: false })}</span>`,
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

test("dumbbell — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "dumbbell-gallery");
});

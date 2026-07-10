import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GradeProfile } from "../../dist/charts/grade-profile/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(GradeProfile as never, props));

const m = (n: number) => `${n} m`;
const TRAIL = [
  { d: 0, elev: 800 },
  { d: 100, elev: 809 },
  { d: 250, elev: 812 },
  { d: 350, elev: 817 },
  { d: 500, elev: 835 },
  { d: 700, elev: 833 },
  { d: 900, elev: 865 },
];

function gallery(): string {
  const sentence = `The back climb ${svg({ data: TRAIL, width: 90, label: "none", summary: false })} bites late.`;
  const cell = `<table><tbody>
    <tr><td>Stage 4</td><td>${svg({ data: TRAIL, format: m, summary: false })}</td></tr>
    <tr><td>Stage 5</td><td>${svg({ data: TRAIL.map((p) => ({ d: p.d, elev: 1700 - p.elev })), format: m, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Queen stage</div><div class="value">16% max</div>
    ${svg({ data: TRAIL, width: 170, height: 48, format: m, title: "Queen stage" })}</div>`;
  const tab = `<div class="tab"><span>Profile</span> ${svg({ data: TRAIL, width: 48, height: 14, label: "none", summary: false })}</div>`;
  const variants = [
    svg({ data: TRAIL, width: 160, height: 44, format: m, title: "max label (default)" }),
    svg({ data: TRAIL, width: 160, height: 44, label: "none", format: m, title: "no label" }),
    svg({ data: TRAIL, width: 160, height: 44, bins: [5, 8, 12], format: m, title: "custom bins" }),
    svg({
      data: TRAIL.map((p) => ({ d: p.d, elev: 1700 - p.elev })),
      width: 160,
      height: 44,
      format: m,
      title: "descent-only",
    }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: TRAIL, width: 120, height: 40, summary: false })}</span>`,
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

test("grade-profile — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "grade-profile-gallery");
});

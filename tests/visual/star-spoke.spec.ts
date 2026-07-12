import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StarSpoke } from "../../dist/charts/star-spoke/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(StarSpoke as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/star-spoke.tsx PROFILE).
const PROFILE = [
  { label: "Speed", value: 0.9 },
  { label: "Power", value: 0.6 },
  { label: "Range", value: 0.5 },
  { label: "Cost", value: 0.3 },
  { label: "Ease", value: 0.7 },
];
const BASELINE = [0.5, 0.5, 0.5, 0.5, 0.5];

function gallery(): string {
  const sentence = `The product profile is ${svg({ data: PROFILE, size: 28, labels: false, summary: false })} vs baseline.`;
  const cell = `<table><tbody>
    <tr><td>Widget A</td><td>${svg({ data: PROFILE, size: 28, labels: false, summary: false })}</td></tr>
    <tr><td>Widget B</td><td>${svg({ data: [...PROFILE].reverse(), size: 28, labels: false, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Product profile</div>
    ${svg({ data: PROFILE, size: 96, title: "Product profile" })}</div>`;
  const tab = `<div class="tab"><span>Profile</span> ${svg({ data: PROFILE, size: 16, labels: false, summary: false })}</div>`;
  const variants = [
    svg({ data: PROFILE, size: 96, title: "default" }),
    svg({ data: PROFILE, dots: "tips", size: 96, title: "endpoint dots" }),
    svg({ data: PROFILE, compare: BASELINE, size: 96, title: "vs baseline" }),
    svg({ data: PROFILE, guides: false, size: 96, title: "no guides" }),
    svg({ data: PROFILE, labels: false, size: 40, title: "small — labels drop out" }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: PROFILE, size: 72, summary: false })}</span>`,
    )
    .join(" ");
  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 20px; }
    table { border-collapse: collapse; } td { padding: 4px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; margin-bottom: 4px; }
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

test("star-spoke — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "star-spoke-gallery");
});

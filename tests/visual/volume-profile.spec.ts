import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VolumeProfile } from "../../dist/charts/volume-profile/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(VolumeProfile as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/volume-profile.tsx PROFILE).
const PROFILE = [
  { level: 134, weight: 3 },
  { level: 136, weight: 6 },
  { level: 138, weight: 11 },
  { level: 140, weight: 18 },
  { level: 142, weight: 26 },
  { level: 144, weight: 20 },
  { level: 146, weight: 12 },
  { level: 148, weight: 7 },
  { level: 150, weight: 4 },
];

function gallery(): string {
  const sentence = `Activity concentrates ${svg({ data: PROFILE, width: 24, height: 40, summary: false })} at 142.`;
  const cell = `<table><tbody>
    <tr><td>Tier A</td><td>${svg({ data: PROFILE, width: 32, height: 32, label: "none", summary: false })}</td></tr>
    <tr><td>Tier B</td><td>${svg({ data: PROFILE.slice(2, 8), width: 32, height: 32, label: "none", summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Volume by price</div><div class="value">POC 142</div>
    ${svg({ data: PROFILE, width: 60, height: 60, title: "Volume by price" })}</div>`;
  const tab = `<div class="tab"><span>Profile</span> ${svg({ data: PROFILE, width: 16, height: 20, label: "none", summary: false })}</div>`;
  const variants = [
    svg({ data: PROFILE, width: 60, height: 60, title: "default (left)" }),
    svg({ data: PROFILE, align: "right", width: 60, height: 60, title: "right" }),
    svg({ data: PROFILE, label: "none", width: 60, height: 60, title: "no label" }),
    svg({ data: PROFILE, valueArea: 0.5, width: 60, height: 60, title: "50% value area" }),
    svg({
      data: Array.from({ length: 6 }, (_, i) => 100 + i * 2),
      width: 60,
      height: 60,
      title: "evenly spread",
    }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: PROFILE, width: 60, height: 60, summary: false })}</span>`,
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

test("volume-profile — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "volume-profile-gallery");
});

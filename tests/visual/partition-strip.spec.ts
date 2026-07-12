import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PartitionStrip } from "../../dist/charts/partition-strip/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(PartitionStrip as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/partition-strip.tsx TREE).
const TREE = [
  {
    label: "JS",
    children: [
      { label: "react", value: 28 },
      { label: "vendor", value: 12 },
      { label: "app", value: 8 },
    ],
  },
  {
    label: "CSS",
    children: [
      { label: "tailwind", value: 16 },
      { label: "custom", value: 8 },
    ],
  },
  { label: "img", value: 18 },
  { label: "font", value: 10 },
];

function gallery(): string {
  const sentence = `The bundle splits as ${svg({ data: TREE, width: 120, height: 20, summary: false })} — JS still dominates.`;
  const cell = `<table><tbody>
    <tr><td>web</td><td>${svg({ data: TREE, width: 140, height: 20, summary: false })}</td></tr>
    <tr><td>admin</td><td>${svg({ data: TREE.slice(0, 2), width: 140, height: 20, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Bundle composition</div><div class="value">100 kB</div>
    ${svg({ data: TREE, width: 200, height: 28, title: "Bundle composition" })}</div>`;
  const tab = `<div class="tab"><span>bundle</span> ${svg({ data: TREE, width: 56, height: 10, labels: false, summary: false })}</div>`;
  const variants = [
    svg({ data: TREE, width: 200, height: 28, title: "default" }),
    svg({ data: TREE, emphasis: "react", width: 200, height: 28, title: "emphasis: react" }),
    svg({ data: TREE, labels: false, width: 120, height: 20, title: "no labels" }),
    svg({
      data: [
        { label: "a", value: 60 },
        { label: "b", value: 40 },
      ],
      width: 120,
      height: 20,
      title: "flat (no children)",
    }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: TREE, width: 160, height: 24, summary: false })}</span>`,
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

test("partition-strip — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "partition-strip-gallery");
});

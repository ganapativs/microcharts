import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DataDiff } from "../../dist/charts/data-diff/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(DataDiff as never, props));

const DIFF = [
  { key: "users", added: 340, removed: 120 },
  { key: "orders", added: 88, removed: 30 },
  { key: "items", added: 40, removed: 20 },
  { key: "tags", added: 24, removed: 8 },
  { key: "notes", added: 12, removed: 6 },
  { key: "flags", added: 8, removed: 3 },
];

function gallery(): string {
  const sentence = `This release changed ${svg({ data: DIFF, width: 110, height: 40, title: "Diff" })} across the schema.`;

  const cell = `<table><tbody>
    <tr><td>v12</td><td>${svg({ data: DIFF, summary: false, width: 90, height: 40 })}</td></tr>
    <tr><td>v11</td><td>${svg({ data: DIFF.slice(1), summary: false, width: 90, height: 40 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Schema diff</div>
    <div class="value">+512 / −187</div>
    ${svg({ data: DIFF, labels: true, width: 170, height: 80, title: "Schema diff" })}
  </div>`;

  const tab = `<div class="tab"><span>Diff</span> ${svg({ data: DIFF.slice(0, 3), width: 60, height: 28, summary: false })}</div>`;

  const variants = [
    svg({ data: DIFF, title: "default" }),
    svg({ data: DIFF, labels: true, title: "labels" }),
    svg({ data: DIFF, net: true, label: "totals", title: "net + totals" }),
    svg({ data: DIFF, sort: "net", title: "sort=net" }),
    svg({
      data: [
        { key: "same", added: 0, removed: 0 },
        { key: "chg", added: 12, removed: 4 },
      ],
      labels: true,
      title: "0/0 placeholder",
    }),
    svg({ data: [{ key: "a", added: 0, removed: 0 }], title: "empty" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: DIFF, summary: false, width: 90, height: 40 })}</span>`,
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

test("data-diff — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "data-diff-gallery");
});

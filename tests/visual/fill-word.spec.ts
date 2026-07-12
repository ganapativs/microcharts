import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FillWord } from "../../dist/charts/fill-word/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(FillWord as never, props));

function gallery(): string {
  const sentence = `The file is ${svg({ word: "uploading", value: 0.62, title: "Upload", fontSize: 15 })} to the server.`;

  const cell = `<table><tbody>
    <tr><td>backup</td><td>${svg({ word: "syncing", value: 0.35, summary: false, fontSize: 13 })}</td></tr>
    <tr><td>index</td><td>${svg({ word: "building", value: 0.8, summary: false, fontSize: 13 })}</td></tr>
    <tr><td>token</td><td>${svg({ word: "expiring", value: 0.6, mode: "drain", summary: false, fontSize: 13 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Storage quota</div>
    <div class="value">${svg({ word: "storage", value: 0.72, label: "value", summary: false, fontSize: 20 })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ word: "loading", value: 0.5, summary: false, fontSize: 13 })}</div>`;

  const variants = [
    svg({ word: "uploading", value: 0, title: "0%" }),
    svg({ word: "uploading", value: 0.25, title: "25%" }),
    svg({ word: "uploading", value: 0.62, title: "62%" }),
    svg({ word: "uploading", value: 1, title: "100%" }),
    svg({ word: "expiring", value: 0.7, mode: "drain", title: "drain" }),
    svg({ word: "storage", value: 0.4, label: "value", title: "labelled" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ word: "loading", value: 0.55, summary: false, fontSize: 15 })}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 20px; }
    table { border-collapse: collapse; } td { padding: 4px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; } .card .value { font-size: 22px; font-weight: 600; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variants { display: flex; gap: 18px; flex-wrap: wrap; align-items: center; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants" class="variants">${variants}</section>
  <section id="presets">${presets}</section>`;
}

test("fill-word — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "fill-word-gallery");
});

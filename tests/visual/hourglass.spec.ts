import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Hourglass } from "../../dist/charts/hourglass/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(Hourglass as never, props));

function gallery(): string {
  const sentence = `The session is ${svg({ value: 0.75, title: "Session", height: 40 })} through.`;

  const cell = `<table><tbody>
    <tr><td>token</td><td>${svg({ value: 0.8, label: "remaining", summary: false, height: 34 })}</td></tr>
    <tr><td>trial</td><td>${svg({ value: 0.45, label: "remaining", summary: false, height: 34 })}</td></tr>
    <tr><td>cache</td><td>${svg({ value: 0.2, label: "remaining", summary: false, height: 34 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Deadline</div>
    <div class="value" style="display:flex;align-items:center;gap:8px">${svg({ value: 0.7, summary: false, height: 48 })}<span>30% left</span></div>
  </div>`;

  const tab = `<div class="tab">${svg({ value: 0.5, summary: false, height: 26 })} <span>Countdown</span></div>`;

  const variants = [0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]
    .map((v) => svg({ value: v, title: `${Math.round(v * 100)}%`, height: 40 }))
    .join(" ");

  const labelled = [
    svg({ value: 0.75, label: "remaining", title: "remaining" }),
    svg({ value: 0.75, label: "elapsed", title: "elapsed" }),
    svg({ value: 0.5, stream: false, title: "no stream" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ value: 0.6, summary: false, height: 38 })}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 22px; }
    table { border-collapse: collapse; } td { padding: 6px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; } .card .value { font-size: 20px; font-weight: 600; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variants { display: flex; gap: 18px; flex-wrap: wrap; align-items: center; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; display: inline-flex; align-items: center; gap: 6px; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants" class="variants">${variants}</section>
  <section id="labelled" class="variants">${labelled}</section>
  <section id="presets">${presets}</section>`;
}

test("hourglass — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "hourglass-gallery");
});

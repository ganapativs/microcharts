import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
// The BUILT artifact — visual baseline doubles as a dist smoke test (plan/09).
import { WindBarb } from "../../dist/charts/wind-barb/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(WindBarb as never, props));

function gallery(): string {
  const sentence = `Winds ${svg({ direction: 225, magnitude: 32, step: 10, size: 24, summary: false })} at the summit station.`;

  // station-row table — the hero context (plan/25 §8)
  const cell = `<table><tbody>
    <tr><td>KSFO</td><td>${svg({ direction: 280, magnitude: 12, size: 20, summary: false })}</td></tr>
    <tr><td>KJFK</td><td>${svg({ direction: 45, magnitude: 55, size: 20, summary: false })}</td></tr>
    <tr><td>KORD</td><td>${svg({ direction: 0, magnitude: 1, size: 20, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Wind</div>
    <div class="value">${svg({ direction: 225, magnitude: 32, step: 10, label: "value", size: 40, title: "Wind" })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ direction: 225, magnitude: 32, size: 18, summary: false })} <span>Wind</span></div>`;

  const variants = [
    svg({ direction: 0, magnitude: 1, title: "calm", size: 40 }),
    svg({ direction: 45, magnitude: 25, title: "half + full barbs", size: 40 }),
    svg({ direction: 225, magnitude: 55, title: "pennant", size: 40 }),
    svg({ direction: 45, magnitude: 25, variant: "arrow", title: "arrow variant", size: 40 }),
    svg({ direction: 45, magnitude: 25, label: "value", title: "with label", size: 40 }),
    svg({ direction: 300, magnitude: -20, title: "negative magnitude (flips 180°)", size: 40 }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ direction: 225, magnitude: 32, size: 32, summary: false })}</span>`,
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

test("wind-barb — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "wind-barb-gallery");
});

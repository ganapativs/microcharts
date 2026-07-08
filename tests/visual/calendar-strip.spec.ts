import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CalendarStrip } from "../../dist/charts/calendar-strip/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(CalendarStrip as never, props));

// pinned end — determinism (never a live "now" in visual tests)
const END = "2026-07-01";
const DATA = Array.from({ length: 18 }, (_, i) => ({
  date: `2026-06-${String(4 + i).padStart(2, "0")}`,
  value: i % 4 === 3 ? 0 : (i % 7) + 1,
}));

function gallery(): string {
  const sentence = `Deploys held a steady weekday rhythm ${svg({ data: DATA, end: END, summary: false })} through June.`;
  const cell = `<table><tbody>
    <tr><td>api</td><td>${svg({ data: DATA, end: END, summary: false })}</td></tr>
    <tr><td>web</td><td>${svg({ data: DATA.slice(0, 9), end: END, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Deploy cadence</div><div class="value">14 active</div>
    ${svg({ data: DATA, end: END, weeks: 4, title: "Deploy cadence", style: { width: "112px" } })}</div>`;
  const tab = `<div class="tab"><span>June</span> ${svg({ data: DATA, end: END, weeks: 2, summary: false })}</div>`;
  const variants = [
    svg({ data: DATA, end: END, title: "4 weeks (default)" }),
    svg({ data: DATA, end: END, weeks: 2, title: "2 weeks" }),
    svg({ data: DATA, end: END, weekStart: 0, title: "Sunday start" }),
    svg({ data: DATA, end: END, shape: "dot", title: "dot cells" }),
    svg({ data: [], end: END, title: "no records" }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: DATA, end: END, summary: false })}</span>`,
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

test("calendar-strip — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "calendar-strip-gallery");
});

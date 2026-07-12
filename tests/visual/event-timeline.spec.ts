import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EventTimeline } from "../../dist/charts/event-timeline/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(EventTimeline as never, props));

const H = 3_600_000;
const T0 = Date.UTC(2026, 5, 3);
const DATA = [
  { start: T0 + 1 * H, end: T0 + 5 * H, label: "Freeze", kind: "accent" },
  { start: T0 + 6 * H, end: T0 + 15 * H, label: "Healthy", kind: "positive" },
  { start: T0 + 11 * H, label: "Incident", kind: "negative" },
  { start: T0 + 16 * H, end: T0 + 18 * H, kind: "negative" },
  { start: T0 + 20 * H, label: "Release" },
];
const WINDOW = [T0, T0 + 24 * H];

function gallery(): string {
  const sentence = `The API stayed healthy ${svg({ data: DATA, domain: WINDOW, summary: false })} apart from one incident.`;
  const cell = `<table><tbody>
    <tr><td>api</td><td>${svg({ data: DATA, domain: WINDOW, summary: false })}</td></tr>
    <tr><td>worker</td><td>${svg({ data: DATA.slice(0, 3), domain: WINDOW, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Uptime window</div><div class="value">82%</div>
    ${svg({ data: DATA, domain: WINDOW, width: 160, height: 16, title: "Uptime window" })}</div>`;
  const tab = `<div class="tab"><span>24h</span> ${svg({ data: DATA, domain: WINDOW, width: 48, height: 8, summary: false })}</div>`;
  const variants = [
    svg({ data: DATA, domain: WINDOW, width: 110, title: "default" }),
    svg({ data: DATA, domain: WINDOW, now: T0 + 21 * H, width: 110, title: "with now tick" }),
    svg({
      data: DATA,
      domain: WINDOW,
      label: "spans",
      width: 160,
      height: 14,
      title: "span labels",
    }),
    svg({
      data: [{ start: T0 - 4 * H, end: T0 + 3 * H, kind: "negative" }],
      domain: WINDOW,
      width: 110,
      title: "clipped at the edge",
    }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: DATA, domain: WINDOW, summary: false })}</span>`,
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

test("event-timeline — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "event-timeline-gallery");
});

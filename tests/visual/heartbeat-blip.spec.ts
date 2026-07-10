import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HeartbeatBlip } from "../../dist/charts/heartbeat-blip/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(HeartbeatBlip as never, props));

const BUSY = [97_000, 92_000, 85_000, 70_000, 55_000, 48_000];
const QUIET = [90_000, 60_000];

function gallery(): string {
  const sentence = `The service is ${svg({ events: BUSY, now: 100_000, width: 70, summary: false })} alive.`;

  const cell = `<table><tbody>
    <tr><td>web</td><td>${svg({ events: BUSY, now: 100_000, width: 64, summary: false })}</td></tr>
    <tr><td>api</td><td>${svg({ events: QUIET, now: 100_000, width: 64, summary: false })}</td></tr>
    <tr><td>db</td><td>${svg({ events: [], now: 100_000, width: 64, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Requests</div>
    <div class="value">${svg({ events: BUSY, now: 100_000, label: "count", width: 90, summary: false })}</div>
  </div>`;

  const tab = `<div class="tab">${svg({ events: BUSY, now: 100_000, width: 56, summary: false })} <span>Live</span></div>`;

  const variants = [
    svg({ events: BUSY, now: 100_000, title: "busy", width: 90 }),
    svg({ events: QUIET, now: 100_000, title: "quiet", width: 90 }),
    svg({ events: BUSY, now: 100_000, label: "count", title: "count", width: 90 }),
    svg({ events: [], now: 100_000, title: "flatline", width: 90 }),
  ]
    .map((s) => `<div>${s}</div>`)
    .join("");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ events: BUSY, now: 100_000, width: 70, summary: false })}</span>`,
    )
    .join(" ");

  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 22px; }
    table { border-collapse: collapse; } td { padding: 6px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; }
    .card .label { font-size: 12px; opacity: .7; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variants { display: flex; gap: 28px; flex-wrap: wrap; align-items: center; }
    .preset { margin-right: 18px; font: 11px ui-monospace, monospace; display: inline-flex; align-items: center; gap: 6px; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants" class="variants">${variants}</section>
  <section id="presets">${presets}</section>`;
}

test("heartbeat-blip — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "heartbeat-blip-gallery");
});

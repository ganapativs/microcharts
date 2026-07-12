import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StatusDot } from "../../dist/charts/status-dot/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(StatusDot as never, props));

function gallery(): string {
  const sentence = `The API is ${svg({ status: "ok", title: "API" })} operational; batch jobs are ${svg({ status: "warn", title: "Batch jobs" })} degraded.`;

  // service-list table — the hero context (plan/22 #2)
  const cell = `<table><tbody>
    <tr><td>${svg({ status: "ok", summary: false })}</td><td>gateway</td><td>99.99%</td></tr>
    <tr><td>${svg({ status: "warn", summary: false })}</td><td>search</td><td>98.71%</td></tr>
    <tr><td>${svg({ status: "error", summary: false })}</td><td>billing</td><td>91.02%</td></tr>
    <tr><td>${svg({ status: "off", summary: false })}</td><td>legacy-sync</td><td>—</td></tr>
    <tr><td>${svg({ status: "busy", summary: false })}</td><td>reindex</td><td>running</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Deploy pipeline ${svg({ status: "busy", title: "Pipeline" })}</div>
    <div class="value">building…</div>
  </div>`;

  const tab = `<div class="tab">${svg({ status: "error", summary: false })} <span>Incidents</span></div>`;

  const variants = [
    svg({ status: "ok", title: "ok" }),
    svg({ status: "warn", title: "warn" }),
    svg({ status: "error", title: "error" }),
    svg({ status: "off", title: "off" }),
    svg({ status: "busy", title: "busy" }),
    svg({ status: "ok", pulse: true, title: "pulse" }),
    svg({
      status: "degraded",
      states: { degraded: { glyph: "triangle", token: "--mc-cat-1", label: "degraded" } },
      title: "custom state",
    }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ status: "ok", summary: false })} ${svg({ status: "warn", summary: false })} ${svg({ status: "error", summary: false })}</span>`,
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

test("status-dot — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "status-dot-gallery");
});

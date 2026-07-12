import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueueDepth } from "../../dist/charts/queue-depth/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(QueueDepth as never, props));

const DATA = [42, 55, 70, 88, 96, 120, 150, 182, 214];
const CAP = 100;
const DRAIN = [214, 190, 150, 120, 96, 70, 48];

function gallery(): string {
  const sentence = `The support queue ${svg({ data: DATA, capacity: CAP, width: 90, height: 20, title: "Support queue" })} is running hot.`;

  const cell = `<table><tbody>
    <tr><td>API</td><td>${svg({ data: DATA, capacity: CAP, summary: false })}</td></tr>
    <tr><td>Web</td><td>${svg({ data: DRAIN, capacity: CAP, summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Support queue</div>
    <div class="value">214</div>
    ${svg({ data: DATA, capacity: CAP, width: 150, height: 28, title: "Support queue" })}
  </div>`;

  const tab = `<div class="tab"><span>Inbox</span> ${svg({ data: DATA, capacity: CAP, width: 56, height: 16, label: "none", summary: false })}</div>`;

  const variants = [
    svg({ data: DATA, capacity: CAP, title: "growing, breached" }),
    svg({ data: DRAIN, capacity: CAP, title: "draining" }),
    svg({ data: DATA, title: "no capacity" }),
    svg({ data: DATA, capacity: CAP, label: "none", title: "no label" }),
    svg({ data: [10, null, 40, null, 80, 120], capacity: CAP, title: "gaps" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: DATA, capacity: CAP, summary: false })}</span>`,
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

test("queue-depth — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "queue-depth-gallery");
});

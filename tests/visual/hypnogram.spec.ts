import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Hypnogram } from "../../dist/charts/hypnogram/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(Hypnogram as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/hypnogram.tsx SLEEP/STATES).
const SLEEP = [
  { t: 0, state: "Awake" },
  { t: 8, state: "Light" },
  { t: 22, state: "Deep" },
  { t: 38, state: "Light" },
  { t: 50, state: "REM" },
  { t: 62, state: "Light" },
  { t: 74, state: "Deep" },
  { t: 86, state: "Light" },
  { t: 98, state: "REM" },
  { t: 110, state: "Awake" },
];
const STATES = ["Awake", "REM", "Light", "Deep"];
const DOM: [number, number] = [0, 120];

function gallery(): string {
  const sentence = `Sleep last night ${svg({ data: SLEEP, states: STATES, domain: DOM, width: 100, height: 24, labels: false, summary: false })} settled into deep sleep by midnight.`;
  const cell = `<table><tbody>
    <tr><td>Night 1</td><td>${svg({ data: SLEEP, states: STATES, domain: DOM, width: 140, height: 24, summary: false })}</td></tr>
    <tr><td>Night 2</td><td>${svg({ data: SLEEP.slice(0, 6), states: STATES, domain: DOM, width: 140, height: 24, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Sleep stages</div><div class="value">4 states</div>
    ${svg({ data: SLEEP, states: STATES, domain: DOM, width: 200, height: 64, title: "Sleep stages" })}</div>`;
  const tab = `<div class="tab"><span>Sleep</span> ${svg({ data: SLEEP, states: STATES, domain: DOM, width: 56, height: 14, labels: false, summary: false })}</div>`;
  const variants = [
    svg({
      data: SLEEP,
      states: STATES,
      domain: DOM,
      width: 200,
      height: 64,
      title: "steps (default)",
    }),
    svg({
      data: SLEEP,
      states: STATES,
      domain: DOM,
      variant: "lanes",
      width: 200,
      height: 64,
      title: "lanes",
    }),
    svg({
      data: SLEEP,
      states: STATES,
      domain: DOM,
      emphasis: "Deep",
      width: 200,
      height: 64,
      title: "emphasis Deep",
    }),
    svg({
      data: SLEEP,
      states: STATES,
      domain: DOM,
      connectors: false,
      width: 200,
      height: 64,
      title: "no connectors",
    }),
    svg({
      data: [{ t: 0, state: "Awake" }],
      states: STATES,
      width: 100,
      height: 40,
      title: "single entry",
    }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: SLEEP, states: STATES, domain: DOM, width: 160, height: 48, summary: false })}</span>`,
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

test("hypnogram — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "hypnogram-gallery");
});

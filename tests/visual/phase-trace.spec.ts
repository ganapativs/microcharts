import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PhaseTrace } from "../../dist/charts/phase-trace/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(PhaseTrace as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/phase-trace.tsx TRAJ).
const TRAJ = Array.from({ length: 40 }, (_, i) => {
  const t = (i / 40) * Math.PI * 2;
  return { x: 55 + Math.cos(t) * 22, y: 110 + Math.sin(t - 0.9) * 40 };
});

function gallery(): string {
  const sentence = `CPU and latency ${svg({ data: TRAJ, xLabel: "CPU", yLabel: "Latency", width: 44, height: 40, summary: false })} keep circling the same regime.`;
  const cell = `<table><tbody>
    <tr><td>api-1</td><td>${svg({ data: TRAJ, xLabel: "CPU", yLabel: "Latency", width: 44, height: 40, summary: false })}</td></tr>
    <tr><td>api-2</td><td>${svg({ data: TRAJ.slice(0, 20), xLabel: "CPU", yLabel: "Latency", width: 44, height: 40, summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Phase portrait</div><div class="value">CPU × Latency</div>
    ${svg({ data: TRAJ, xLabel: "CPU", yLabel: "Latency", width: 110, height: 100, title: "Phase portrait" })}</div>`;
  const tab = `<div class="tab"><span>Phase</span> ${svg({ data: TRAJ, xLabel: "CPU", yLabel: "Latency", width: 32, height: 28, summary: false })}</div>`;
  const variants = [
    svg({
      data: TRAJ,
      xLabel: "CPU",
      yLabel: "Latency",
      width: 110,
      height: 100,
      title: "default",
    }),
    svg({
      data: TRAJ,
      xLabel: "CPU",
      yLabel: "Latency",
      grid: true,
      width: 110,
      height: 100,
      title: "quadrant grid",
    }),
    svg({
      data: TRAJ,
      xLabel: "CPU",
      yLabel: "Latency",
      startDot: true,
      width: 110,
      height: 100,
      title: "start dot",
    }),
    svg({
      data: TRAJ,
      xLabel: "CPU",
      yLabel: "Latency",
      tail: 0.6,
      width: 110,
      height: 100,
      title: "longer tail",
    }),
    svg({
      data: [{ x: 10, y: 10 }],
      xLabel: "CPU",
      yLabel: "Latency",
      width: 80,
      height: 72,
      title: "single point",
    }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: TRAJ, xLabel: "CPU", yLabel: "Latency", width: 90, height: 80, summary: false })}</span>`,
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

test("phase-trace — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "phase-trace-gallery");
});

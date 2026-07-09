import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NetFlow } from "../../dist/charts/net-flow/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) => renderToStaticMarkup(h(NetFlow as never, props));

const DATA = [
  { in: 42, out: 31 },
  { in: 38, out: 35 },
  { in: 45, out: 29 },
  { in: 40, out: 44 },
  { in: 52, out: 38 },
  { in: 48, out: 41 },
  { in: 55, out: 36 },
  { in: 50, out: 47 },
  { in: 58, out: 39 },
  { in: 44, out: 52 },
  { in: 60, out: 41 },
  { in: 57, out: 43 },
];
const K = (n: number) => `${n}k`;

function gallery(): string {
  const sentence = `Cash flow ${svg({ data: DATA, format: K, width: 90, height: 20, title: "Cash flow" })} stayed net positive.`;

  const cell = `<table><tbody>
    <tr><td>Ops</td><td>${svg({ data: DATA, format: K, label: "last", summary: false })}</td></tr>
    <tr><td>R&amp;D</td><td>${svg({ data: DATA.map((d) => ({ in: d.out, out: d.in })), format: K, label: "last", summary: false })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Net cash flow</div>
    <div class="value">+14k</div>
    ${svg({ data: DATA, format: K, width: 150, height: 28, label: "last", title: "Net cash flow" })}
  </div>`;

  const tab = `<div class="tab"><span>Flow</span> ${svg({ data: DATA, format: K, width: 56, height: 16, net: true, label: "none", summary: false })}</div>`;

  const variants = [
    svg({ data: DATA, title: "area" }),
    svg({ data: DATA.slice(6), mode: "bars", title: "bars" }),
    svg({ data: DATA, net: false, title: "gross only" }),
    svg({ data: DATA, positive: "down", title: "paydown" }),
    svg({
      data: [
        { in: 0, out: 0 },
        { in: 0, out: 0 },
      ],
      title: "no flow",
    }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: DATA, summary: false })}</span>`,
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

test("net-flow — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "net-flow-gallery");
});

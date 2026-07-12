import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
// The BUILT artifacts — visual baselines double as dist smoke tests (plan/09).
import { SparkBar } from "../../dist/charts/sparkbar/index.js";
import { Delta } from "../../dist/charts/delta/index.js";
import { Bullet } from "../../dist/charts/bullet/index.js";
import { ActivityGrid } from "../../dist/charts/activity-grid/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const m = (c: unknown, p: Record<string, unknown>) => renderToStaticMarkup(h(c as never, p));

const BARS = [3, 5, 4, 7, 6, 9, 8, 11, 9, 12];
const WL = [1, 1, -1, 1, -1, 1, 1, 1, -1, 1, -1, 1];
const ACT = Array.from({ length: 84 }, (_, i) => Math.max(0, Math.round(Math.sin(i / 4) * 4 + 4)));

function gallery(): string {
  const rows: Array<[string, string]> = [
    ["SparkBar", m(SparkBar, { data: BARS, width: 120, height: 28, summary: false })],
    [
      "SparkBar · negatives",
      m(SparkBar, { data: [4, 6, -3, 5, -2, 7, 8, -1, 6], width: 120, height: 28, summary: false }),
    ],
    [
      "SparkBar · win-loss",
      m(SparkBar, { data: WL, mode: "winloss", width: 120, height: 28, summary: false }),
    ],
    ["Delta · up", m(Delta, { value: 0.124 })],
    ["Delta · down", m(Delta, { value: -0.031 })],
    ["Delta · flat", m(Delta, { value: 0 })],
    [
      "Bullet",
      m(Bullet, {
        value: 72,
        target: 80,
        bands: [50, 75],
        domain: [0, 100],
        width: 160,
        height: 20,
      }),
    ],
    [
      "Bullet · over",
      m(Bullet, {
        value: 92,
        target: 80,
        bands: [50, 75],
        domain: [0, 100],
        width: 160,
        height: 20,
      }),
    ],
    ["ActivityGrid", m(ActivityGrid, { data: ACT, cell: 10, gap: 2, summary: false })],
    [
      "ActivityGrid · strip",
      m(ActivityGrid, { data: ACT.slice(0, 40), layout: "strip", cell: 9, gap: 2, summary: false }),
    ],
  ];
  const cells = rows
    .map(
      ([label, svg]) =>
        `<div class="cell"><div class="art">${svg}</div><div class="lbl">${label}</div></div>`,
    )
    .join("");
  return `<style>${styles}
    body { font: 14px/1.5 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(240px, 1fr)); gap: 22px 40px; align-items: center; }
    .cell { display: flex; flex-direction: column; gap: 8px; }
    .art { min-height: 30px; display: flex; align-items: center; }
    .lbl { font: 11px ui-monospace, monospace; letter-spacing: .06em; text-transform: uppercase; opacity: .6; }
  </style><div class="grid">${cells}</div>`;
}

test("catalog — sparkbar, delta, bullet, activity-grid", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "catalog-gallery");
});

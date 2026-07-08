import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Sparkline } from "../../dist/charts/sparkline/index.js";
import { SparkBar } from "../../dist/charts/sparkbar/index.js";
import { Threshold, TargetZone, Marker, Callout } from "../../dist/annotations.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");

const LATENCY = [48, 52, 45, 58, 51, 47, 55, 49, 71, 64, 57, 52];

const spark = (children: unknown[], props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    h(
      Sparkline as never,
      { data: LATENCY, width: 160, height: 40, summary: false, ...props },
      ...(children as never[]),
    ),
  );

function gallery(): string {
  const rows: Array<[string, string]> = [
    [
      "threshold + zone + marker",
      spark([
        h(TargetZone as never, { y: [40, 60] }),
        h(Threshold as never, { y: 65, label: "SLA" }),
        h(Marker as never, { x: 8, label: "deploy" }),
      ]),
    ],
    ["callout", spark([h(Callout as never, { x: 3, y: 58, label: "cache miss" })])],
    [
      "celebrate (rest state)",
      spark([h(Marker as never, { x: 9, celebrate: true, label: "10k!" })]),
    ],
    [
      "off-scale threshold (pinned, dimmed)",
      spark([h(Threshold as never, { y: 200, label: "way off" })]),
    ],
    [
      "sparkbar host",
      renderToStaticMarkup(
        h(
          SparkBar as never,
          { data: LATENCY, width: 160, height: 40, summary: false },
          h(Threshold as never, { y: 60, label: "cap" }) as never,
        ),
      ),
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
    .grid { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 22px 40px; }
    .cell { display: flex; flex-direction: column; gap: 8px; }
    .lbl { font: 11px ui-monospace, monospace; letter-spacing: .06em; text-transform: uppercase; opacity: .6; }
  </style><div class="grid">${cells}</div>`;
}

test("annotations — vocabulary across hosts", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "annotations-gallery");
});

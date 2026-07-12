import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WinProbWorm } from "../../dist/charts/win-prob-worm/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(WinProbWorm as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/win-prob-worm.tsx GAME).
const GAME = [50, 48, 45, 52, 60, 58, 42, 38, 55, 68, 82, 90, 88, 94, 98];
const NAILBITER = [50, 53, 49, 52, 48, 51, 47, 50, 46, 49, 45, 48, 52];
const DECIDED = [50, 58, 66, 74, 80, 86, 90, 93, 96, 98, 99];
const SIDES = ["home", "away"];

function gallery(): string {
  const sentence = `Home closed it out ${svg({ data: GAME, sides: SIDES, width: 120, height: 20, title: "Win probability" })} in the fourth.`;

  const cell = `<table><tbody>
    <tr><td>Game 1</td><td>${svg({ data: GAME, sides: SIDES, summary: false, width: 110, height: 16 })}</td></tr>
    <tr><td>Game 2</td><td>${svg({ data: NAILBITER, sides: SIDES, summary: false, width: 110, height: 16 })}</td></tr>
  </tbody></table>`;

  const kpi = `<div class="card">
    <div class="label">Win probability</div>
    <div class="value">98%</div>
    ${svg({ data: GAME, sides: SIDES, width: 200, height: 30, title: "Win probability" })}
  </div>`;

  const tab = `<div class="tab"><span>Live</span> ${svg({ data: GAME, width: 72, height: 16, label: "none", summary: false })}</div>`;

  const variants = [
    svg({ data: GAME, sides: SIDES, title: "three flips" }),
    svg({ data: NAILBITER, sides: SIDES, title: "nailbiter" }),
    svg({ data: DECIDED, sides: SIDES, title: "wire to wire" }),
    svg({ data: GAME, sides: SIDES, label: "none", title: "no label" }),
    svg({ data: GAME, sides: SIDES, markSwing: false, width: 200, height: 28, title: "no swing" }),
    svg({ data: GAME, sides: SIDES, width: 200, height: 28, title: "swing marked" }),
  ].join(" ");

  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: GAME, summary: false, width: 110, height: 18 })}</span>`,
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

test("win-prob-worm — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "win-prob-worm-gallery");
});

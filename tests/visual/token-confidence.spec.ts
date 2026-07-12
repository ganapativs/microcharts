import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TokenConfidence } from "../../dist/charts/token-confidence/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const html = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(TokenConfidence as never, props));

// The docs registry dataset (apps/docs/src/lib/charts/token-confidence.tsx ANSWER).
const ANSWER = [
  { token: "The", confidence: 0.98 },
  { token: " Treaty", confidence: 0.93 },
  { token: " of", confidence: 0.99 },
  { token: " Westphalia", confidence: 0.71 },
  { token: " was", confidence: 0.96 },
  { token: " signed", confidence: 0.9 },
  { token: " in", confidence: 0.97 },
  { token: " 1648", confidence: 0.44 },
];

function gallery(): string {
  const sentence = `<p>The model answered: ${html({ data: ANSWER, summary: false })}</p>`;
  const cell = `<table><tbody>
    <tr><td>run 1</td><td>${html({ data: ANSWER, summary: false })}</td></tr>
    <tr><td>run 2</td><td>${html({ data: ANSWER.slice(0, 5), summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Answer confidence</div>
    ${html({ data: ANSWER, legend: true, title: "Answer confidence" })}</div>`;
  const tab = `<div class="tab"><span>draft</span> ${html({ data: ANSWER.slice(0, 4), summary: false })}</div>`;
  const variants = [
    html({ data: ANSWER, title: "default (flagged only)" }),
    html({ data: ANSWER, show: "all", title: "show all" }),
    html({ data: ANSWER, legend: true, title: "with legend" }),
    html({ data: ANSWER, tiers: [0.5, 0.95], title: "custom tiers" }),
    html({
      data: [{ token: "certain", confidence: 0.99 }],
      title: "all confident — no marks",
    }),
  ]
    .map((s) => `<span class="variant">${s}</span>`)
    .join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${html({ data: ANSWER, summary: false })}</span>`,
    )
    .join(" ");
  return `<style>${styles}
    body { font: 15px/1.6 system-ui, sans-serif; padding: 24px; color: var(--mc-stroke); }
    section { margin-bottom: 20px; }
    table { border-collapse: collapse; } td { padding: 4px 10px; border-bottom: 1px solid #8884; }
    .card { display: inline-block; padding: 12px 16px; border: 1px solid #8884; border-radius: 8px; max-width: 340px; }
    .card .label { font-size: 12px; opacity: .7; }
    .tab { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 6px; background: #8881; }
    .variant { display: block; margin-bottom: 8px; max-width: 420px; }
    .preset { display: block; margin-bottom: 8px; font: 13px ui-monospace, monospace; }
  </style>
  <section id="sentence">${sentence}</section>
  <section id="cell">${cell}</section>
  <section id="kpi">${kpi}</section>
  <section id="tab">${tab}</section>
  <section id="variants">${variants}</section>
  <section id="presets">${presets}</section>`;
}

test("token-confidence — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "token-confidence-gallery");
});

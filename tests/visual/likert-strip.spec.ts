import { test } from "./_fixtures";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LikertStrip } from "../../dist/charts/likert-strip/index.js";

const styles = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");
const svg = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(LikertStrip as never, props));

const SURVEY = [
  { label: "Strongly disagree", value: 10 },
  { label: "Disagree", value: 14 },
  { label: "Neutral", value: 14 },
  { label: "Agree", value: 34 },
  { label: "Strongly agree", value: 28 },
];

function gallery(): string {
  const sentence = `Respondents lean ${svg({ data: SURVEY, width: 80, height: 10, label: "none", summary: false })} toward agreement.`;
  const cell = `<table><tbody>
    <tr><td>Q1</td><td>${svg({ data: SURVEY, summary: false })}</td></tr>
    <tr><td>Q2</td><td>${svg({ data: [...SURVEY].reverse().map((d, i) => ({ label: SURVEY[i].label, value: d.value })), summary: false })}</td></tr>
  </tbody></table>`;
  const kpi = `<div class="card"><div class="label">Q1 satisfaction</div><div class="value">+38 net</div>
    ${svg({ data: SURVEY, width: 150, height: 18, title: "Q1 satisfaction" })}</div>`;
  const tab = `<div class="tab"><span>Q1</span> ${svg({ data: SURVEY, width: 44, height: 8, label: "none", summary: false })}</div>`;
  const variants = [
    svg({ data: SURVEY, width: 90, title: "split neutral" }),
    svg({ data: SURVEY, width: 90, neutral: "omit", title: "omit neutral" }),
    svg({ data: SURVEY, width: 90, label: "net", title: "net score" }),
    svg({ data: SURVEY.filter((_, i) => i !== 2), width: 90, title: "even levels" }),
  ].join(" ");
  const presets = ["editorial", "mono", "vivid"]
    .map(
      (p) =>
        `<span data-mc-theme="${p}" class="preset">${p} ${svg({ data: SURVEY, width: 80, summary: false })}</span>`,
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

test("likert-strip — four contexts + variants", async ({ page }) => {
  await page.setContent(gallery());
  await argosScreenshot(page, "likert-strip-gallery");
});

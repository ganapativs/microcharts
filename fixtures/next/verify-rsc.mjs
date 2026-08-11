// RSC gate: the static export must contain every server-rendered chart on the
// page — real shipped entries, one per subpath — and NO client JS chunk may
// reference chart code. Run after `next build`. Exits non-zero on any violation.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const html = readFileSync("out/index.html", "utf8");
let failed = false;
const check = (cond, msg) => {
  console.log(`${cond ? "✓" : "✗"} ${msg}`);
  if (!cond) failed = true;
};

// 1. Every SVG chart on the page is server-rendered into static HTML.
// page.tsx renders exactly 25 <Chart>-rooted svgs: 22 distinct chart types,
// the annotated second Sparkline, and the 2-chart SparkGroup. Exact, not a
// floor — a floor lets one chart vanish from the export without failing.
const svgCharts = (html.match(/class="mc-root/g) ?? []).length;
check(
  svgCharts === 25,
  `all SVG charts server-rendered (${svgCharts} mc-root found, need exactly 25)`,
);
check(html.includes('class="mc-delta'), "Delta (inline HTML) present");
check(html.includes('class="mc-token-confidence'), "TokenConfidence (inline HTML) present");
check(html.includes('data-mc-ink="data"'), "data ink present in static HTML");

// 2. Auto-summaries computed on the server, baked into the markup.
check(/Trending up[^<]*Last value/.test(html), "series auto-summary baked into static HTML");
check(html.includes("aria-label"), "accessible naming present");

// 3. Annotation children resolved server-side (Threshold label text in HTML).
check(html.includes("SLO"), "annotation layer rendered server-side");

// 4. Zero client JS: no JS chunk references chart code.
const jsFiles = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".js")) jsFiles.push(p);
  }
};
walk("out/_next/static");
const needle = /describeSeries|mc-root|Trending up|data-mc-ink/;
const offenders = jsFiles.filter((f) => needle.test(readFileSync(f, "utf8")));
check(
  offenders.length === 0,
  `no client JS references the chart (${jsFiles.length} chunks scanned)`,
);
if (offenders.length) console.error("  offending chunks:", offenders);

console.log(
  failed
    ? "\nRSC gate FAILED"
    : `\nRSC gate verified: ${svgCharts} SVG charts + 2 HTML charts static, zero client JS`,
);
process.exit(failed ? 1 : 0);

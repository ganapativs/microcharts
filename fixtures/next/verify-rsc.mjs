// Checkpoint 1 gate (plan/09 §1, plan/10): the static export must contain the
// server-rendered chart, and NO client JS chunk may reference chart code.
// Run after `next build`. Exits non-zero on any violation.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const html = readFileSync("out/index.html", "utf8");
let failed = false;
const check = (cond, msg) => {
  console.log(`${cond ? "✓" : "✗"} ${msg}`);
  if (!cond) failed = true;
};

// 1. Chart is server-rendered into static HTML.
check(html.includes('role="img"'), 'chart rendered server-side (role="img")');
check(html.includes('class="mc-root"'), "svg shell present");
check(html.includes('data-mc-ink="data"'), "data path present in static HTML");
// 2. Auto-summary computed on the server, baked into the markup.
check(/Trending up[^<]*Last value/.test(html), "auto-summary baked into static HTML");

// 3. Zero client JS: no JS chunk references chart code.
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
  failed ? "\nCheckpoint 1 FAILED" : "\nCheckpoint 1 verified: RSC-static, zero client JS",
);
process.exit(failed ? 1 : 0);
